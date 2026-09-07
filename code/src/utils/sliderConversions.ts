export const SLIDER_MAX = 1e6 as const;

export type SliderState = {
  deltaTSlider: number;
  deltaZSlider: number;
  radiusSlider: number;
};

export type PhysicalValues = {
  deltaT: number;
  deltaZ: number;
  R: number;
};

export function valuesFromSliders(sliders: SliderState): PhysicalValues {
  return {
    deltaT:
      Math.round(Math.pow(sliders.deltaTSlider / SLIDER_MAX, 3) * 9999 + 1) /
      100,
    deltaZ: Math.round(Math.pow(sliders.deltaZSlider / SLIDER_MAX, 3) * 5000),
    R:
      Math.round(Math.pow(sliders.radiusSlider / SLIDER_MAX, 3) * 4999 + 1) /
      10,
  };
}

export function valuesToSliders(
  values: Partial<PhysicalValues>,
  current: SliderState,
): SliderState {
  return {
    deltaTSlider:
      values.deltaT !== undefined
        ? Math.cbrt((values.deltaT * 100 - 1) / 9999) * SLIDER_MAX
        : current.deltaTSlider,
    deltaZSlider:
      values.deltaZ !== undefined
        ? Math.cbrt(values.deltaZ / 5000) * SLIDER_MAX
        : current.deltaZSlider,
    radiusSlider:
      values.R !== undefined
        ? Math.cbrt((values.R * 10 - 1) / 4999) * SLIDER_MAX
        : current.radiusSlider,
  };
}

export const DEFAULT_SLIDER_STATE: SliderState = valuesToSliders(
  { deltaT: 3, deltaZ: 0, R: 10 },
  { deltaTSlider: 0, deltaZSlider: 0, radiusSlider: 0 },
);
