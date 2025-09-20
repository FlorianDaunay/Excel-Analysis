import React from "react";
import type { AppFile } from "../../types/app";
import { correlationMatrix, duplicatesAndKeys, missingness, profileColumns } from "../../logic/analysis";
import Collapsible from "../Collapsible";

export default function StrongAnalysis({ file }: { file: AppFile }) {
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(
        () => Object.fromEntries(file.sheetOrder.map((s, i) => [s, i === 0]))
    );
    const setAll = (v: boolean) => setOpenMap(Object.fromEntries(file.sheetOrder.map(s => [s, v])));

    return (
        <>
            <div className="view-controls">
                <button className="btn small" onClick={() => setAll(true)}>Expand all</button>
                <button className="btn small" onClick={() => setAll(false)}>Collapse all</button>
            </div>

            {file.sheetOrder.map(sName => {
                const s = file.sheets[sName];
                const prof = profileColumns(s.headers, s.rows);
                const miss = missingness(s.headers, s.rows);
                const corr = correlationMatrix(s.headers, s.rows);
                const dup = duplicatesAndKeys(s.headers, s.rows);

                return (
                    <Collapsible
                        key={sName}
                        title={`Deep Analysis — ${s.name}`}
                        open={!!openMap[sName]}
                        onToggle={() => setOpenMap(m => ({ ...m, [sName]: !m[sName] }))}
                    >
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Column</th><th>Type</th><th className="num">Non-null</th><th className="num">% Empty</th>
                                    <th className="num">Uniques</th><th className="num">Mean</th><th className="num">Std</th>
                                    <th className="num">Min</th><th className="num">P25</th><th className="num">Median</th>
                                    <th className="num">P75</th><th className="num">Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prof.map(r => (
                                    <tr key={r.name}>
                                        <td>{r.name}</td>
                                        <td><span className="badge">{r.kind}</span></td>
                                        <td className="num">{r.nonNull}</td>
                                        <td className="num">{(100 * r.emptyRate).toFixed(1)}%</td>
                                        <td className="num">{r.uniques}</td>
                                        {numTD(r.stats.mean)}
                                        {numTD(r.stats.std)}
                                        {numTD(r.stats.min)}
                                        {numTD(r.stats.p25)}
                                        {numTD(r.stats.p50)}
                                        {numTD(r.stats.p75)}
                                        {numTD(r.stats.max)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="small">
                            Overall missing: <span className={`badge ${miss.overall < 0.1 ? 'ok' : miss.overall < 0.3 ? 'warn' : 'bad'}`}>{(100 * miss.overall).toFixed(1)}%</span>
                        </div>

                        {corr.names.length >= 2 && <CorrTable names={corr.names} matrix={corr.matrix} />}

                        <div className="hstack">
                            <span className={`badge ${dup.dupRowCount === 0 ? 'ok' : 'bad'}`}>Duplicate rows: {dup.dupRowCount}</span>
                            <span className="small">Candidate keys: {dup.candidates.length ? dup.candidates.map(c => (
                                <code className="inline" key={c.name}>{c.name}</code>
                            )) : "None"}</span>
                        </div>
                    </Collapsible>
                );
            })}
        </>
    );
}

function numTD(v?: number) {
    const txt = typeof v === "number" && !isNaN(v) ? v.toFixed(3) : "—";
    return <td className="num">{txt}</td>;
}

function CorrTable({ names, matrix }: { names: string[]; matrix: number[][] }) {
    return (
        <div className="vstack">
            <div className="small">Correlation matrix (numeric columns)</div>
            <table className="table">
                <thead>
                    <tr><th></th>{names.map(n => <th key={n}>{n}</th>)}</tr>
                </thead>
                <tbody>
                    {names.map((rowName, i) => (
                        <tr key={rowName}>
                            <td>{rowName}</td>
                            {names.map((_, j) => {
                                const v = matrix[i][j];
                                const style: React.CSSProperties = {};
                                if (!isNaN(v)) {
                                    const a = Math.min(1, Math.abs(v));
                                    style.background = `rgba(${v < 0 ? 239 : 34}, ${v < 0 ? 68 : 197}, ${v < 0 ? 68 : 94}, ${0.12 + 0.25 * a})`;
                                }
                                return <td key={j} className="num" style={style}>{isNaN(v) ? "—" : v.toFixed(3)}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
