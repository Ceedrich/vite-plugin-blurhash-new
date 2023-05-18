import { readdirSync, statSync } from "fs";
import { join } from "path";

const isDirectory = (path: string): boolean => statSync(path).isDirectory();
const isFile = (path: string): boolean => statSync(path).isFile();

const getDirectories = (path: string): string[] =>
    readdirSync(path)
        .map((name) => join(path, name))
        .filter(isDirectory)
        .map((name) => name.replace(/\\/g, "/"));

const getFiles = (path: string): string[] =>
    readdirSync(path)
        .map((name) => join(path, name))
        .filter(isFile)
        .map((name) => name.replace(/\\/g, "/"));

export const getFilesRecursively = (path: string): string[] => {
    const dirs = getDirectories(path);
    const files = dirs
        .map((dir) => getFilesRecursively(dir))
        .reduce((a, b) => a.concat(b), []);

    return files.concat(getFiles(path));
};
