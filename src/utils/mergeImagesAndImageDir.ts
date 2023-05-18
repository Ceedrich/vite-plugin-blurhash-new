import { getFilesRecursively } from "./getFilesRecursively";
import type { Images } from "../types";
import isImage from "is-image";
import { existsSync } from "fs";
import { isValidURL } from "./isValidURL";

type args = {
    images: Images;
    imageDir: string | false;
};

export const mergeImagesAndImageDir = ({ images, imageDir }: args) => {
    const img = [];
    if (imageDir) {
        const files = getFilesRecursively(imageDir);
        for (const file of files) {
            if (isImage(file)) {
                const fileName = file.split(imageDir).at(-1) as string;
                img.push({ fileName });
            }
        }
    }

    const cwd = process.cwd().replace(/\\/g, "/");

    return [
        ...img,
        ...Object.keys(images).reduce<{ [key: string]: string }[]>((filtered, key) => {
            if (
                isValidURL(images[key]) ||
                (existsSync(cwd + images[key]) && isImage(images[key]))
            ) {
                filtered.push({
                    [key]: isValidURL(images[key]) ? images[key] : cwd + images[key],
                });
            }
            return filtered;
        }, []),
    ];
};
