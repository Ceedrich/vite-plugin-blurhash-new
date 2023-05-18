import { Plugin } from 'vite';

type Images = {
    [key: string]: string;
};
type Options = {
    imageDir?: string | boolean;
    mapPath?: string | boolean;
    overrideMap?: boolean;
    define?: boolean;
    images?: Images;
    log?: boolean;
};

declare const defineHashes: (options: Options) => {
    define?: {
        [key: string]: string;
    } | undefined;
};
declare function blurhash(options: Options): Plugin;

export { blurhash, defineHashes };
