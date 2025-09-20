import React from "react";
import type { AppFile } from "../../types/app";
import Collapsible from "../Collapsible";

export default function Metadata({ file }: { file: AppFile }) {
    // init: first sheet open
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(
        () => Object.fromEntries(file.sheetOrder.map((s, i) => [s, i === 0]))
    );

    const setAll = (v: boolean) => setOpenMap(Object.fromEntries(file.sheetOrder.map(s => [s, v])));

    return (
        <>
            <div className="vstack">
                <KV k="File name" v={file.name} />
                <KV k="Size" v={`${(file.size / 1024).toFixed(1)} KB`} />
                <KV k="Last modified" v={new Date(file.lastModified).toLocaleString()} />
                <KV k="Sheet count" v={String(Object.keys(file.sheets).length)} />
            </div>

            <div className="view-controls">
                <button className="btn small" onClick={() => setAll(true)}>Expand all</button>
                <button className="btn small" onClick={() => setAll(false)}>Collapse all</button>
            </div>

            {file.sheetOrder.map(sName => {
                const s = file.sheets[sName];
                const cells = s.rows.length * s.headers.length || 0;
                let nonNull = 0;
                for (const r of s.rows) for (let i = 0; i < s.headers.length; i++) if (r[i] !== null && r[i] !== "") nonNull++;
                const rate = cells ? (100 * nonNull / cells).toFixed(1) + "%" : "—";

                return (
                    <Collapsible
                        key={sName}
                        title={`Metadata — ${s.name}`}
                        open={!!openMap[sName]}
                        onToggle={() => setOpenMap(m => ({ ...m, [sName]: !m[sName] }))}
                    >
                        <table className="table">
                            <thead>
                                <tr><th>Sheet</th><th className="num">Rows</th><th className="num">Columns</th><th className="num">% Non-null</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{s.name}</td>
                                    <td className="num">{s.rows.length}</td>
                                    <td className="num">{s.headers.length}</td>
                                    <td className="num">{rate}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Collapsible>
                );
            })}
        </>
    );
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="kv">
            <div className="k">{k}</div>
            <div className="v">{v}</div>
        </div>
    );
}
