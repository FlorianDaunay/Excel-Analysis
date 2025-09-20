import React from "react";
import type { AppFile } from "../../types/app";
import { histogram, topCategories, missingness, iqrFence } from "../../logic/analysis";
import { toNumber, mean, percentile, std, fmt, fmtRange } from "../../logic/utils";
import Collapsible from "../Collapsible";
import InfoChip from "../InfoChip";


export default function Distributions({ file }: { file: AppFile }) {
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(
        () => Object.fromEntries(file.sheetOrder.map((s, i) => [s, i === 0]))
    );
    const setAll = (v: boolean) =>
        setOpenMap(Object.fromEntries(file.sheetOrder.map((s) => [s, v])));

    return (
        <div className="vstack">
            <div className="view-controls">
                <button className="btn small" onClick={() => setAll(true)}>Expand all</button>
                <button className="btn small" onClick={() => setAll(false)}>Collapse all</button>
            </div>

            {file.sheetOrder.map((sName) => (
                <SheetDistributions
                    key={sName}
                    sheet={file.sheets[sName]}
                    open={!!openMap[sName]}
                    onToggle={() => setOpenMap((m) => ({ ...m, [sName]: !m[sName] }))}
                />
            ))}
        </div>
    );
}

function SheetDistributions({
    sheet,
    open,
    onToggle,
}: {
    sheet: AppFile["sheets"][string];
    open: boolean;
    onToggle: () => void;
}) {
    const miss = missingness(sheet.headers, sheet.rows);
    const [bins, setBins] = React.useState(20); // sheet-level bin count
    const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>({});

    return (
        <Collapsible
            title={`Distributions — ${sheet.name}`}
            open={open}
            onToggle={onToggle}
        >
            <div className="hstack">
                <div className="small">Overall missing: {(100 * miss.overall).toFixed(1)}%</div>
                <div className="small">·</div>
                <label className="small">
                    Bins:{" "}
                    <select
                        className="btn small"
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value, 10))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                    </select>
                </label>
            </div>

            {/* NUMERIC HISTOGRAMS */}
            <div className="section vstack">
                <div className="title">Numeric columns</div>
                <div className="grid cols-3">
                    {sheet.headers.map((h, i) => {
                        const numbers = sheet.rows.map(r => toNumber(r[i])).filter(x => !isNaN(x)) as number[];
                        if (numbers.length < 2) return null;

                        const { bins: edges, counts, min, max } = histogram(numbers, bins);
                        const maxCount = Math.max(1, ...counts);
                        const p25 = percentile(numbers, 0.25);
                        const med = percentile(numbers, 0.5);
                        const p75 = percentile(numbers, 0.75);
                        const mu = mean(numbers);
                        const sd = std(numbers);
                        const iqr = iqrFence(numbers);
                        const outIQR = numbers.filter(v => v < iqr.low || v > iqr.high).length;

                        const [openDtl, setOpenDtl] = React.useState(false);

                        return (
                            <div key={h} className="vstack" style={{ padding: "8px 6px", border: "1px solid var(--border)", borderRadius: "12px", background: "#121622" }}>
                                <div className="small" style={{ fontWeight: 700 }}>{h} <span className="small" style={{ opacity: .7 }}>(n={numbers.length})</span></div>

                                <HistogramSVG
                                    edges={edges} counts={counts} maxCount={maxCount}
                                    min={min} max={max} mean={mu} median={med}
                                />
                                <div className="hist-caption">mean (solid) · median (dashed)</div>

                                {/* key stats as chips */}
                                <div className="chips">
                                    <InfoChip
                                        label="Mean"
                                        value={fmt(mu)}
                                        help="The average: add all values together and divide by how many there are."
                                    />
                                    <InfoChip
                                        label="Std dev"
                                        value={fmt(sd)}
                                        help="How spread out the values are around the average. A larger number means more variability."
                                    />
                                    <InfoChip
                                        label="Middle 50%"
                                        value={fmtRange(p25, p75)}
                                        help="Half of the values lie between these two numbers (25th to 75th percentile)."
                                    />
                                    <InfoChip
                                        label="Unusual values"
                                        value={String(outIQR)}
                                        help="Values that are unusually low or high compared to most others, based on how wide the middle of the data is."
                                        tone={outIQR > Math.max(1, numbers.length * 0.1) ? "bad" : (outIQR > 0 ? "warn" : "default")}
                                    />
                                </div>

                                {/* compact “more” row */}
                                <div>
                                    <button className="details-btn" onClick={() => setOpenDtl(v => !v)}>
                                        {openDtl ? "Hide details" : "More details"}
                                    </button>
                                    {openDtl && (
                                        <div className="chips" style={{ marginTop: 6 }}>
                                            <InfoChip
                                                label="Min–Max"
                                                value={fmtRange(min, max)}
                                                help="The smallest and largest observed values."
                                            />
                                            <InfoChip
                                                label="Median"
                                                value={fmt(med)}
                                                help="The middle value when all numbers are sorted from smallest to largest."
                                            />
                                            <InfoChip
                                                label="Bins"
                                                value={String(counts.length)}
                                                help="How many bars are used to draw the histogram chart."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CATEGORICAL TOPS */}
            <div className="section vstack">
                <div className="title">Categorical columns (top values)</div>
                <div className="grid cols-2">
                    {sheet.headers.map((h, i) => {
                        const col = sheet.rows.map((r) => r[i]);
                        const numsShare = col.map(toNumber).filter((x) => !isNaN(x)).length / (col.length || 1);
                        if (numsShare > 0.5) return null; // mostly numeric → skip

                        const expanded = !!expandedCats[h];
                        const limit = expanded ? 1000 : 8;
                        const top = topCategories(col, limit);
                        const showing = top.items.length;

                        if (!showing) return null;

                        return (
                            <div key={h} className="vstack">
                                <div className="hstack">
                                    <div className="small">
                                        {h} (showing {showing} of {top.uniqueCount} unique{showing < top.uniqueCount ? " — limited" : ""})
                                    </div>
                                    {top.uniqueCount > 8 && (
                                        <button
                                            className="btn small"
                                            onClick={() =>
                                                setExpandedCats((m) => ({ ...m, [h]: !m[h] }))
                                            }
                                        >
                                            {expanded ? "Collapse" : "Show all"}
                                        </button>
                                    )}
                                </div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Value</th>
                                            <th className="num">Count</th>
                                            <th className="num">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {top.items.map((it) => (
                                            <tr key={it.value}>
                                                <td>{it.value}</td>
                                                <td className="num">{it.count}</td>
                                                <td className="num">{(100 * it.pct).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Collapsible>
    );
}

/** Histogram SVG with mean/median overlays + bin tooltips */
function HistogramSVG({
    edges,
    counts,
    maxCount,
    min,
    max,
    mean,
    median,
}: {
    edges: number[];
    counts: number[];
    maxCount: number;
    min: number;
    max: number;
    mean: number;
    median: number;
}) {
    const width = 360, height = 120, pad = 6;
    const barW = (width - pad * 2) / Math.max(1, counts.length);

    const scaleX = (v: number) =>
        pad + ((v - min) / Math.max(1e-12, max - min)) * (width - pad * 2);

    const MEAN_COLOR = "#f59e0b"; // amber
    const MEDIAN_COLOR = "#22c55e"; // green

    // helper to draw a labeled vertical line with a subtle halo
    const VLine = ({
        x,
        color,
        label,
        dy
    }: { x: number; color: string; label: string; dy: number }) => (
        <>
            {/* halo */}
            <line x1={x} x2={x} y1={pad} y2={height - pad}
                stroke="black" strokeOpacity="0.35" strokeWidth={4} />
            {/* main */}
            <line x1={x} x2={x} y1={pad} y2={height - pad}
                stroke={color} strokeWidth={2} strokeDasharray={label === "median" ? "4 3" : undefined} />
            {/* tiny pill label */}
            <g transform={`translate(${x + 4}, ${dy})`}>
                <rect x={-2} y={-9} rx="4" ry="4" width={38} height={14}
                    fill="rgba(0,0,0,.55)" stroke={color} strokeOpacity="0.6" />
                <text x={2} y={2} fontSize="10" fill={color}>{label}</text>
            </g>
        </>
    );

    return (
        <svg width={width} height={height} role="img" aria-label="Histogram">
            {/* Bars */}
            {counts.map((c, i) => {
                const h = maxCount ? (c / maxCount) * (height - pad * 2) : 0;
                const x = pad + i * barW;
                const y = height - pad - h;
                const e0 = edges[i];
                const e1 = i === counts.length - 1 ? max : edges[i + 1];
                const title = `${e0.toFixed(3)} – ${e1.toFixed(3)} : ${c}`;
                return (
                    <g key={i}>
                        <title>{title}</title>
                        <rect
                            x={x}
                            y={y}
                            width={Math.max(1, barW - 1)}
                            height={h}
                            fill="currentColor"
                            opacity="0.78"
                        />
                    </g>
                );
            })}

            {/* Mean (solid) + Median (dashed) with labels */}
            <VLine x={scaleX(mean)} color={MEAN_COLOR} label="mean" dy={12} />
            <VLine x={scaleX(median)} color={MEDIAN_COLOR} label="median" dy={28} />

            {/* Frame */}
            <rect x="0" y="0" width={width} height={height}
                fill="none" stroke="rgba(255,255,255,0.08)" />
        </svg>
    );
}
