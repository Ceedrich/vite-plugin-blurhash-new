var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
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

// src/index.ts
import chalk from "chalk";
import { existsSync as existsSync2, readFileSync, rmSync, writeFileSync } from "fs";

// src/utils/getFilesRecursively.ts
import { readdirSync, statSync } from "fs";
import { join } from "path";
var isDirectory = (path) => statSync(path).isDirectory();
var isFile = (path) => statSync(path).isFile();
var getDirectories = (path) => readdirSync(path).map((name) => join(path, name)).filter(isDirectory).map((name) => name.replace(/\\/g, "/"));
var getFiles = (path) => readdirSync(path).map((name) => join(path, name)).filter(isFile).map((name) => name.replace(/\\/g, "/"));
var getFilesRecursively = (path) => {
  const dirs = getDirectories(path);
  const files = dirs.map((dir) => getFilesRecursively(dir)).reduce((a, b) => a.concat(b), []);
  return files.concat(getFiles(path));
};

// src/utils/mergeImagesAndImageDir.ts
import isImage from "is-image";
import { existsSync } from "fs";

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
      if (isImage(file)) {
        const fileName = file.split(imageDir).at(-1);
        img.push({ fileName, fileNameFull: file });
      }
    }
  }
  const cwd = process.cwd().replace(/\\/g, "/");
  return [
    ...img,
    ...Object.keys(images).reduce((filtered, key) => {
      if (isValidURL(images[key]) || existsSync(cwd + images[key]) && isImage(images[key])) {
        filtered.push({
          [key]: isValidURL(images[key]) ? images[key] : cwd + images[key]
        });
      }
      return filtered;
    }, [])
  ];
};

// src/utils/blur.ts
import sharp from "sharp";
import { encode } from "blurhash";
import axios from "axios";
var blur = async (src, callback) => {
  sharp(src).raw().ensureAlpha().resize(32, 32, { fit: "inside" }).toBuffer((err, buffer, info) => {
    if (err)
      callback(err);
    try {
      const hash = encode(
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
    axios.get(src).then((res) => {
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
  const imageDir = options.imageDir && existsSync2(cwd + options.imageDir) ? cwd + options.imageDir : false;
  const imagesToBlur = mergeImagesAndImageDir({
    images: (options == null ? void 0 : options.images) || {},
    imageDir
  });
  const mapPath = options.mapPath ? cwd + options.mapPath : false;
  let blurhashMapExists = mapPath ? existsSync2(mapPath) : false;
  if (mapPath && options.overrideMap && blurhashMapExists) {
    console.log(chalk.green(`Deleting ${mapPath}`));
    rmSync(mapPath);
    blurhashMapExists = false;
  }
  if (!blurhashMapExists && mapPath) {
    console.log(chalk.green(`Writing ${mapPath}`));
    writeFileSync(mapPath, "{}");
  }
  const blurhashMap = mapPath ? JSON.parse(readFileSync(mapPath, "utf-8")) : {};
  for (const image of imagesToBlur) {
    if (blurhashMap[image.fileName] != null)
      continue;
    blurhashThis(image.fileNameFull).then((hash) => {
      blurhashMap[image.fileName] = hash;
      if (mapPath)
        writeFileSync(mapPath, JSON.stringify(blurhashMap, null, 4));
      if (options.log)
        console.log(chalk.green(`\u2714 Finished hashing ${image.fileName}`));
    }).catch((err) => {
      if (options.log) {
        console.log(chalk.red(`\u2718 Failed hashing ${image.fileName}`));
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
export {
  blurhash,
  defineHashes
};
