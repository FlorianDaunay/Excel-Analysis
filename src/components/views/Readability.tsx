import React from "react";
import type { AppFile } from "../../types/app";
import { missingness, tabularQuality } from "../../logic/analysis";
import Collapsible from "../Collapsible";

export default function Readability({ file }: { file: AppFile }) {
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(
        () => Object.fromEntries(file.sheetOrder.map((s, i) => [s, i === 0]))
    );
    const setAll = (v: boolean) => setOpenMap(Object.fromEntries(file.sheetOrder.map(s => [s, v])));

    return (
        <div className="vstack">
            <div className="view-controls">
                <button className="btn small" onClick={() => setAll(true)}>Expand all</button>
                <button className="btn small" onClick={() => setAll(false)}>Collapse all</button>
            </div>

            {file.sheetOrder.map(sName => {
                const s = file.sheets[sName];
                const qual = tabularQuality(s.rows);
                const miss = missingness(s.headers, s.rows);

                return (
                    <Collapsible
                        key={sName}
                        title={`Sheet: ${s.name}`}
                        open={!!openMap[sName]}
                        onToggle={() => setOpenMap(m => ({ ...m, [sName]: !m[sName] }))}
                    >
                        <div className="hstack">
                            <span className={`badge ${qual.uniformity > 0.95 ? 'ok' : qual.uniformity > 0.8 ? 'warn' : 'bad'}`}>Uniformity {(100 * qual.uniformity).toFixed(0)}%</span>
                            <span className={`badge ${miss.overall < 0.1 ? 'ok' : miss.overall < 0.3 ? 'warn' : 'bad'}`}>Missing {(100 * miss.overall).toFixed(1)}%</span>
                            <span className="small">Avg row length: {qual.avgRowLen.toFixed(1)} (σ {qual.stdevRowLen.toFixed(1)})</span>
                        </div>

                        <table className="table">
                            <thead><tr><th>Column</th><th className="num">% Missing</th></tr></thead>
                            <tbody>
                                {miss.byCol.map(c => (
                                    <tr key={c.name}><td>{c.name}</td><td className="num">{(100 * c.rate).toFixed(1)}%</td></tr>
                                ))}
                            </tbody>
                        </table>

                        <Heatmap headers={s.headers} rows={s.rows} />
                    </Collapsible>
                );
            })}
        </div>
    );
}

// Heatmap stays the same as before
function Heatmap({ headers, rows }: { headers: string[]; rows: any[][] }) {
    const MAX_PREVIEW = 20;
    const MAX_FULL = 1000;

    const [expanded, setExpanded] = React.useState(false);
    const nRows = Math.min(rows.length, expanded ? MAX_FULL : MAX_PREVIEW);

    return (
        <div className="vstack">
            <div className="small">
                Missingness heatmap (showing {nRows}{rows.length > nRows ? ` of ${Math.min(rows.length, MAX_FULL)}` : ""} rows)
            </div>
            <div className="heatmap" style={{ gridTemplateColumns: `repeat(${headers.length}, 14px)` }}>
                {Array.from({ length: nRows }).flatMap((_, r) =>
                    headers.map((_, c) => {
                        const v = rows[r]?.[c];
                        const cls = v === null || v === "" ? "na" : "ok";
                        return <div key={`${r}-${c}`} className={`cell ${cls}`} title={`r${r + 1}/c${c + 1}`} />;
                    })
                )}
            </div>
            <div className="hstack">
                <button className="btn small" onClick={() => setExpanded(e => !e)}>
                    {expanded ? `Collapse to ${Math.min(rows.length, MAX_PREVIEW)}` : `Expand to ${Math.min(rows.length, MAX_FULL)}`}
                </button>
            </div>
            <div className="legend small">
                <span className="box" style={{ background: '#1f6a3c' }}></span> non-null
                <span className="box" style={{ background: '#7a1b1b', marginLeft: 10 }}></span> null
            </div>
        </div>
    );
}
