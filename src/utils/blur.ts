import sharp from "sharp";
import { encode } from "blurhash";
import axios from "axios";
import { isValidURL } from "./isValidURL";

const blur = async (src: string, callback: (err: Error | null, hash?: string) => any) => {
    sharp(src)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: "inside" })
        .toBuffer((err, buffer, info) => {
            if (err) callback(err);
            try {
                const hash = encode(
                    new Uint8ClampedArray(buffer),
                    info?.width,
                    info?.height,
                    4,
                    4
                );
                callback(null, hash);
            } catch (error) {
                callback(error as Error);
            }
        });
};

export const blurhashThis = async (src: string) =>
    new Promise((resolve, reject) => {
        if (isValidURL(src)) {
            axios.get(src).then((res) => {
                blur(res.data, (err, hash) => {
                    if (err) reject(err);
                    resolve(hash);
                }).catch((err) => reject(err));
            });
        } else
            blur(src, (err, hash) => {
                if (err) reject(err);
                resolve(hash);
            });
    });
