import type { Model } from "./modelTypes";

const STORAGE_PREFIX = "model:user:";

// ── Serialisation ────────────────────────────────────────────────────────────

function modelKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

function deserialise(raw: string): Model | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.content === "string"
    ) {
      return { ...parsed, isPreset: false };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Read ─────────────────────────────────────────────────────────────────────

/** Returns all user models currently stored in localStorage. */
export function getStoredModels(): Model[] {
  const models: Model[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const model = deserialise(raw);
    if (model) models.push(model);
  }
  return models.sort((a, b) => a.name.localeCompare(b.name));
}

/** Returns the content string for a stored user model, or null if not found. */
export function loadStoredModel(id: string): string | null {
  const raw = localStorage.getItem(modelKey(id));
  if (!raw) return null;
  return deserialise(raw)?.content ?? null;
}

// ── Write ────────────────────────────────────────────────────────────────────

/**
 * Creates a new user model or updates an existing one.
 * Pass `id` to update; omit to create a new model with a fresh UUID.
 * Throws if `id` refers to a preset (guard against misuse).
 */
export function saveStoredModel(
  name: string,
  content: string,
  id?: string
): Model {
  if (id?.startsWith("preset:")) {
    throw new Error("Cannot overwrite a preset model.");
  }
  const resolvedId = id ?? crypto.randomUUID();
  const model: Model = { id: resolvedId, name, content, isPreset: false };
  localStorage.setItem(modelKey(resolvedId), JSON.stringify(model));
  return model;
}

/**
 * Deletes a user model from localStorage.
 * Throws if `id` refers to a preset.
 */
export function deleteStoredModel(id: string): void {
  if (id.startsWith("preset:")) {
    throw new Error("Cannot delete a preset model.");
  }
  localStorage.removeItem(modelKey(id));
}
