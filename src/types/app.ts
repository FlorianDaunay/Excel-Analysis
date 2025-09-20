export type AppSheet = {
    name: string;
    headers: string[];
    rows: any[][];
};

export type AppFile = {
    id: string;
    name: string;
    size: number;
    lastModified: number;
    sheets: Record<string, AppSheet>;
    sheetOrder: string[];
};
