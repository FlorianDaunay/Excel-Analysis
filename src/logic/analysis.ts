import { corr, mean, percentile, std, toNumber, uniqueCount } from "./utils";

export function profileColumns(headers: string[], rows: any[][]) {
    const cols = headers.map((_, i) => rows.map(r => r[i]));
    return cols.map((values, i) => {
        const nonNull = values.filter(v => v !== null && v !== "");
        const emptyRate = 1 - (nonNull.length / (values.length || 1));

        const nums = nonNull.map(toNumber).filter(x => !isNaN(x));
        const numericShare = nonNull.length ? nums.length / nonNull.length : 0;

        const dates = nonNull.filter(v => (v instanceof Date) || (typeof v === "string" && !isNaN(Date.parse(v))));
        const dateShare = nonNull.length ? dates.length / nonNull.length : 0;

        let kind: "text" | "number" | "date" = "text";
        if (numericShare > 0.95) kind = "number";
        else if (dateShare > 0.95) kind = "date";

        const uniques = uniqueCount(nonNull);

        const stats: Record<string, number> = {};
        if (kind === "number" && nums.length) {
            const a = nums.slice().sort((x, y) => x - y);
            stats.count = a.length;
            stats.mean = mean(a);
            stats.std = std(a);
            stats.min = a[0];
            stats.p25 = percentile(a, .25);
            stats.p50 = percentile(a, .5);
            stats.p75 = percentile(a, .75);
            stats.max = a[a.length - 1];
        }

        return { name: headers[i], kind, rows: values.length, nonNull: nonNull.length, emptyRate, uniques, numericShare, dateShare, stats };
    });
}

export function correlationMatrix(headers: string[], rows: any[][]) {
    const cols = headers.map((_, i) => rows.map(r => r[i]));
    const numericCols = cols
        .map((values, i) => ({ i, name: headers[i], numbers: values.map(toNumber).filter(x => !isNaN(x)) }))
        .filter(c => c.numbers.length > 4);

    const names = numericCols.map(c => c.name);
    const n = numericCols.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(NaN));

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const a = numericCols[i].numbers;
            const b = numericCols[j].numbers;
            const c = corr(a, b);
            matrix[i][j] = matrix[j][i] = c;
        }
    }
    return { names, matrix };
}

export function tabularQuality(rows: any[][]) {
    if (!rows.length) return { avgRowLen: 0, stdevRowLen: 0, uniformity: 1 };
    const lens = rows.map(r => r.length);
    const m = mean(lens);
    const s = std(lens);
    const uniformity = m ? 1 - (s / m) : 1;
    return { avgRowLen: m, stdevRowLen: s, uniformity };
}

export function duplicatesAndKeys(headers: string[], rows: any[][]) {
    const total = rows.length;
    let dupRowCount = 0;
    {
        const seen = new Set<string>();
        for (const r of rows) {
            const k = JSON.stringify(r);
            if (seen.has(k)) dupRowCount++; else seen.add(k);
        }
    }
    const candidates: { index: number; name: string }[] = [];
    headers.forEach((_, idx) => {
        const col = rows.map(r => r[idx]).filter(v => v !== null && v !== "");
        const uniq = new Set(col).size;
        if (uniq === col.length && col.length > 0) candidates.push({ index: idx, name: headers[idx] });
    });
    return { dupRowCount, total, candidates };
}

export function missingness(headers: string[], rows: any[][]) {
    const validRows = rows.filter(r => r.some(v => v !== null && v !== ""));
    const byCol = headers.map((_, i) => {
        const vals = validRows.map(r => r[i]);
        const miss = vals.filter(v => v === null || v === "").length;
        return { name: headers[i], rate: (miss / (validRows.length || 1)), missing: miss };
    });
    const overall = byCol.reduce((s, c) => s + c.missing, 0) / ((validRows.length * headers.length) || 1);
    return { byCol, overall };
}

// === DISTRIBUTIONS ===
export function histogram(values: number[], binCount = 20) {
    const arr = values.filter(v => Number.isFinite(v));
    if (!arr.length) return { bins: [], counts: [], min: NaN, max: NaN };
    const min = Math.min(...arr), max = Math.max(...arr);
    const width = (max - min) || 1;
    const bins = Array.from({ length: binCount }, (_, i) => min + (i * width) / binCount);
    const counts = Array(binCount).fill(0);
    for (const v of arr) {
        let idx = Math.floor(((v - min) / width) * binCount);
        if (idx === binCount) idx = binCount - 1; // edge case at max
        counts[idx]++;
    }
    return { bins, counts, min, max };
}

export function topCategories(values: unknown[], topN = 10) {
    const freq = new Map<string, number>();
    let nonNull = 0;
    for (const v of values) {
        if (v === null || v === "") continue;
        nonNull++;
        const key = String(v);
        freq.set(key, (freq.get(key) || 0) + 1);
    }
    const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
    const items = sorted.slice(0, topN).map(([k, c]) => ({
        value: k,
        count: c,
        pct: nonNull ? c / nonNull : 0,
    }));
    return { items, nonNullCount: nonNull, uniqueCount: freq.size };
}
export function stringStats(values: unknown[]) {
    const s = values
        .filter(v => v !== null && v !== "")
        .map(v => String(v));
    const lens = s.map(x => x.length);
    const hasDigits = s.filter(x => /\d/.test(x)).length;
    const hasAlpha = s.filter(x => /[A-Za-z]/.test(x)).length;
    const hasSpecial = s.filter(x => /[^A-Za-z0-9\s]/.test(x)).length;
    return {
        count: s.length,
        minLen: lens.length ? Math.min(...lens) : 0,
        maxLen: lens.length ? Math.max(...lens) : 0,
        meanLen: lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0,
        pctDigits: s.length ? hasDigits / s.length : 0,
        pctAlpha: s.length ? hasAlpha / s.length : 0,
        pctSpecial: s.length ? hasSpecial / s.length : 0,
    };
}

// === OUTLIERS ===
export function iqrFence(values: number[]) {
    const v = values.filter(x => Number.isFinite(x)).sort((a, b) => a - b);
    if (!v.length) return { q1: NaN, q3: NaN, iqr: NaN, low: NaN, high: NaN };
    const q1 = percentile(v, 0.25), q3 = percentile(v, 0.75);
    const iqr = q3 - q1;
    const low = q1 - 1.5 * iqr;
    const high = q3 + 1.5 * iqr;
    return { q1, q3, iqr, low, high };
}

export function zscoreOutliers(values: number[], z = 3) {
    const v = values.filter(x => Number.isFinite(x));
    const m = mean(v), s = std(v);
    if (!v.length || !Number.isFinite(s) || s === 0) return { count: 0, idx: [] as number[] };
    const idx: number[] = [];
    for (let i = 0; i < v.length; i++) {
        const zc = Math.abs((v[i] - m) / s);
        if (zc > z) idx.push(i);
    }
    return { count: idx.length, idx };
}

export function detectOutliersByColumn(headers: string[], rows: any[][]) {
    // For each numeric column: IQR and Z-score counts
    return headers.map((h, i) => {
        const colNums = rows.map(r => r[i]).map(x => (typeof x === 'number' ? x : (typeof x === 'string' && x.trim() !== '' && !isNaN(+x) ? +x : NaN)));
        const numbers = colNums.filter(x => Number.isFinite(x)) as number[];
        if (numbers.length < 5) {
            return { name: h, numeric: false, countIQR: 0, countZ: 0, low: NaN, high: NaN };
        }
        const fence = iqrFence(numbers);
        const countIQR = numbers.filter(v => v < fence.low || v > fence.high).length;
        const zres = zscoreOutliers(numbers, 3);
        return { name: h, numeric: true, countIQR, countZ: zres.count, low: fence.low, high: fence.high };
    });
}
