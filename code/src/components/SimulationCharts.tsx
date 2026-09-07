import { useMemo } from "react";
import { Chart2 } from "../Chart2";
import type { Result } from "../Simulation";
import type { RadioSondeDataSet } from "../RadioSonde";
import {
  makeAirDataModel,
  makeAltitudeForPressureFunction,
} from "../RadioSonde";
import { Rs, type MinMax, makeIsothermals, makeTimeScale } from "../utils/chartConfig";
import { Toggle } from "./Toggle";

type Props = {
  selectedDate: string;
  currentStationData: RadioSondeDataSet | null;
  results: Result[];
  minMax: MinMax;
  showRH: boolean;
  onShowRHChange: (show: boolean) => void;
  zoom: boolean;
  onZoomChange: (zoom: boolean) => void;
};

export function SimulationCharts({
  selectedDate,
  currentStationData,
  results,
  minMax,
  showRH,
  onShowRHChange,
  zoom,
  onZoomChange,
}: Props) {
  const isothermals = useMemo(() => makeIsothermals(), []);
  const timeScale = useMemo(() => makeTimeScale(true), []);
  const timeScale2 = useMemo(() => makeTimeScale(false), []);

  const airdataModel = makeAirDataModel(
    currentStationData?.[selectedDate] ?? [],
  );
  const altForPressure = makeAltitudeForPressureFunction(
    currentStationData?.[selectedDate] ?? [],
  );

  // Altitude/temperature range actually experienced by the thermal, plus a margin.
  const thermalRange = useMemo(() => {
    if (results.length === 0) return null;
    const altitudes = results.map((r) => r.z);
    const temps = results.map((r) => r.T - 273.15);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    return {
      alt: [minAlt - (maxAlt - minAlt) * 0.1, maxAlt + (maxAlt - minAlt) * 0.1] as [number, number],
      temp: [minTemp - (maxTemp - minTemp) * 0.1, maxTemp + (maxTemp - minTemp) * 0.1] as [number, number],
    };
  }, [results]);

  return (
    <div className="w-full max-w-2xl aspect-[2/5] mx-auto px-2">
      <div className="flex gap-4 justify-end pt-1 pr-2">
        <Toggle
          id="switch-show-rh"
          label={"Rel. Feuchte"}
          checked={showRH}
          onChange={onShowRHChange}
        />
        <Toggle
          id="switch-zoom"
          label="Zoom"
          checked={zoom}
          onChange={onZoomChange}
        />
      </div>
      <Chart2
        lang="de"
        subCharts={[
          // ── Skew-T (Stüve) diagram ────────────────────────────────────
          {
            layout: { x: 0, y: 0, width: 1, height: 2 / 5 },
            margins: { left: 35, right: 35, top: 35, bottom: 35 },
            plots: [
              ...isothermals,
              {
                verticalScale: "logP",
                horizontalScale: "RH",
                data:
                  currentStationData?.[selectedDate]?.map((d) => [
                    d.RH,
                    d.P,
                  ]) ?? [],
                color: "#aaf",
                hidden: !showRH,
              },
              {
                verticalScale: "logP",
                horizontalScale: "temp",
                data:
                  currentStationData?.[selectedDate]?.map((d) => [d.T, d.P]) ??
                  [],
              },
              {
                verticalScale: "logP",
                horizontalScale: "temp",
                data:
                  currentStationData?.[selectedDate]?.map((d) => [
                    d.TD,
                    d.P,
                  ]) ?? [],
                strokeDasharray: "2,3",
              },
              {
                verticalScale: "alt",
                horizontalScale: "temp",
                data: results.map((r) => [r.T - 273.15, r.z]),
                color: "#080",
                strokeWidth: 2,
              },
            ],
            scales: {
              alt: {
                names: { en: "Altitude", de: "Höhe" },
                units: "km AMSL",
                position: "right",
                range:
                  zoom && thermalRange
                    ? thermalRange.alt
                    : [altForPressure(1050), altForPressure(100)],
                transform: (z) => {
                  const p = airdataModel!(z).p;
                  return Math.log(p);
                },
                tickValues: (t) =>
                  zoom && thermalRange && thermalRange.alt[1] - thermalRange.alt[0] < 5000
                    ? t % 100 === 0 ? (t / 1000).toFixed(1) : ""
                    : t % 1000 === 0 ? (t / 1000).toString() : "",
                lineColors: () => "#0000",
                color: "#666",
              },
              logP: {
                names: { en: "Pressure", de: "Druck" },
                units: "hPa",
                position: "left",
                range:
                  zoom && thermalRange
                    ? [airdataModel!(thermalRange.alt[1]).p, airdataModel!(thermalRange.alt[0]).p]
                    : [100, 1050],
                transform: (p) => Math.log(p),
                inverted: true,
                tickValues: (t) =>
                  t != 1100 && t % 10 === 0 ? t.toString() : "",
                lineColors: (t) => (t % 100 === 0 ? "#0003" : "#0000"),
                strokeWidth: 0.5,
                color: "#000",
                tickSpacing: 20,
              },
              temp: {
                names: { en: "Temperature", de: "Temperatur" },
                units: "°C",
                position: "bottom",
                range: zoom && thermalRange ? thermalRange.temp : [-50, 50],
                skew: zoom && thermalRange ? 0 : 1,
                tickValues: (t) => (t % 1 === 0 ? t.toString() : ""),
                lineColors: () => "",
                color: "#f00",
              },
              RH: {
                names: {
                  en: "rel. Humidity",
                  de: "Rel. Feuchtigkeit",
                },
                units: "%",
                position: "top",
                range: [0, 100],
                tickValues: (t) => (t % 10 === 0 ? t.toString() : ""),
                lineColors: (t) => (t % 10 === 0 ? "#88f4" : "#88f0"),
                strokeWidth: 0.5,
                color: "#88f",
                hidden: !showRH,
              },
            },
          },

          // ── Height & vertical speed vs time ──────────────────────────
          {
            layout: { x: 0, y: 2 / 5, width: 1, height: 1 / 5 },
            margins: { left: 35, right: 35, top: 35 / 3, bottom: (1 * 35) / 3 },
            plots: [
              {
                verticalScale: "height",
                horizontalScale: "time",
                data: results.map((r) => [r.t, r.z]),
              },
              {
                verticalScale: "v",
                horizontalScale: "time",
                data: results.map((r) => [r.t, r.v]),
                color: "#88f",
              },
            ],
            scales: {
              time: timeScale2,
              height: {
                names: { en: "Height", de: "Höhe" },
                units: "km AMSL",
                position: "left",
                range: minMax.z,
                tickValues: (t) =>
                  t % 100 === 0 ? (t / 1000).toFixed(1) : "",
                lineColors: () => "",
                color: "#000",
              },
              v: {
                names: { en: "Vertical Speed", de: "Geschwindigkeit" },
                units: "m/s",
                position: "right",
                range: minMax.v,
                tickValues: (t) => (t % 1 === 0 ? t.toString() : ""),
                lineColors: (t) => (t === 0 ? "#88f3" : ""),
                color: "#88f",
              },
            },
          },

          // ── Temperature & delta-T vs time ────────────────────────────
          {
            layout: { x: 0, y: 3 / 5, width: 1, height: 1 / 5 },
            margins: {
              left: 35,
              right: 35,
              top: 35 / 3,
              bottom: (2 * 35) / 3,
            },
            plots: [
              {
                verticalScale: "deltaT",
                horizontalScale: "time",
                data: results.map((r) => [r.t, r.T - r.Tenv]),
                color: "#f80",
              },
              {
                verticalScale: "T",
                horizontalScale: "time",
                data: results.map((r) => [r.t, r.T - 273.15]),
                color: "#f00",
              },
            ],
            scales: {
              time: timeScale2,
              deltaT: {
                names: {
                  en: "Temperature difference",
                  de: "Temperaturdifferenz",
                },
                units: "°C",
                position: "left",
                range: minMax.deltaT,
                tickValues: (t) => (t % 1 === 0 ? t.toString() : ""),
                lineColors: (t) => (t === 0 ? "#f803" : ""),
                color: "#f80",
              },
              T: {
                names: { en: "Temperature", de: "Temperatur" },
                units: "°C",
                position: "right",
                range: minMax.T,
                tickValues: (t) => (t % 1 === 0 ? t.toString() : ""),
                lineColors: () => "",
                color: "#f00",
              },
            },
          },

          // ── Radius vs time ────────────────────────────────────────────
          {
            layout: { x: 0, y: 4 / 5, width: 1, height: 1 / 5 },
            margins: { left: 35, right: 35, top: (0 * 35) / 3, bottom: 35 },
            plots: [
              {
                verticalScale: "radius",
                horizontalScale: "time",
                data: results.map((r) => {
                  const rhp = r.p * 100/ (Rs * r.T);
                  const V = r.m / rhp;
                  const radius = Math.cbrt((3 * V) / (4 * Math.PI));
                  return [r.t, radius];
                }),
              },
            ],
            scales: {
              time: timeScale,
              radius: {
                names: { en: "Radius", de: "Radius" },
                units: "m",
                position: "left",
                range: minMax.R,
                tickValues: (t) => (t % 1 === 0 ? t.toString() : ""),
                lineColors: () => "",
                color: "#000",
              },
            },
          },
        ]}
      />
    </div>
  );
}
