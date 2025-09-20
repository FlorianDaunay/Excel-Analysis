import * as XLSX from "xlsx";
import { uid } from "./utils";
import type { AppFile } from "../types/app";

export async function parseFile(file: File): Promise<AppFile> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", raw: true, cellDates: true });

    const sheets: AppFile["sheets"] = {};
    const order: string[] = [];

    for (const name of wb.SheetNames) {
        const ws = wb.Sheets[name];
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
        const [headerRow = [], ...rows] = aoa;

        // Trim trailing completely empty rows
        while (rows.length && rows[rows.length - 1].every(v => v === null || v === "")) rows.pop();

        const headers = headerRow.map((h: any, i: number) => (h ?? `col_${i + 1}`) + "");
        sheets[name] = { name, headers, rows };
        order.push(name);
    }

    return {
        id: uid(),
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        sheets,
        sheetOrder: order,
    };
}
