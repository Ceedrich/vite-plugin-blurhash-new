var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("utils/getFilesRecursively", ["require", "exports", "fs", "path"], function (require, exports, fs_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFilesRecursively = void 0;
    const isDirectory = (path) => (0, fs_1.statSync)(path).isDirectory();
    const isFile = (path) => (0, fs_1.statSync)(path).isFile();
    const getDirectories = (path) => (0, fs_1.readdirSync)(path)
        .map((name) => (0, path_1.join)(path, name))
        .filter(isDirectory)
        .map((name) => name.replace(/\\/g, "/"));
    const getFiles = (path) => (0, fs_1.readdirSync)(path)
        .map((name) => (0, path_1.join)(path, name))
        .filter(isFile)
        .map((name) => name.replace(/\\/g, "/"));
    const getFilesRecursively = (path) => {
        const dirs = getDirectories(path);
        const files = dirs
            .map((dir) => (0, exports.getFilesRecursively)(dir))
            .reduce((a, b) => a.concat(b), []);
        return files.concat(getFiles(path));
    };
    exports.getFilesRecursively = getFilesRecursively;
});
define("utils/isValidURL", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isValidURL = void 0;
    const isValidURL = (src) => {
        return /^((http|https|ftp):\/\/)/.test(src);
    };
    exports.isValidURL = isValidURL;
});
define("utils/mergeImagesAndImageDir", ["require", "exports", "utils/getFilesRecursively", "is-image", "fs", "utils/isValidURL"], function (require, exports, getFilesRecursively_1, is_image_1, fs_2, isValidURL_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeImagesAndImageDir = void 0;
    is_image_1 = __importDefault(is_image_1);
    const mergeImagesAndImageDir = ({ images, imageDir }) => {
        const img = [];
        if (imageDir) {
            const files = (0, getFilesRecursively_1.getFilesRecursively)(imageDir);
            for (const file of files) {
                if ((0, is_image_1.default)(file)) {
                    const fileName = file.split(imageDir).at(-1);
                    img.push({ fileName: file });
                }
            }
        }
        const cwd = process.cwd().replace(/\\/g, "/");
        return [
            ...img,
            ...Object.keys(images).reduce((filtered, key) => {
                if ((0, isValidURL_1.isValidURL)(images[key]) ||
                    ((0, fs_2.existsSync)(cwd + images[key]) && (0, is_image_1.default)(images[key]))) {
                    filtered.push({
                        [key]: (0, isValidURL_1.isValidURL)(images[key]) ? images[key] : cwd + images[key],
                    });
                }
                return filtered;
            }, []),
        ];
    };
    exports.mergeImagesAndImageDir = mergeImagesAndImageDir;
});
define("utils/blur", ["require", "exports", "sharp", "blurhash", "axios", "utils/isValidURL"], function (require, exports, sharp_1, blurhash_1, axios_1, isValidURL_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.blurhashThis = void 0;
    sharp_1 = __importDefault(sharp_1);
    axios_1 = __importDefault(axios_1);
    const blur = async (src, callback) => {
        (0, sharp_1.default)(src)
            .raw()
            .ensureAlpha()
            .resize(32, 32, { fit: "inside" })
            .toBuffer((err, buffer, info) => {
            if (err)
                callback(err);
            try {
                const hash = (0, blurhash_1.encode)(new Uint8ClampedArray(buffer), info === null || info === void 0 ? void 0 : info.width, info === null || info === void 0 ? void 0 : info.height, 4, 4);
                callback(null, hash);
            }
            catch (error) {
                callback(error);
            }
        });
    };
    const blurhashThis = async (src) => new Promise((resolve, reject) => {
        if ((0, isValidURL_2.isValidURL)(src)) {
            axios_1.default.get(src).then((res) => {
                blur(res.data, (err, hash) => {
                    if (err)
                        reject(err);
                    resolve(hash);
                }).catch((err) => reject(err));
            });
        }
        else
            blur(src, (err, hash) => {
                if (err)
                    reject(err);
                resolve(hash);
            });
    });
    exports.blurhashThis = blurhashThis;
});
define("index", ["require", "exports", "chalk", "fs", "utils/mergeImagesAndImageDir", "utils/blur"], function (require, exports, chalk_1, fs_3, mergeImagesAndImageDir_1, blur_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.blurhash = exports.defineHashes = void 0;
    chalk_1 = __importDefault(chalk_1);
    const defineHashes = (options) => {
        const cwd = process.cwd().replace(/\\/g, "/");
        const imageDir = options.imageDir && (0, fs_3.existsSync)(cwd + options.imageDir)
            ? cwd + options.imageDir
            : false;
        const imagesToBlur = (0, mergeImagesAndImageDir_1.mergeImagesAndImageDir)({
            images: (options === null || options === void 0 ? void 0 : options.images) || {},
            imageDir: imageDir,
        });
        const mapPath = options.mapPath ? cwd + options.mapPath : false;
        let blurhashMapExists = mapPath ? (0, fs_3.existsSync)(mapPath) : false;
        if (mapPath && options.overrideMap && blurhashMapExists) {
            console.log(chalk_1.default.green(`Deleting ${mapPath}`));
            (0, fs_3.rmSync)(mapPath);
            blurhashMapExists = false;
        }
        if (!blurhashMapExists && mapPath) {
            console.log(chalk_1.default.green(`Writing ${mapPath}`));
            (0, fs_3.writeFileSync)(mapPath, "{}");
        }
        const blurhashMap = mapPath ? JSON.parse((0, fs_3.readFileSync)(mapPath, "utf-8")) : {};
        for (const image of imagesToBlur) {
            if (blurhashMap[image.fileName] != null)
                continue;
            (0, blur_1.blurhashThis)(image.fileName)
                .then((hash) => {
                blurhashMap[image.fileName] = JSON.stringify(hash);
                if (mapPath)
                    (0, fs_3.writeFileSync)(mapPath, JSON.stringify(blurhashMap, null, 4));
                if (options.log)
                    console.log(chalk_1.default.green(`✔ Finished hashing ${image.fileName}`));
            })
                .catch((err) => {
                if (options.log) {
                    console.log(chalk_1.default.red(`✘ Failed hashing ${image.fileName}`));
                    console.log(err);
                }
            });
        }
        if (!options.define)
            return {};
        return {
            define: Object.assign({}, blurhashMap),
        };
    };
    exports.defineHashes = defineHashes;
    function blurhash(options) {
        const setoptions = Object.assign({ define: false, imageDir: "/src/assets/images", mapPath: "/src/assets/images/blurhash-map.json", overrideMap: true, log: true }, options);
        return {
            name: "blurhash",
            buildStart() { },
            handleHotUpdate() { },
            config: () => {
                return (0, exports.defineHashes)(setoptions); //Create blurhash strings if needed, and add them to the config: define
            },
        };
    }
    exports.blurhash = blurhash;
});
