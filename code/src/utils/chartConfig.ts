import type { Plot, Scale } from "../Chart2";

export const Rs = 287.052874;

export type MinMax = {
  z: [number, number];
  deltaT: [number, number];
  T: [number, number];
  v: [number, number];
  R: [number, number];
};

export function makeIsothermals(): Plot[] {
  return Array.from({ length: 20 }, (_, i) => {
    const t = -140 + i * 10;
    return {
      verticalScale: "logP",
      horizontalScale: "temp",
      data: [
        [t, 100],
        [t, 1050],
      ],
      color: "#f004",
      strokeWidth: 0.5,
    } as Plot;
  });
}

export function makeTimeScale(withLabel: boolean): Scale {
  return {
    names: withLabel ? { en: "Time", de: "Zeit" } : { en: "", de: "" },
    units: withLabel ? "min" : "",
    position: "bottom",
    tickSpacing: 10,
    range: [1, 1800],
    tickValues: (t) => (t % 60 === 0 ? (t / 60).toString() : ""),
    lineColors: (t) => (t % 300 === 0 ? "#0003" : "#0001"),
    color: "#000",
  } as Scale;
}
