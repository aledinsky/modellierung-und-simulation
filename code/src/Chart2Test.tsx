import { Chart2 } from "./Chart2";

function Chart2Test() {
  return (
    <div className="flex w-full h-full">
      <div className="w-70 h-full flex-shrink-0">Left panel</div>
      <div className="flex-1 h-full min-w-0 bg-green-200">
        <Chart2
        lang="de"
          subCharts={[
            {
              layout: { x: 0, y: 0, width: 0.4, height: 1 },
              margins: { left: 35, right: 10, top: 35, bottom: 35 },
              plots: [],
              scales: {
                alt: {
                  names: {
                    en: "Altitude",
                    de: "Höhe",
                  },
                  units: "km AMSL",
                  position: "left",
                  tickSpacing: 1000,
                  range: [0, 20000],
                  tickValues: (t) => (t % 5000 === 0 ? (t/1000).toString() : ""),
                  lineColors: (t) => (t % 5000 === 0 ? "#0003" : "#0001"),
                  color: "#000",
                },
                temp: {
                  names: {
                    en: "Temperature",
                    de: "Temperatur",
                  },
                  units: "°C",
                  position: "bottom",
                  tickSpacing: 10,
                  range: [-70, 40],
                  tickValues: (t) => (t % 20 === 0 ? t.toString() : ""),
                  lineColors: (t) => (t % 20 === 0 ? "#f003" : "#f001"),
                  color: "#f00",
                },
                pressure: {
                  names: {
                    en: "Pressure",
                    de: "Druck",
                  },
                  units: "hPa",
                  position: "top",
                  tickSpacing: 200,
                  range: [0, 1100],
                  tickValues: (t) => (t % 10 === 0 ? t.toString() : ""),
                  lineColors: () => "",
                  color: "#66f",
                },
                // {
                //   position: "right",3
                //   numTicks: 7,
                //   tickValues: (t) => (t*5).toFixed(0),
                //   lineColor: (t) => "",
                //   color: "purple",
                // },
                // {
                //   position: "top",
                //   numTicks: 5,
                //   tickValues: (t) => (t*5).toFixed(0),
                //   lineColor: (t) => "",
                //   color: "blue",
                // },
                // {
                //   position: "bottom",
                //   numTicks: 7,
                //   tickValues: (t) => (t*5).toFixed(0),
                //   lineColor: (t) => "",
                //   color: "purple",
                // },
              },
            },
            // {
            //   layout: { x: 1 / 3, y: 0, width: 2 / 3, height: 1 / 3 },
            // },
            // {
            //   layout: { x: 1 / 3, y: 1 / 3, width: 2 / 3, height: 1 / 3 },
            // },
            // {
            //   layout: { x: 1 / 3, y: 2 / 3, width: 2 / 3, height: 1 / 3 },
            // },
          ]}
        />
      </div>
    </div>
  );
}
export default Chart2Test;
