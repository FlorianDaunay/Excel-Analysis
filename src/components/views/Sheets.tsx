import React from "react";
import type { AppFile } from "../../types/app";
import Collapsible from "../Collapsible";

export default function Sheets({ file }: { file: AppFile }) {
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
                return (
                    <Collapsible
                        key={sName}
                        title={`Sheet: ${s.name}`}
                        open={!!openMap[sName]}
                        onToggle={() => setOpenMap(m => ({ ...m, [sName]: !m[sName] }))}
                    >
                        <table className="table">
                            <thead><tr>{s.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                            <tbody>
                                {s.rows.slice(0, 50).map((row, ri) => (
                                    <tr key={ri}>
                                        {s.headers.map((_, ci) => {
                                            const v = row[ci];
                                            const txt = v instanceof Date ? v.toISOString() : (v == null ? "" : String(v));
                                            return <td key={ci}>{txt}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Collapsible>
                );
            })}
        </>
    );
}
