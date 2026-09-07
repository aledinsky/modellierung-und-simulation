import { useRef, useState, useCallback, useId } from "react";

export interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  disabled?: boolean;
  className?: string;
}

export function NumericInput({
  value,
  onChange,
  unit,
  step = 1,
  min = -Infinity,
  max = Infinity,
  decimalPlaces = 0,
  disabled = false,
  className = "",
}: NumericInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const id = useId();

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max]
  );

  const format = useCallback(
    (v: number) => v.toFixed(decimalPlaces),
    [decimalPlaces]
  );

  const displayValue = rawText !== null ? rawText : format(value);

  const handleInputFocus = () => {
    setFocused(true);
    setRawText(format(value));
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Only lose the ring if focus left the entire container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setFocused(false);
    }
    const parsed = parseFloat(rawText ?? "");
    if (!isNaN(parsed)) onChange(clamp(parsed));
    setRawText(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") inputRef.current?.blur();
    else if (e.key === "ArrowUp") { e.preventDefault(); onChange(clamp(value + step)); }
    else if (e.key === "ArrowDown") { e.preventDefault(); onChange(clamp(value - step)); }
  };

  const bump = (dir: 1 | -1) => {
    onChange(clamp(Math.round((value + dir * step) / step) * step)); // Avoid floating point issues by doing the rounding in integer space
  };

  return (
    <div
      ref={containerRef}
      className={[
        "flex items-stretch h-7 rounded-lg border bg-white transition-all duration-100",
        focused ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-500",
        disabled ? "opacity-50 pointer-events-none" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {/* Number input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => setRawText(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="numeric value"
        className="flex-1 min-w-0 h-full appearance-none bg-transparent border-0 outline-none shadow-none pl-2 pr-1 text-sm tabular-nums text-right text-gray-900 focus:ring-0 focus:outline-none"
      />

      {/* Unit label — clicking focuses the input */}
      {unit && (
        <label
          htmlFor={id}
          className="flex items-center pl-0 pr-1 text-sm text-gray-600 cursor-text select-none whitespace-nowrap"
        >
          {unit}
        </label>
      )}

      {/* Vertical divider */}
      <div className="w-px bg-gray-400 self-stretch flex-shrink-0" />

      {/* Stacked +/− buttons
          onMouseDown preventDefault stops focus moving to the button.
          No focus handlers on buttons at all — they are intentionally not focusable. */}
      <div className="flex flex-col w-6 h-full flex-shrink-0 rounded-r-[7px] overflow-hidden divide-y divide-gray-400">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => bump(1)}
          aria-label="Increment"
          className="flex-1 flex min-h-0 items-center justify-center cursor-pointer text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-75 text-base leading-none"
        >
          +
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => bump(-1)}
          aria-label="Decrement"
          className="flex-1 flex min-h-0 items-center justify-center cursor-pointer text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-75 text-base leading-none"
        >
          −
        </button>
      </div>
    </div>
  );
}

/*
  Usage example:

  import { useState } from "react";
  import { NumericInput } from "./NumericInput";

  export default function Demo() {
    const [value, setValue] = useState(1.00);
    return (
      <div className="w-64">
        <NumericInput
          value={value}
          onChange={setValue}
          unit="kg"
          step={0.1}
          min={0}
          max={100}
          decimalPlaces={2}
        />
      </div>
    );
  }
*/