import type { AppFile } from "../types/app";

export const state: {
    files: Record<string, AppFile>;
    order: string[];
    currentFileId: string | null;
} = {
    files: {},
    order: [],
    currentFileId: null,
};
