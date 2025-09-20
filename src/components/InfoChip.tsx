import React from "react";

export default function InfoChip({
    label,
    value,
    help,
    tone = "default",
}: {
    label: string;
    value: string;
    help: string;
    tone?: "default" | "warn" | "bad";
}) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    // Close on outside click
    React.useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, [open]);

    // Pointer detection: hover for mouse, click for touch
    const supportsHover = window.matchMedia?.("(hover: hover)").matches;

    return (
        <div className="chip-wrap" ref={ref}>
            <button
                type="button"
                className={`chip light ${tone}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                onMouseEnter={() => supportsHover && setOpen(true)}
                onMouseLeave={() => supportsHover && setOpen(false)}
                onClick={() => !supportsHover && setOpen(o => !o)}
            >
                <span className="k">{label}</span>
                <span className="v">{value}</span>
            </button>

            <div className={`tip ${open ? "open" : ""}`} role="dialog">
                <div className="tip-body">{help}</div>
                {!supportsHover && (
                    <button
                        className="tip-close"
                        onClick={() => setOpen(false)}
                        aria-label="Close"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
