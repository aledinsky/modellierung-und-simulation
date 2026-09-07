import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import myTheme from "../../node_modules/monaco-themes/themes/Katzenmilch.json";
import modelTypes from "../Model.d.ts?raw";
import type { UseModelEditorReturn } from "../modeleditor/useModelEditor";

// localStorage key for persisting the last-opened model
const LAST_MODEL_KEY = "modelEditor:lastModelId";

type Props = {
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  editorHook: UseModelEditorReturn;
  onEditorMount: () => void;
  compileError: string | null;
};

// ── Small dialog primitives ───────────────────────────────────────────────────

function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {children}
    </div>
  );
}

function ModalBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
      {children}
    </div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-gray-800">{children}</p>;
}

function ModalMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-snug">{children}</p>;
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2">{children}</div>;
}

const btnBase =
  "px-3 py-1.5 rounded-lg text-sm font-medium transition duration-100 cursor-pointer";
const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`;
const btnDanger  = `${btnBase} bg-red-600 text-white hover:bg-red-700 active:bg-red-800`;
const btnGhost   = `${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300`;

// ── Main component ────────────────────────────────────────────────────────────

export function ModelEditor({ editorRef, editorHook, onEditorMount, compileError }: Props) {
  const {
    models,
    current,
    isDirty,
    load,
    save,
    saveAs,
    deleteModel,
    confirmLoad,
    cancelLoad,
    pendingLoad,
  } = editorHook;

  // ── Dialogs ──────────────────────────────────────────────────────────────────

  const [showSaveAs, setShowSaveAs]                         = useState(false);
  const [saveAsName, setSaveAsName]                         = useState("");
  const [saveAsError, setSaveAsError]                       = useState<string | null>(null);
  const [saveAsPendingOverwrite, setSaveAsPendingOverwrite] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId]               = useState<string | null>(null);

  const saveAsInputRef = useRef<HTMLInputElement>(null);

  // Open the Save As dialog, pre-filling & focusing its input.
  function openSaveAs() {
    setSaveAsName(current?.isPreset ? "" : (current?.name ?? ""));
    setSaveAsError(null);
    setSaveAsPendingOverwrite(null);
    setShowSaveAs(true);
    setTimeout(() => saveAsInputRef.current?.select(), 30);
  }

  // ── Persist last-opened id ────────────────────────────────────────────────────

  useEffect(() => {
    if (current && current.id !== "new") {
      localStorage.setItem(LAST_MODEL_KEY, current.id);
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Action handlers ───────────────────────────────────────────────────────────

  function handleSave() {
    save();
  }

  function handleSaveAsSubmit(forceOverwrite = false) {
    const result = saveAs(saveAsName.trim(), forceOverwrite);
    if (result.status === "preset_conflict") {
      setSaveAsError("Dieser Name gehört einem Preset und kann nicht überschrieben werden.");
      setSaveAsPendingOverwrite(null);
      return;
    }
    if (result.status === "overwrite_required") {
      setSaveAsPendingOverwrite(result.existingId ?? null);
      setSaveAsError(`„${saveAsName.trim()}" existiert bereits. Überschreiben?`);
      return;
    }
    // status === "saved" — hook has already updated current.content, App will recompile
    setShowSaveAs(false);
  }

  function handleDeleteConfirm() {
    if (deleteConfirmId) {
      deleteModel(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }

  const isPreset  = current?.isPreset ?? true;
  const canSave   = !isPreset && isDirty;
  const canDelete = !isPreset && !!current;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="flex-1 h-0 min-h-0 rounded-xl overflow-hidden border border-gray-500 flex flex-col"
        // style={{ backgroundColor: myTheme.colors["editor.background"] }}
      >
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-1 p-1">

          {/* Model selector */}
          <select
            name="model"
            id="model-select"
            value={current?.id ?? ""}
            onChange={(e) => load(e.currentTarget.value)}
            className="text-black bg-[#0001] px-2 py-0.5 rounded-lg focus:outline-none focus:ring-0 hover:bg-[#0002] active:bg-[#0003] cursor-pointer duration-50 transition"
          >
            {models.map((m) => (
              <option value={m.id} key={m.id}>
                {m.isPreset
                  ? m.name
                  : `${m.name}${isDirty && current?.id === m.id ? " •" : ""}`}
              </option>
            ))}
            <option value="new" key="new">new&hellip;</option>
          </select>

          {/* Delete — only for user models */}
          {canDelete && (
            <button
              title="Modell löschen"
              onClick={() => setDeleteConfirmId(current!.id)}
              className="text-red-400 px-1.5 py-0.5 rounded-lg hover:scale-120 active:scale-80 cursor-pointer duration-50 transition text-sm leading-none"
            >
              ✕
            </button>
          )}

          <div className="flex-1" />

          {/* Save — only enabled for dirty user models */}
          <button
            className="text-black py-0.5 disabled:text-black/30 bg-[#0001] disabled:bg-[#0001] px-2 rounded-lg text-sm font-medium hover:enabled:bg-[#0002] active:enabled:bg-[#0003] cursor-pointer disabled:cursor-default duration-50 transition"
            onClick={handleSave}
            disabled={!canSave}
          >
            Speichern
          </button>

          {/* Save As */}
          <button
            className="text-black py-0.5 bg-[#0001] px-2 rounded-lg text-sm font-medium hover:bg-[#0002] active:bg-[#0003] cursor-pointer duration-50 transition"
            onClick={openSaveAs}
          >
            Speichern&nbsp;unter&hellip;
          </button>
        </div>

        <Editor
          theme="vs-light"
          height="100%"
          defaultLanguage="javascript"
          defaultValue=""
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monaco.editor.defineTheme(
              "myTheme",
              myTheme as editor.IStandaloneThemeData,
            );
            monaco.editor.setTheme("vs-light");
            monaco.languages.typescript.javascriptDefaults.addExtraLib(
              modelTypes,
              "ts:model.d.ts",
            );
            onEditorMount();
          }}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            smoothScrolling: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />

        {compileError && (
          <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 font-mono whitespace-pre-wrap">
            {compileError}
          </div>
        )}
      </div>

      {/* ── Unsaved-changes confirmation ─────────────────────────────────── */}
      {pendingLoad && (
        <ModalBackdrop>
          <ModalBox>
            <ModalTitle>Ungespeicherte Änderungen</ModalTitle>
            <ModalMessage>
              Das aktuelle Modell hat ungespeicherte Änderungen. Trotzdem
              wechseln und Änderungen verwerfen?
            </ModalMessage>
            <ModalActions>
              <button className={btnGhost} onClick={cancelLoad}>Abbrechen</button>
              <button className={btnDanger} onClick={confirmLoad}>Verwerfen</button>
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Save As dialog ────────────────────────────────────────────────── */}
      {showSaveAs && (
        <ModalBackdrop>
          <ModalBox>
            <ModalTitle>Speichern unter</ModalTitle>
            <input
              ref={saveAsInputRef}
              type="text"
              value={saveAsName}
              onChange={(e) => {
                setSaveAsName(e.target.value);
                setSaveAsError(null);
                setSaveAsPendingOverwrite(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveAsSubmit(false);
                if (e.key === "Escape") setShowSaveAs(false);
              }}
              placeholder="Modellname"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {saveAsError && (
              <ModalMessage>
                <span className="text-red-600">{saveAsError}</span>
              </ModalMessage>
            )}
            <ModalActions>
              <button className={btnGhost} onClick={() => setShowSaveAs(false)}>
                Abbrechen
              </button>
              {saveAsPendingOverwrite ? (
                <button className={btnDanger} onClick={() => handleSaveAsSubmit(true)}>
                  Überschreiben
                </button>
              ) : (
                <button
                  className={btnPrimary}
                  disabled={!saveAsName.trim()}
                  onClick={() => handleSaveAsSubmit(false)}
                >
                  Speichern
                </button>
              )}
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {deleteConfirmId && (
        <ModalBackdrop>
          <ModalBox>
            <ModalTitle>Modell löschen</ModalTitle>
            <ModalMessage>
              „{models.find((m) => m.id === deleteConfirmId)?.name}" wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </ModalMessage>
            <ModalActions>
              <button className={btnGhost} onClick={() => setDeleteConfirmId(null)}>
                Abbrechen
              </button>
              <button className={btnDanger} onClick={handleDeleteConfirm}>
                Löschen
              </button>
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
}