import { useCallback, useEffect, useRef, useState } from "react";
import type { Model, PresetSource, SaveAsResult } from "./modelTypes";
import {
  deleteStoredModel,
  getStoredModels,
  loadStoredModel,
  saveStoredModel,
} from "./modelStore";
import axios from "axios";

interface MonacoEditorRef {
  getValue(): string;
  setValue(value: string): void;
}

export interface UseModelEditorReturn {
  /** All models (presets first, then user models sorted by name). */
  models: Model[];
  /** The currently loaded model, or null if none. */
  current: Model | null;
  /** True when the editor content differs from the last saved content. */
  isDirty: boolean;
  /**
   * Load a model by ID. If there are unsaved changes, sets `pendingLoad`
   * instead of loading immediately — show a confirmation dialog and call
   * `confirmLoad()` or `cancelLoad()` based on the user's choice.
   */
  load: (id: string) => void;
  /**
   * Save the current model back to localStorage.
   * No-op (and safe to call) when current is a preset.
   */
  save: () => void;
  /**
   * Save the current editor content under a new name.
   *
   * Returns:
   *   { status: "saved" }               — success, model list updated
   *   { status: "preset_conflict" }     — name matches a preset, blocked
   *   { status: "overwrite_required" }  — name matches a user model;
   *                                       call saveAs(name, force=true) to proceed
   */
  saveAs: (name: string, force?: boolean) => SaveAsResult;
  /**
   * Delete a user model by ID. No-op for presets.
   * If the deleted model is currently loaded, `current` becomes null.
   */
  deleteModel: (id: string) => void;
  /** Confirm discarding unsaved changes and load the pending model. */
  confirmLoad: () => void;
  /** Cancel the pending load and stay on the current model. */
  cancelLoad: () => void;
  /** Non-null when a load is waiting for unsaved-changes confirmation. */
  pendingLoad: string | null;
}

export function useModelEditor(
  editorRef: React.RefObject<MonacoEditorRef | null>,
  presetSources: PresetSource[],
  presetBaseUrl: string
): UseModelEditorReturn {
  const [presets, setPresets] = useState<Model[]>([]);
  const [userModels, setUserModels] = useState<Model[]>(getStoredModels);
  const [current, setCurrent] = useState<Model | null>(null);
  const [pendingLoad, setPendingLoad] = useState<string | null>(null);

  // Tracks the content at the time of last save/load for dirty detection.
  const savedContentRef = useRef<string>("");

  // ── Dirty flag ─────────────────────────────────────────────────────────────

  const [isDirty, setIsDirty] = useState(false);

  // Poll the editor value to keep isDirty up to date.
  // Monaco fires onChange events but since we have a ref-based API we poll
  // on a short interval instead — cheap and avoids wiring extra event handlers.
  useEffect(() => {
    const interval = setInterval(() => {
      const value = editorRef.current?.getValue() ?? "";
      setIsDirty(value !== savedContentRef.current);
    }, 300);
    return () => clearInterval(interval);
  }, [editorRef]);

  // ── Preset fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function fetchPresets() {
      const settled = await Promise.allSettled(
        presetSources.map(async ({ name, url }) => {
          console.log(`Fetching preset model "${name}" from ${presetBaseUrl}/${url}...`);
          const res = await axios.get<string>(`${presetBaseUrl}/${url}`, { responseType: "text" });
          const content = res.data;
          const id = `preset:${url}`;
          return { id, name, content, isPreset: true } as Model;
        })
      );
      if (cancelled) return;
      const loaded = settled
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<Model>).value);
      setPresets(loaded);
    }
    fetchPresets();
    return () => { cancelled = true; };
  }, [presetSources, presetBaseUrl]);

  // ── Derived model list ─────────────────────────────────────────────────────

  const models: Model[] = [...presets, ...userModels];

  // ── Internal load (no dirty check) ────────────────────────────────────────

  const loadImmediate = useCallback(
    (id: string) => {
      const allModels = [...presets, ...userModels];
      const model = allModels.find((m) => m.id === id);
      if (!model) return;

      // For presets the content is already in memory; for user models read storage.
      const content = model.isPreset
        ? model.content
        : (loadStoredModel(id) ?? model.content);

      editorRef.current?.setValue(content);
      savedContentRef.current = content;
      setIsDirty(false);
      setCurrent({ ...model, content });
    },
    [presets, userModels, editorRef]
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  const load = useCallback(
    (id: string) => {
      if (isDirty) {
        setPendingLoad(id);
      } else {
        loadImmediate(id);
      }
    },
    [isDirty, loadImmediate]
  );

  const confirmLoad = useCallback(() => {
    if (pendingLoad) {
      loadImmediate(pendingLoad);
      setPendingLoad(null);
    }
  }, [pendingLoad, loadImmediate]);

  const cancelLoad = useCallback(() => {
    setPendingLoad(null);
  }, []);

  const save = useCallback(() => {
    if (!current || current.isPreset) return;
    const content = editorRef.current?.getValue() ?? "";
    const updated = saveStoredModel(current.name, content, current.id);
    savedContentRef.current = content;
    setIsDirty(false);
    setCurrent(updated);
    setUserModels(getStoredModels());
  }, [current, editorRef]);

  const saveAs = useCallback(
    (name: string, force = false): SaveAsResult => {
      const trimmed = name.trim();
      const presetMatch = presets.find(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (presetMatch) return { status: "preset_conflict" };

      const userMatch = userModels.find(
        (m) => m.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (userMatch && !force) {
        return { status: "overwrite_required", existingId: userMatch.id };
      }

      const content = editorRef.current?.getValue() ?? "";
      // If overwriting, keep the existing id so we update in place.
      const id = userMatch?.id;
      const saved = saveStoredModel(trimmed, content, id);
      savedContentRef.current = content;
      setIsDirty(false);
      setCurrent(saved);
      setUserModels(getStoredModels());
      return { status: "saved", model: saved };
    },
    [presets, userModels, editorRef]
  );

  const deleteModel = useCallback(
    (id: string) => {
      if (id.startsWith("preset:")) return;
      deleteStoredModel(id);
      setUserModels(getStoredModels());
      if (current?.id === id) {
        setCurrent(null);
        savedContentRef.current = "";
        setIsDirty(false);
      }
    },
    [current]
  );

  return {
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
  };
}