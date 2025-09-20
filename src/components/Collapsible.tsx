import React from "react";

export default function Collapsible({
    title,
    open,
    onToggle,
    children
}: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={`section ${open ? "coll-open" : "coll-closed"}`}>
            <button className="coll-head" onClick={onToggle} aria-expanded={open}>
                <Chevron open={open} />
                <span className="coll-title">{title}</span>
            </button>
            {open && <div className="coll-body vstack">{children}</div>}
        </div>
    );
}

function Chevron({ open }: { open: boolean }) {
    const style: React.CSSProperties = {
        transition: "transform .18s ease",
        transform: open ? "rotate(90deg)" : "rotate(0deg)"
    };
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" style={style} aria-hidden="true">
            <path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
