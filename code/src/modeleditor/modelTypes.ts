export interface Model {
  id: string;
  name: string;
  content: string;
  isPreset: boolean;
}

export interface PresetSource {
  name: string;
  url: string;
}

export type SaveAsResult =
  | { status: "saved"; model: Model }
  | { status: "overwrite_required"; existingId: string }
  | { status: "preset_conflict" };
