import { useMemo } from "react";
import { type RadioSondeDataSet, makeAirDataModel } from "../RadioSonde";
import { integrateRK4, type Model, type Result } from "../Simulation";
import {
  type SliderState,
  valuesFromSliders,
} from "../utils/sliderConversions";
import { Rs, type MinMax } from "../utils/chartConfig";

export function useSimulation(
  model: Model | undefined,
  currentStationData: RadioSondeDataSet | null,
  selectedDate: string,
  sliderState: SliderState,
) {
  // Re-run simulation whenever inputs change
  const { results, runtimeError } = useMemo(() => {
    const values = valuesFromSliders(sliderState);
    const airdataModel = makeAirDataModel(
      currentStationData?.[selectedDate] ?? [],
    );
    const base = currentStationData?.[selectedDate]?.[0];
    if (!base) return { results: [] as Result[], runtimeError: null };

    const initialHeight = base.H + values.deltaZ;
    const env = airdataModel(initialHeight);
    const T = env.T + values.deltaT;
    const rho = env.p * 100 / (Rs * T);
    const V = (4 / 3) * Math.PI * Math.pow(values.R, 3);
    const m = rho * V;

    try {
      const results =
        (model &&
          integrateRK4 (
            model,
            airdataModel,
            { z: initialHeight, T, m },
            { dt: 1, steps: 1800 },
          )) ||
        [];
      return { results, runtimeError: null };
    } catch (e) {
      console.error("Simulation runtime error:", e);
      return {
        results: [] as Result[],
        runtimeError: e instanceof Error ? e.message : String(e),
      };
    }
  }, [model, selectedDate, currentStationData, sliderState]);

  // Recompute min/max bounds from results for chart axis ranges
  const minMax = useMemo(() => {
    if (results.length === 0) return undefined;

    const minMax: MinMax = {} as MinMax;
    results.forEach((r) => {
      minMax.z = [
        Math.min(minMax.z?.[0] ?? r.z, r.z),
        Math.max(minMax.z?.[1] ?? r.z, r.z),
      ];
      minMax.T = [
        Math.min(minMax.T?.[0] ?? r.T, r.T),
        Math.max(minMax.T?.[1] ?? r.T, r.T),
      ];
      const deltaT = r.T - r.Tenv;
      minMax.deltaT = [
        Math.min(minMax.deltaT?.[0] ?? deltaT, deltaT),
        Math.max(minMax.deltaT?.[1] ?? deltaT, deltaT),
      ];
      minMax.v = [
        Math.min(minMax.v?.[0] ?? r.v, r.v),
        Math.max(minMax.v?.[1] ?? r.v, r.v),
      ];
      const rho = r.p * 100 / (Rs * r.T);
      const V = r.m / rho;
      const radius = Math.cbrt((3 * V) / (4 * Math.PI));
      minMax.R = [
        Math.min(minMax.R?.[0] ?? radius, radius),
        Math.max(minMax.R?.[1] ?? radius, radius),
      ];
    });

    const DeltaTRange = minMax.deltaT[1] - minMax.deltaT[0];
    minMax.z = [0, Math.ceil((minMax.z[1] * 1.1) / 100) * 100];
    minMax.deltaT = [
      Math.floor(minMax.deltaT[0] - DeltaTRange * 0.1),
      Math.ceil(minMax.deltaT[1] + DeltaTRange * 0.1),
    ];
    minMax.T = [
      Math.floor((minMax.T[0] - 273.15) / 10 - 0.5) * 10,
      Math.ceil((minMax.T[1] - 273.15) / 10 + 0.5) * 10,
    ];
    minMax.v = [Math.floor(minMax.v[0] - 0.5), Math.ceil(minMax.v[1] + 0.5)];
    minMax.R = [0, Math.ceil(minMax.R[1] * 1.1)];

    return minMax;
  }, [results]);

  return { results, minMax, runtimeError };
}
