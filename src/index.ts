import type { Plugin } from "vite";
import chalk from "chalk";
import { Options } from "./types";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { mergeImagesAndImageDir } from "./utils/mergeImagesAndImageDir";
import { blurhashThis } from "./utils/blur";

export const defineHashes = (
    options: Options
): { define?: { [key: string]: string } } => {
    const cwd = process.cwd().replace(/\\/g, "/");

    const imageDir =
        options.imageDir && existsSync(cwd + options.imageDir)
            ? cwd + options.imageDir
            : false;

    const imagesToBlur = mergeImagesAndImageDir({
        images: options?.images || {},
        imageDir: imageDir,
    });

    const mapPath = options.mapPath ? cwd + options.mapPath : false;
    let blurhashMapExists = mapPath ? existsSync(mapPath) : false;

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
        if (blurhashMap[image.fileName] != null) continue;

        blurhashThis(image.fileNameFull)
            .then((hash) => {
                blurhashMap[image.fileName] = hash;
                if (mapPath) writeFileSync(mapPath, JSON.stringify(blurhashMap, null, 4));
                if (options.log)
                    console.log(chalk.green(`✔ Finished hashing ${image.fileName}`));
            })
            .catch((err) => {
                if (options.log) {
                    console.log(chalk.red(`✘ Failed hashing ${image.fileName}`));
                    console.log(err);
                }
            });
    }

    if (!options.define) return {};

    return {
        define: {
            ...blurhashMap,
        },
    };
};

export function blurhash(options: Options): Plugin {
    const setoptions: Options = {
        define: false,
        imageDir: "/src/assets/images",
        mapPath: "/src/assets/images/blurhash-map.json",
        overrideMap: true,
        log: true,
        ...options,
    };

    return {
        name: "blurhash",
        buildStart() {}, //Calls the plugin config function on build start
        handleHotUpdate() {}, //Calls the plugin config function on hot update
        config: () => {
            return defineHashes(setoptions); //Create blurhash strings if needed, and add them to the config: define
        },
    };
}
