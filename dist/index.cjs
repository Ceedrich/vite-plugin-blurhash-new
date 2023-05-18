"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  blurhash: () => blurhash,
  defineHashes: () => defineHashes
});
module.exports = __toCommonJS(src_exports);
var import_chalk = __toESM(require("chalk"), 1);
var import_fs3 = require("fs");

// src/utils/getFilesRecursively.ts
var import_fs = require("fs");
var import_path = require("path");
var isDirectory = (path) => (0, import_fs.statSync)(path).isDirectory();
var isFile = (path) => (0, import_fs.statSync)(path).isFile();
var getDirectories = (path) => (0, import_fs.readdirSync)(path).map((name) => (0, import_path.join)(path, name)).filter(isDirectory).map((name) => name.replace(/\\/g, "/"));
var getFiles = (path) => (0, import_fs.readdirSync)(path).map((name) => (0, import_path.join)(path, name)).filter(isFile).map((name) => name.replace(/\\/g, "/"));
var getFilesRecursively = (path) => {
  const dirs = getDirectories(path);
  const files = dirs.map((dir) => getFilesRecursively(dir)).reduce((a, b) => a.concat(b), []);
  return files.concat(getFiles(path));
};

// src/utils/mergeImagesAndImageDir.ts
var import_is_image = __toESM(require("is-image"), 1);
var import_fs2 = require("fs");

// src/utils/isValidURL.ts
var isValidURL = (src) => {
  return /^((http|https|ftp):\/\/)/.test(src);
};

// src/utils/mergeImagesAndImageDir.ts
var mergeImagesAndImageDir = ({ images, imageDir }) => {
  const img = [];
  if (imageDir) {
    const files = getFilesRecursively(imageDir);
    for (const file of files) {
      if ((0, import_is_image.default)(file)) {
        img.push({ fileName: file });
      }
    }
  }
  const cwd = process.cwd().replace(/\\/g, "/");
  return [
    ...img,
    ...Object.keys(images).reduce((filtered, key) => {
      if (isValidURL(images[key]) || (0, import_fs2.existsSync)(cwd + images[key]) && (0, import_is_image.default)(images[key])) {
        filtered.push({
          [key]: isValidURL(images[key]) ? images[key] : cwd + images[key]
        });
      }
      return filtered;
    }, [])
  ];
};

// src/utils/blur.ts
var import_sharp = __toESM(require("sharp"), 1);
var import_blurhash = require("blurhash");
var import_axios = __toESM(require("axios"), 1);
var blur = async (src, callback) => {
  (0, import_sharp.default)(src).raw().ensureAlpha().resize(32, 32, { fit: "inside" }).toBuffer((err, buffer, info) => {
    if (err)
      callback(err);
    try {
      const hash = (0, import_blurhash.encode)(
        new Uint8ClampedArray(buffer),
        info == null ? void 0 : info.width,
        info == null ? void 0 : info.height,
        4,
        4
      );
      callback(null, hash);
    } catch (error) {
      callback(error);
    }
  });
};
var blurhashThis = async (src) => new Promise((resolve, reject) => {
  if (isValidURL(src)) {
    import_axios.default.get(src).then((res) => {
      blur(res.data, (err, hash) => {
        if (err)
          reject(err);
        resolve(hash);
      }).catch((err) => reject(err));
    });
  } else
    blur(src, (err, hash) => {
      if (err)
        reject(err);
      resolve(hash);
    });
});

// src/index.ts
var defineHashes = (options) => {
  const cwd = process.cwd().replace(/\\/g, "/");
  const imageDir = options.imageDir && (0, import_fs3.existsSync)(cwd + options.imageDir) ? cwd + options.imageDir : false;
  const imagesToBlur = mergeImagesAndImageDir({
    images: (options == null ? void 0 : options.images) || {},
    imageDir
  });
  const mapPath = options.mapPath ? cwd + options.mapPath : false;
  let blurhashMapExists = mapPath ? (0, import_fs3.existsSync)(mapPath) : false;
  if (mapPath && options.overrideMap && blurhashMapExists) {
    console.log(import_chalk.default.green(`Deleting ${mapPath}`));
    (0, import_fs3.rmSync)(mapPath);
    blurhashMapExists = false;
  }
  if (!blurhashMapExists && mapPath) {
    console.log(import_chalk.default.green(`Writing ${mapPath}`));
    (0, import_fs3.writeFileSync)(mapPath, "{}");
  }
  const blurhashMap = mapPath ? JSON.parse((0, import_fs3.readFileSync)(mapPath, "utf-8")) : {};
  for (const image of imagesToBlur) {
    if (blurhashMap[image.fileName] != null)
      continue;
    blurhashThis(`${options.imageDir}/${image.fileName}`).then((hash) => {
      blurhashMap[image.fileName] = hash;
      if (mapPath)
        (0, import_fs3.writeFileSync)(mapPath, JSON.stringify(blurhashMap, null, 4));
      if (options.log)
        console.log(import_chalk.default.green(`\u2714 Finished hashing ${image.fileName}`));
    }).catch((err) => {
      if (options.log) {
        console.log(import_chalk.default.red(`\u2718 Failed hashing ${image.fileName}`));
        console.log(err);
      }
    });
  }
  if (!options.define)
    return {};
  return {
    define: __spreadValues({}, blurhashMap)
  };
};
function blurhash(options) {
  const setoptions = __spreadValues({
    define: false,
    imageDir: "/src/assets/images",
    mapPath: "/src/assets/images/blurhash-map.json",
    overrideMap: true,
    log: true
  }, options);
  return {
    name: "blurhash",
    buildStart() {
    },
    //Calls the plugin config function on build start
    handleHotUpdate() {
    },
    //Calls the plugin config function on hot update
    config: () => {
      return defineHashes(setoptions);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  blurhash,
  defineHashes
});
