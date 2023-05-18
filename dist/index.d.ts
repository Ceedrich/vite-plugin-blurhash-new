declare module "types" {
    export type Images = {
        [key: string]: string;
    };
    export type Options = {
        imageDir?: string | boolean;
        mapPath?: string | boolean;
        overrideMap?: boolean;
        define?: boolean;
        images?: Images;
        log?: boolean;
    };
}
declare module "utils/getFilesRecursively" {
    export const getFilesRecursively: (path: string) => string[];
}
declare module "utils/isValidURL" {
    export const isValidURL: (src: string) => boolean;
}
declare module "utils/mergeImagesAndImageDir" {
    import type { Images } from "types";
    type args = {
        images: Images;
        imageDir: string | false;
    };
    export const mergeImagesAndImageDir: ({ images, imageDir }: args) => ({
        [key: string]: string;
    } | {
        fileName: string;
    })[];
}
declare module "utils/blur" {
    export const blurhashThis: (src: string) => Promise<unknown>;
}
declare module "index" {
    import type { Plugin } from "vite";
    import { Options } from "types";
    export const defineHashes: (options: Options) => {
        define?: {
            [key: string]: string;
        } | undefined;
    };
    export function blurhash(options: Options): Plugin;
}
