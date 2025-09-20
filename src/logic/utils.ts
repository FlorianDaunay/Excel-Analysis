export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${(n / 1024 ** 3).toFixed(1)} GB`;
};
export const fmtDate = (ts: number) => new Date(ts).toLocaleString();

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export const numeric = (v: unknown): boolean =>
    typeof v === "number"
        ? true
        : (typeof v === "string" && v.trim() !== "" && !isNaN(+v));

export const toNumber = (v: unknown): number =>
    numeric(v) ? Number(v as string) : NaN;

export const uniqueCount = (arr: any[]) =>
    new Set(arr.filter(v => v !== null && v !== "")).size;

export const percentile = (arr: number[], p: number) => {
    const a = arr.slice().sort((x, y) => x - y);
    if (a.length === 0) return NaN;
    const idx = clamp((a.length - 1) * p, 0, a.length - 1);
    const i0 = Math.floor(idx), i1 = Math.ceil(idx), t = idx - i0;
    return a[i0] * (1 - t) + a[i1] * t;
};

export const mean = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / (arr.length || 1);
export const variance = (arr: number[]) => {
    const m = mean(arr);
    return arr.reduce((s, x) => s + (x - m) * (x - m), 0) / (arr.length - 1 || 1);
};
export const std = (arr: number[]) => Math.sqrt(variance(arr));

export const corr = (a: number[], b: number[]) => {
    const n = Math.min(a.length, b.length);
    if (n === 0) return NaN;
    const ax = a.slice(0, n), bx = b.slice(0, n);
    const ma = mean(ax), mb = mean(bx);
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
        const x = ax[i] - ma, y = bx[i] - mb;
        num += x * y; da += x * x; db += y * y;
    }
    return (da === 0 || db === 0) ? NaN : num / Math.sqrt(da * db);
};

export const fmt = (n: number) =>
    Number.isFinite(n)
        ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n)
        : "—";

export const fmtRange = (a: number, b: number) => `${fmt(a)} – ${fmt(b)}`;
