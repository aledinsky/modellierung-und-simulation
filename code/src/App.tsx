import { useEffect, useMemo, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import "./App.css";

import type { Model } from "./Simulation";
import { useAppData } from "./hooks/useAppData";
import { useSimulation } from "./hooks/useSimulation";
import {
  DEFAULT_SLIDER_STATE,
  type SliderState,
  valuesFromSliders,
} from "./utils/sliderConversions";
import { ControlPanel } from "./components/ControlPanel";
import { ModelEditor } from "./components/ModelEditor";
import { SimulationCharts } from "./components/SimulationCharts";
import { useModelEditor } from "./modeleditor/useModelEditor";

const LAST_MODEL_KEY = "modelEditor:lastModelId";

function formatCompileError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);

  // Indirect eval's stack traces contain a synthetic frame like
  // "eval at <anonymous> (...), <anonymous>:LINE:COL" — pull that out.
  const match = e.stack?.match(/<anonymous>:(\d+):(\d+)/);
  const location = match ? ` (line ${match[1]}, col ${match[2]})` : "";

  return `${e.name}: ${e.message}${location}`;
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full items-center justify-center h-full text-red-500 px-4 text-center">
      <div className="w-full text-lg font-semibold mb-2">{title}</div>
      <div className="w-full text-md whitespace-pre-wrap">{message}</div>
      <p className="mt-2">Fix the error in the editor to resume.</p>
    </div>
  );
}

function App() {
  const radiosondeUrl = `${import.meta.env.BASE_URL}radiosonde`;
  const modelUrl = `${import.meta.env.BASE_URL}models`;

  const {
    stations,
    availableStations,
    availableModels,
    selectedStation,
    setSelectedStation,
    currentStationData,
    selectedDate,
    setSelectedDate,
    onDateSelectKeyDown,
    loading,
  } = useAppData(radiosondeUrl, modelUrl);

  const [sliderState, setSliderState] =
    useState<SliderState>(DEFAULT_SLIDER_STATE);
  const [showRH, setShowRH] = useState(false);
  const [zoom, setZoom] = useState(false);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // Flipped to true by Monaco's onMount — gates the startup load below.
  const [editorMounted, setEditorMounted] = useState(false);

  const editorHook = useModelEditor(editorRef, availableModels, modelUrl);
  const { models, current: currentModel, load } = editorHook;

  // Startup: load the last-used model once BOTH the preset list AND Monaco are
  // ready. We must wait for Monaco because load() calls editorRef.current.setValue();
  // if the editor hasn't mounted yet that call is silently dropped and nothing compiles.
  useEffect(() => {
    if (!editorMounted || models.length === 0 || currentModel) return;

    const lastId = localStorage.getItem(LAST_MODEL_KEY);
    const target = (lastId && models.find((m) => m.id === lastId)) || null;
    const fallback = models.find((m) => m.isPreset) ?? models[0];
    load((target ?? fallback).id);
  }, [editorMounted, models]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompile whenever the loaded model content changes (load, save, saveAs).
  const { simulationModel, compileError } = useMemo(() => {
    const content = currentModel?.content;
    if (!content) return { simulationModel: undefined, compileError: null };

    const { R } = valuesFromSliders(sliderState);
    const fullCode =
      content.replace(/const R0\s*=.*;?/, `const R0 = ${R};`) + "\nmodel;";

    try {
      const compiled = eval(fullCode) as Model;
      return { simulationModel: compiled, compileError: null };
    } catch (e) {
      console.error("Model compile error:", e);
      return {
        simulationModel: undefined,
        compileError: formatCompileError(e),
      };
    }
  }, [currentModel?.content, sliderState]);

  const { results, minMax, runtimeError } = useSimulation(
    simulationModel,
    currentStationData,
    selectedDate,
    sliderState,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-100 p-3">
      <div className="flex gap-3 h-full w-full">
        {/* Left Pane — Configuration + Editor */}
        <div className="w-3/5 h-full bg-white border border-gray-300 rounded-2xl p-4 shadow-lg flex flex-col">
          <ControlPanel
            stations={stations}
            availableStations={availableStations}
            selectedStation={selectedStation}
            onStationChange={setSelectedStation}
            currentStationData={currentStationData}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDateSelectKeyDown={onDateSelectKeyDown}
            sliderState={sliderState}
            onSliderChange={setSliderState}
          />

          <ModelEditor
            editorRef={editorRef}
            editorHook={editorHook}
            onEditorMount={() => setEditorMounted(true)}
            compileError={compileError}
          />
        </div>

        {/* Right Pane — Charts */}
        <div className="w-2/5 bg-white border border-gray-300 rounded-2xl p-1 overflow-auto shadow-lg">
          {selectedDate && results && minMax && !compileError && !runtimeError ? (
            <SimulationCharts
              selectedDate={selectedDate}
              currentStationData={currentStationData}
              results={results}
              minMax={minMax}
              showRH={showRH}
              onShowRHChange={setShowRH}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          ) : compileError ? (
            <ErrorPanel title="Compilation Error" message={compileError} />
          ) : runtimeError ? (
            <ErrorPanel title="Runtime Error" message={runtimeError} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Loading data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
