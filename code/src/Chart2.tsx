import { useContainerSize } from "./UseContainerSize";
import { computeTickPositions } from "./Utils";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Plot = {
  verticalScale: string; // key of the vertical scale to use
  horizontalScale: string; // key of the horizontal scale to use
  data: [number, number][]; // [[x1, y1], [x2, y2], ...]
  strokeDasharray?: string; // e.g. "5,5" for dashed lines
  color?: string; // optional color for the plot line
  strokeWidth?: number;
  hidden?: boolean;
};
type Lang = "en" | "de";

export type Scale = {
  names: Record<Lang, string>;
  units: Record<Lang, string> | string;
  position: "left" | "right" | "top" | "bottom";
  range: [number, number];
  transform?: (v: number) => number; // optional transform function for the scale values
  inverted?: boolean; // whether the scale is inverted (e.g. for altitude)
  tickValues: (t: number) => string;
  lineColors: (t: number) => string;
  color?: string;
  hidden?: boolean;
  skew?: number; // for skewed temperature axis in the T-d diagram
  strokeWidth?: number;
  tickSpacing?: number; // optional fixed spacing between ticks, if not using tickValues function
};

type SubChart = {
  layout: Rect;
  margins?: Margins;
  scales: Record<string, Scale>;
  plots: Plot[];
};

export type Chart2Props = {
  lang?: Lang;
  subCharts: SubChart[];
};

const defaultMargins: Margins = { top: 20, right: 20, bottom: 20, left: 20 };

function mapScaleValue(scale: Scale, value: number): number {
  let t = (value - scale.range[0]) / (scale.range[1] - scale.range[0]);
  if (scale.transform) {
    const r0 = scale.transform(scale.range[0]);
    const r1 = scale.transform(scale.range[1]);
    const rv = scale.transform(value);
    t = (rv - r0) / (r1 - r0);
  }
  if (scale.inverted) t = 1 - t;
  return t;
}

function drawScale(
  scale: Scale,
  rect: Rect,
  lang: Lang = "en",
): React.ReactNode {
  const scaleSize =
    scale.position === "left" || scale.position === "right"
      ? rect.height
      : rect.width;
  const tickCount = Math.ceil(scaleSize / (scale.tickSpacing ?? 10));
  const tickValues = computeTickPositions(
    scale.range[0],
    scale.range[1],
    tickCount,
  );
  // const firstTick =
  //   Math.ceil(scale.range[0] / scale.tickSpacing) * scale.tickSpacing;
  // const lastTick =
  //   Math.floor(scale.range[1] / scale.tickSpacing) * scale.tickSpacing;
  // const tickValues = Array.from(
  //   { length: Math.floor((lastTick - firstTick) / scale.tickSpacing) + 1 },
  //   (_, i) => firstTick + i * scale.tickSpacing,
  // );
  const ticks = tickValues.map((tn) => {
    var t = mapScaleValue(scale, tn);
    if (scale.position === "left" || scale.position === "right") t = 1 - t; // Invert t for horizontal scales to have the ticks in the correct order
    const [x1, y1, x2, y2, xtext, ytext, ta, x3, y3] =
      scale.position === "left"
        ? [
            rect.x,
            rect.y + t * rect.height,
            rect.x - 5,
            rect.y + t * rect.height,
            rect.x - 7,
            rect.y + t * rect.height,
            "end",
            rect.x + rect.width,
            rect.y + t * rect.height,
          ]
        : scale.position === "right"
          ? [
              rect.x + rect.width,
              rect.y + t * rect.height,
              rect.x + rect.width + 5,
              rect.y + t * rect.height,
              rect.x + rect.width + 7,
              rect.y + t * rect.height,
              "start",
              rect.x,
              rect.y + t * rect.height,
            ]
          : scale.position === "top"
            ? [
                rect.x + t * rect.width,
                rect.y,
                rect.x + t * rect.width,
                rect.y - 5,
                rect.x + t * rect.width,
                rect.y - 11,
                "middle",
                rect.x + t * rect.width,
                rect.y + rect.height,
              ]
            : [
                rect.x + t * rect.width,
                rect.y + rect.height,
                rect.x + t * rect.width,
                rect.y + rect.height + 5,
                rect.x + t * rect.width,
                rect.y + rect.height + 11,
                "middle",
                rect.x + t * rect.width,
                rect.y,
              ];
    const text = scale.tickValues(tn);
    const lineColor = scale.lineColors(tn);
    return (
      <g key={`tick-${scale.position}-${tn}`}>
        {text && (
          <>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={scale.color ?? "black"}
            />
            <text
              x={xtext}
              y={ytext}
              textAnchor={ta as "end" | "start" | "middle"}
              alignmentBaseline="central"
              fontSize={7}
              fill={scale.color ?? "black"}
            >
              {text}
            </text>
          </>
        )}
        {lineColor && (
          <line x1={x1} y1={y1} x2={x3} y2={y3} stroke={lineColor} strokeWidth={scale.strokeWidth ?? 1} />
        )}
      </g>
    );
  });

  switch (scale.position) {
    case "left":
      return (
        <>
          <line
            x1={rect.x}
            y1={rect.y}
            x2={rect.x}
            y2={rect.y + rect.height}
            stroke={scale.color ?? "black"}
          />
          {ticks}
          <text
            transform={`translate(${rect.x - 29},${rect.height / 2 + rect.y}) rotate(-90)`}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={7}
            fill={scale.color ?? "black"}
          >
            {scale.names[lang] &&
              `${scale.names[lang]} [${typeof scale.units === "string" ? scale.units : scale.units[lang]}]`}
          </text>
        </>
      );
    case "right":
      return (
        <>
          <line
            x1={rect.x + rect.width}
            y1={rect.y}
            x2={rect.x + rect.width}
            y2={rect.y + rect.height}
            stroke={scale.color ?? "black"}
          />
          {ticks}
          <text
            transform={`translate(${rect.x + rect.width + 25},${rect.height / 2 + rect.y}) rotate(-90)`}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={7}
            fill={scale.color ?? "black"}
          >
            {scale.names[lang] &&
              `${scale.names[lang]} [${typeof scale.units === "string" ? scale.units : scale.units[lang]}]`}
          </text>
        </>
      );
    case "top":
      return (
        <>
          <line
            x1={rect.x}
            y1={rect.y}
            x2={rect.x + rect.width}
            y2={rect.y}
            stroke={scale.color ?? "black"}
          />
          {ticks}
          <text
            transform={`translate(${rect.x + rect.width / 2},${rect.y - 25})`}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={7}
            fill={scale.color ?? "black"}
          >
            {scale.names[lang] &&
              `${scale.names[lang]} [${typeof scale.units === "string" ? scale.units : scale.units[lang]}]`}
          </text>
        </>
      );
    case "bottom":
      return (
        <>
          <line
            x1={rect.x}
            y1={rect.y + rect.height}
            x2={rect.x + rect.width}
            y2={rect.y + rect.height}
            stroke={scale.color ?? "black"}
          />
          {ticks}
          <text
            transform={`translate(${rect.x + rect.width / 2},${rect.y + rect.height + 25})`}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={7}
            fill={scale.color ?? "black"}
          >
            {scale.names[lang] &&
              `${scale.names[lang]} [${typeof scale.units === "string" ? scale.units : scale.units[lang]}]`}
          </text>
        </>
      );
  }
}

export function Chart2(charts: Chart2Props) {
  const [ref, { width: trueWidth, height: trueHeight }] = useContainerSize();
  const dpr = window.devicePixelRatio ?? 1;
  const [width, height] = [trueWidth / dpr, trueHeight / dpr];

  function scaleRect(rect: Rect): Rect {
    return {
      x: rect.x * width,
      y: rect.y * height,
      width: rect.width * width,
      height: rect.height * height,
    };
  }

  return (
    <div ref={ref} className="w-full h-full rounded-md">
      {width > 0 && (
        <svg
          width={trueWidth}
          height={trueHeight}
          viewBox={`0 0 ${width} ${height}`}
          fontFamily="System-UI"
          fontVariant="tabular-nums"
        >
          {charts.subCharts.map((c, i) => {
            const rec = scaleRect(c.layout);
            const margins = { ...defaultMargins, ...c.margins };

            // inset the rect by margins
            const inner = {
              x: rec.x + margins.left,
              y: rec.y + margins.top,
              width: rec.width - margins.left - margins.right,
              height: rec.height - margins.top - margins.bottom,
            };

            return (
              <g key={i}>
                {/* <rect
                  x={rec.x}
                  y={rec.y}
                  width={rec.width}
                  height={rec.height}
                  fill={"#eee"}
                /> */}
                <rect
                  x={inner.x}
                  y={inner.y}
                  width={inner.width}
                  height={inner.height}
                  fill="white"
                />
                {Object.keys(c.scales)
                  .filter((unit) => !c.scales[unit].hidden)
                  .map((unit) => drawScale(c.scales[unit], inner, charts.lang))}
                <defs>
                  <clipPath id={`plot-area-${i}`}>
                    <rect
                      x={inner.x}
                      y={inner.y}
                      width={inner.width}
                      height={inner.height}
                    />
                  </clipPath>
                </defs>
                {c.plots
                  .filter((plot) => !plot.hidden)
                  .map((plot, j) => {
                    const xScale = c.scales[plot.horizontalScale];
                    const yScale = c.scales[plot.verticalScale];
                    const skewFactor = xScale.skew ?? 0;
                    const points = plot.data.map(([x, y]) => {
                      
                      const ty =
                        inner.y + (1 - mapScaleValue(yScale, y)) * inner.height;
                      const tx =
                        inner.x + (mapScaleValue(xScale, x) + skewFactor * (1 - (ty - inner.y) / inner.height)) * inner.width;
                      return [tx, ty];
                    });
                    return (
                      <g clip-path={`url(#plot-area-${i})`}>
                        <polyline
                          key={j}
                          points={points.map((p) => p.join(",")).join(" ")}
                          fill="none"
                          stroke={plot.color ?? xScale.color ?? "black"}
                          strokeWidth={plot.strokeWidth ?? 1}
                          strokeDasharray={plot.strokeDasharray}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
