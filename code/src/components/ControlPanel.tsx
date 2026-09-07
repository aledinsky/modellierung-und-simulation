import type { KeyboardEvent } from "react";
import type { StationDataJson, RadioSondeDataSet } from "../RadioSonde";
import { NumericInput } from "../NumericInput";
import {
  SLIDER_MAX,
  type SliderState,
  valuesFromSliders,
  valuesToSliders,
} from "../utils/sliderConversions";

type Props = {
  stations: StationDataJson[];
  availableStations: number[];
  selectedStation: string;
  onStationChange: (id: string) => void;
  currentStationData: RadioSondeDataSet | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateSelectKeyDown: (e: KeyboardEvent<HTMLSelectElement>) => void;
  sliderState: SliderState;
  onSliderChange: (state: SliderState) => void;
};

export function ControlPanel({
  stations,
  availableStations,
  selectedStation,
  onStationChange,
  currentStationData,
  selectedDate,
  onDateChange,
  onDateSelectKeyDown,
  sliderState,
  onSliderChange,
}: Props) {
  const values = valuesFromSliders(sliderState);

  return (
    <div className="shrink-0">
      {/* Station / Date row */}
      <div className="flex items-baseline gap-4 mb-2">
        <label
          htmlFor="station-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Datei:
        </label>
        <select
          name="station"
          id="station-select"
          value={selectedStation}
          onChange={(e) => onStationChange(e.target.value)}
          className="py-1 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableStations.map((id) => {
            const station = stations.find((s) => Number(s.Stations_id) === id);
            return (
              <option
                value={station?.Stations_id ?? ""}
                key={station?.Stations_id ?? ""}
              >
                {station?.Stationsname.replace("_", "") ?? "Unknown Station"}
              </option>
            );
          })}
        </select>

        <label
          htmlFor="date-select"
          className="block text-sm font-medium text-gray-700"
        >
          Datensatz:
        </label>
        <select
          name="date"
          id="date-select"
          value={selectedDate}
          onChange={(e) => onDateChange(e.currentTarget.value)}
          onKeyDown={onDateSelectKeyDown}
          disabled={!currentStationData}
          className="w-full py-1 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 disabled:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currentStationData &&
            Object.keys(currentStationData)
              .sort((a, b) => (a > b ? 1 : -1))
              .map((name) => (
                <option value={name} key={name}>
                  {name}
                </option>
              ))}
        </select>
      </div>

      {/* Höhe über Grund */}
      <div className="flex items-baseline gap-4 mb-2">
        <label
          htmlFor="z0-select"
          className="w-60 flex items-center text-sm font-medium text-gray-700"
        >
          Höhe über Grund:
        </label>
        <input
          type="range"
          min="0"
          max={SLIDER_MAX}
          value={sliderState.deltaZSlider}
          onChange={(e) =>
            onSliderChange({
              ...sliderState,
              deltaZSlider: Number(e.target.value),
            })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="w-25">
          <NumericInput
            value={values.deltaZ}
            onChange={(value) =>
              onSliderChange(valuesToSliders({ deltaZ: value }, sliderState))
            }
            unit="m"
            min={0}
            max={5000}
            step={
              values.deltaZ < 25
                ? 1
                : values.deltaZ < 100
                  ? 5
                  : values.deltaZ < 250
                    ? 10
                    : values.deltaZ < 1000
                      ? 50
                      : 100
            }
          />
        </div>
      </div>

      {/* Temperatur-Delta */}
      <div className="flex items-baseline gap-4 mb-2">
        <label
          htmlFor="T0-select"
          className="w-60 flex items-center text-sm font-medium text-gray-700"
        >
          Temperatur-Delta:
        </label>
        <input
          type="range"
          min="0"
          max={SLIDER_MAX}
          value={sliderState.deltaTSlider}
          onChange={(e) =>
            onSliderChange({
              ...sliderState,
              deltaTSlider: Number(e.target.value),
            })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="w-25">
          <NumericInput
            value={values.deltaT}
            onChange={(value) =>
              onSliderChange(valuesToSliders({ deltaT: value }, sliderState))
            }
            unit="°C"
            decimalPlaces={values.deltaT < 1 ? 2 : values.deltaT < 10 ? 1 : 0}
            min={0.01}
            max={100}
            step={
              values.deltaT < 0.5
                ? 0.01
                : values.deltaT < 1
                  ? 0.05
                  : values.deltaT < 5
                    ? 0.1
                    : values.deltaT < 10
                      ? 0.5
                      : values.deltaT < 50
                        ? 1
                        : 5
            }
          />
        </div>
      </div>

      {/* Radius */}
      <div className="flex items-baseline gap-4 mb-2">
        <label
          htmlFor="R0-select"
          className="flex items-center text-sm font-medium text-gray-700 mb-2 w-60"
        >
          Radius:
        </label>
        <input
          type="range"
          min="0"
          max={SLIDER_MAX}
          value={sliderState.radiusSlider}
          onChange={(e) =>
            onSliderChange({
              ...sliderState,
              radiusSlider: Number(e.target.value),
            })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="w-25">
          <NumericInput
            value={values.R}
            onChange={(value) =>
              onSliderChange(valuesToSliders({ R: value }, sliderState))
            }
            unit="m"
            decimalPlaces={values.R < 10 ? 1 : 0}
            min={0.1}
            max={500}
            step={
              values.R < 2
                ? 0.1
                : values.R < 5
                  ? 0.2
                  : values.R < 10
                    ? 0.5
                    : values.R < 20
                      ? 1
                      : values.R < 50
                        ? 2
                        : values.R < 100
                          ? 5
                          : values.R < 200
                            ? 10
                            : 20
            }
          />
        </div>
      </div>
    </div>
  );
}
