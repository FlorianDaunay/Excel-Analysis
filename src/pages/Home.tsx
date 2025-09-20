import React from "react";
import TopBar from "../components/TopBar";
import Tabs, { TabSpec } from "../components/Tabs";
import Panel from "../components/Panel";
import { state } from "../logic/state";
import type { AppFile } from "../types/app";
import Metadata from "../components/views/Metadata";
import Readability from "../components/views/Readability";
import StrongAnalysis from "../components/views/StrongAnalysis";
import Distributions from "../components/views/Distributions";
import Outliers from "../components/views/Outliers";
import Sheets from "../components/views/Sheets";


const TABS: TabSpec[] = [
    { id: "metadata", label: "Metadata" },
    { id: "readability", label: "Readability" },
    { id: "analysis", label: "Analysis & Stats" },
    { id: "distributions", label: "Distributions" },
    { id: "outliers", label: "Outliers" },
    { id: "sheets", label: "Sheets" },
];

export default function Home() {
    const [, setTick] = React.useState(0);
    const forceUpdate = () => setTick(x => x + 1);

    const [tab, setTab] = React.useState<string>(TABS[0].id);

    const file: AppFile | null = state.currentFileId ? state.files[state.currentFileId] : null;

    return (
        <>
            <TopBar onChange={forceUpdate} />
            <main className="app">
                <Tabs tabs={TABS} current={tab} onChange={setTab} />
                {file ? (
                    <Panel title={TABS.find(t => t.id === tab)!.label} file={file}>
                        {tab === "metadata" && <Metadata file={file} />}
                        {tab === "readability" && <Readability file={file} />}
                        {tab === "analysis" && <StrongAnalysis file={file} />}
                        {tab === "sheets" && <Sheets file={file} />}
                        {tab === "distributions" && <Distributions file={file} />}
                        {tab === "outliers" && <Outliers file={file} />}
                    </Panel>
                ) : (
                    <section className="panel">
                        <div className="section vstack">
                            <div className="title">No file selected</div>
                            <p className="small">Use the + Add File button to open one or more Excel/CSV files.</p>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
