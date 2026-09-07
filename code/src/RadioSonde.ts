import type { AirdataModel } from "./Simulation";

export interface StationDataJson {
  Stations_id: string;
  von_datum: Date;
  bis_datum: Date;
  Stationshoehe: number;
  geoBreite: number;
  geoLaenge: number;
  Stationsname: string;
  Bundesland: string;
}

export interface RadioSondeData {
  H: number;
  P: number;
  T: number;
  RH: number;
  TD: number;
  FF: number;
  DD: number;
}

export type RadioSondeDataSet = Record<string, RadioSondeData[]>;

export function closestDate(dates: string[], targetDateStr: string) {
  const target = new Date(targetDateStr).getTime();

  let closest = null;
  let smallestDiff = Infinity;

  for (const d of dates) {
    const time = new Date(d).getTime();
    const diff = Math.abs(time - target);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = d;
    }
  }

  return closest;
}

const ScaleHeightTop = 6500;
const ScaleHeightBottom = 8500;

export function makeAirDataModel(rs: RadioSondeData[]): AirdataModel {
  const d = rs.toSorted((a, b) => a.H - b.H);
  if (d.length === 0) {
    return () => ({ T: 0, p: 0, Td: 0 });
  }

  return (z: number) => {
    if (z <= d[0].H) {
      return { T: d[0].T + 273.15, p: d[0].P * Math.exp(-(z - d[0].H) / ScaleHeightBottom), Td: d[0].TD + 273.15 };
    }
    if (z >= d[d.length - 1].H) {
      const top = d[d.length - 1];
      return { T: top.T + 273.15, p: top.P * Math.exp(-(z - top.H) / ScaleHeightTop), Td: top.TD + 273.15 };
    }
    const i = d.findIndex((r) => r.H > z)!;
    const d1 = d[i - 1];
    const d2 = d[i];
    if (!d1 || !d2) return { T: 0, p: 0, Td: 0 };
    const s = (z - d1.H) / (d2.H - d1.H);
    return {
      T: d1.T + s * (d2.T - d1.T) + 273.15,
      p: d1.P + s * (d2.P - d1.P),
      Td: d1.TD + s * (d2.TD - d1.TD) + 273.15,
    };
  };
}



export function makeAltitudeForPressureFunction(rs: RadioSondeData[]): (p: number) => number {
  const d = rs.toSorted((a, b) => a.P - b.P);
  if (d.length === 0) {
    return () => 0;
  }

  return (p: number): number => {
    if (p <= d[0].P) {
      return d[0].H - ScaleHeightTop * Math.log(p / d[0].P);
    }
    if (p >= d[d.length - 1].P) {
      const bot = d[d.length - 1];
      return bot.H - ScaleHeightBottom * Math.log(p / bot.P);
    }
    const i = d.findIndex((r) => r.P > p)!;
    const d1 = d[i - 1];
    const d2 = d[i];
    if (!d1 || !d2) return 0;
    const s = (p - d1.P) / (d2.P - d1.P);
    return d1.H + s * (d2.H - d1.H);
  };
}
