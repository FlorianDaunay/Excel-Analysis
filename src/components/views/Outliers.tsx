import React from "react";
import type { AppFile } from "../../types/app";
import { detectOutliersByColumn, profileColumns } from "../../logic/analysis";
import Collapsible from "../Collapsible";
import { toNumber } from "../../logic/utils";

export default function Outliers({ file }: { file: AppFile }) {
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
                const prof = profileColumns(s.headers, s.rows);
                const out = detectOutliersByColumn(s.headers, s.rows);

                // Build sample rows for columns that have outliers (IQR) — up to 10 rows per sheet
                const samples: { col: string; rowIndex: number; value: number }[] = [];
                for (let i = 0; i < s.headers.length; i++) {
                    const info = out[i];
                    if (!info.numeric || !Number.isFinite(info.low) || !Number.isFinite(info.high)) continue;
                    for (let r = 0; r < s.rows.length && samples.length < 10; r++) {
                        const v = toNumber(s.rows[r]?.[i]);
                        if (!isNaN(v) && (v < info.low || v > info.high)) {
                            samples.push({ col: s.headers[i], rowIndex: r, value: v });
                        }
                    }
                }

                return (
                    <Collapsible
                        key={sName}
                        title={`Outliers — ${s.name}`}
                        open={!!openMap[sName]}
                        onToggle={() => setOpenMap(m => ({ ...m, [sName]: !m[sName] }))}
                    >
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Column</th>
                                    <th>Type</th>
                                    <th className="num">IQR outliers</th>
                                    <th className="num">Z&gt;3 outliers</th>
                                    <th className="num">IQR low</th>
                                    <th className="num">IQR high</th>
                                </tr>
                            </thead>
                            <tbody>
                                {out.map((o, idx) => (
                                    <tr key={o.name}>
                                        <td>{o.name}</td>
                                        <td><span className="badge">{prof[idx].kind}</span></td>
                                        <td className="num">{o.numeric ? o.countIQR : "—"}</td>
                                        <td className="num">{o.numeric ? o.countZ : "—"}</td>
                                        <td className="num">{Number.isFinite(o.low) ? (o.low as number).toFixed(3) : "—"}</td>
                                        <td className="num">{Number.isFinite(o.high) ? (o.high as number).toFixed(3) : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {samples.length > 0 && (
                            <div className="section vstack">
                                <div className="title">Example outlier rows (IQR)</div>
                                <table className="table">
                                    <thead>
                                        <tr><th>Row</th><th>Column</th><th className="num">Value</th></tr>
                                    </thead>
                                    <tbody>
                                        {samples.map((smp, i) => (
                                            <tr key={i}>
                                                <td>#{smp.rowIndex + 2 /* +1 for header, +1 for 1-based */}</td>
                                                <td>{smp.col}</td>
                                                <td className="num">{smp.value.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="small">Showing up to 10 samples per sheet.</div>
                            </div>
                        )}
                    </Collapsible>
                );
            })}
        </div>
    );
}
