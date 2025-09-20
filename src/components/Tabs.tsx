import React from "react";

export type TabSpec = { id: string; label: string; };

export default function Tabs({
    tabs, current, onChange
}: { tabs: TabSpec[]; current: string; onChange: (id: string) => void; }) {
    return (
        <nav className="tabs" aria-label="Sections">
            {tabs.map((t, i) => (
                <button
                    key={t.id}
                    className="tab-btn"
                    role="tab"
                    aria-selected={current === t.id}
                    onClick={() => onChange(t.id)}
                >
                    {t.label}
                </button>
            ))}
        </nav>
    );
}
