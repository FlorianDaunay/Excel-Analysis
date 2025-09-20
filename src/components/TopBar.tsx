import React from "react";
import { state } from "../logic/state";
import type { AppFile } from "../types/app";
import { fmtBytes, fmtDate } from "../logic/utils";
import { parseFile } from "../logic/excelParser";

export default function TopBar({ onChange }: { onChange: () => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const openPicker = () => inputRef.current?.click();

    const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (const f of Array.from(files)) {
            const parsed = await parseFile(f);
            state.files[parsed.id] = parsed;
            state.order.push(parsed.id);
            state.currentFileId = parsed.id;
        }
        e.target.value = "";
        onChange();
    };

    const setCurrent = (f: AppFile) => {
        state.currentFileId = f.id;
        onChange();
    };

    return (
        <header className="topbar">
            <div className="file-strip" id="fileStrip">
                {state.order.map(fid => {
                    const f = state.files[fid];
                    const active = state.currentFileId === fid;
                    return (
                        <button
                            key={fid}
                            className={`file-chip ${active ? "active" : ""}`}
                            title={`Last modified: ${fmtDate(f.lastModified)}`}
                            onClick={() => setCurrent(f)}
                        >
                            <span className="name">{f.name}</span>
                            <span className="meta">· {Object.keys(f.sheets).length} sheets · {fmtBytes(f.size)}</span>
                        </button>
                    );
                })}
            </div>
            <div className="file-actions">
                <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.xlsm,.csv" hidden onChange={onFiles} />
                <button onClick={openPicker} className="btn primary">+ Add File</button>
            </div>
        </header>
    );
}
