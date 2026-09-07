import { useEffect, useState, type KeyboardEvent } from "react";
import axios from "axios";
import {
  type StationDataJson,
  type RadioSondeDataSet,
  closestDate,
} from "../RadioSonde";
import type { PresetSource } from "../modeleditor/modelTypes";

export function useAppData(radiosondeUrl: string, modelUrl: string) {
  const [stations, setStations] = useState<StationDataJson[]>([]);
  const [availableStations, setAvailableStations] = useState<number[]>([]);
  const [availableModels, setAvailableModels] = useState<PresetSource[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [currentStationData, setCurrentStationData] =
    useState<RadioSondeDataSet | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load stations, available data and models on mount
  useEffect(() => {
    Promise.all([
      axios.get<StationDataJson[]>(`${radiosondeUrl}/stations.json`),
      axios.get<number[]>(`${radiosondeUrl}/availableData.json`),
      axios.get<PresetSource[]>(`${modelUrl}/availableModels.json`),
    ])
      .then(([stationsRes, availableDataRes, availableModelsRes]) => {
        setStations(stationsRes.data);
        setAvailableStations(availableDataRes.data);
        setAvailableModels(availableModelsRes.data);
        setSelectedStation(
          stationsRes.data.find(
            (s) => Number(s.Stations_id) === availableDataRes.data[0],
          )?.Stations_id ?? "",
        );
      })
      .catch((err) => console.error("Error loading data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Load station data when selection changes
  useEffect(() => {
    if (!selectedStation) return;
    axios
      .get<RadioSondeDataSet>(`${radiosondeUrl}/${selectedStation}.json`)
      .then((res) => setCurrentStationData(res.data))
      .catch((err) => console.error("Error loading station data:", err));
  }, [selectedStation]);

  // Auto-select best date when station data arrives
  useEffect(() => {
    if (currentStationData && Object.keys(currentStationData).length > 0) {
      const dates = Object.keys(currentStationData).sort((a, b) =>
        a > b ? 1 : -1,
      );
      const bestDate =
        (selectedDate && closestDate(dates, selectedDate)) || dates[0];
      if (bestDate !== selectedDate) {
        setSelectedDate(bestDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationData]);

  // Arrow key navigation between dates — attach to the date <select> so it
  // only fires while that element has focus.
  function onDateSelectKeyDown(e: KeyboardEvent<HTMLSelectElement>) {
    if (!currentStationData) return;
    let delta: number;
    if (e.key === "ArrowLeft") delta = -1;
    else if (e.key === "ArrowRight") delta = 1;
    else return;

    const dates = Object.keys(currentStationData).sort((a, b) =>
      a > b ? 1 : -1,
    );
    const i = dates.indexOf(selectedDate);
    if (i === -1) return;

    e.preventDefault();
    setSelectedDate(dates[Math.max(0, Math.min(dates.length - 1, i + delta))]);
  }

  return {
    stations,
    availableStations,
    availableModels,
    selectedStation,
    setSelectedStation,
    currentStationData,
    selectedDate,
    setSelectedDate,
    onDateSelectKeyDown,
    loading,
  };
}
