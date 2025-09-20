import React from "react";
import type { AppFile } from "../types/app";

export default function Panel({
    title, file, children
}: { title: string; file: AppFile; children: React.ReactNode; }) {
    return (
        <section className="panel" aria-live="polite">
            <div className="section">
                <div className="title">{title} — {file.name}</div>
            </div>
            {children}
        </section>
    );
}
