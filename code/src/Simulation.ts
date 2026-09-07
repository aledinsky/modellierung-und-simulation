//import {type ModelInput, type ModelOutput } from "./Model";

/**
 * Environmental temperature and pressure at a given altitude.
 * @field T: environmental temperature in K
 * @field p: pressure in Pa
 * @field Td: dew point temperature in K
 */
export type Airdata = {
  T: number;
  p: number;
  Td: number;
};


/**
 * A single recorded state: full SimParams plus the simulation timestamp.
 * @field t: current timestamp in s
 */
export type Result = ModelInput & { t: number };

/** User-supplied physics model. */
export type Model = (params: ModelInput) => ModelOutput;

/** Returns temperature and pressure for a given altitude. */
export type AirdataModel = (z: number) => Airdata;

export type InitialValues = {
  z: number;
  T: number;
  m: number;
};

/**
 * @field dt: time step in seconds
 * @field steps: number of integration steps
 */
export type IntegratorConfig = {
  dt: number;
  steps: number;
};

/**
 * Integrates the model forward in time using Euler-Cromer for velocity/position
 * and an exponential decay for drag.
 */
export function integrate(
  model: Model,
  airDataModel: AirdataModel,
  y0: InitialValues,
  cfg: IntegratorConfig,
): Result[] {
  const { dt, steps } = cfg;
  const { T: T0, p: p0 } = airDataModel(y0.z);
  const result: Result[] = [{ ...y0, t: 0, Tenv: T0, p: p0, v:0}];

  for (let i = 0; i < steps; i++) {
    const y = result[i];
    const { dvdt = 0, dTdt = 0, dmdt = 0, dragCoefficient = 0 } = model({z: y.z, v: y.v, T: y.T, m: y.m, Tenv: y.Tenv, p: y.p});

    const z = y.z + y.v * dt;
    const { T: Tenv, p } = airDataModel(z);

    result.push({
      t: y.t + dt,
      z,
      // Drag applied as exponential decay to avoid overshoot at large dt
      v: (y.v + dvdt * dt) * Math.exp(-dragCoefficient * dt),
      T: y.T + dTdt * dt,
      m: y.m + dmdt * dt,
      Tenv,
      p,
    });
  }
  return result;
}

type State = { z: number; v: number; T: number; m: number };
type Derivative = { dz: number; dv: number; dT: number; dm: number };

/**
 * Integrates the model forward in time using the classical
 * 4th-order Runge-Kutta method (RK4).
 *
 * @param model User-supplied physics model.
 * @param airDataModel Returns environmental temperature and pressure for a given altitude.
 * @param y0 Initial altitude, temperature and mass (velocity is assumed to start at 0).
 * @param cfg Time step size and number of integration steps.
 * @returns The full time series of simulated states.
 */
export function integrateRK4(
  model: Model,
  airDataModel: AirdataModel,
  y0: InitialValues,
  cfg: IntegratorConfig,
): Result[] {
  const { dt, steps } = cfg;
  const { T: T0, p: p0 } = airDataModel(y0.z);
  const result: Result[] = [{ ...y0, t: 0, Tenv: T0, p: p0, v:0 }];

  /**
   * Evaluates the model's derivatives at an arbitrary intermediate state.
   * Re-fetches Tenv/p at the given altitude, since RK4 needs derivatives
   * at several intermediate points within a single time step.
   */
  function derivatives(s: State): Derivative {
    const { T: Tenv, p } = airDataModel(s.z);
    const { dvdt = 0, dTdt = 0, dmdt = 0, dragCoefficient = 0 } = model({z:s.z, v:s.v, T:s.T, m:s.m, Tenv, p:p * 100});
    return { dz: s.v, dv: dvdt - dragCoefficient * s.v, dT: dTdt, dm: dmdt };
  }

  /** Returns the state advanced by a derivative scaled with step size h. */
  function addScaled(s: State, d: Derivative, h: number): State {
    return { z: s.z + h * d.dz, v: s.v + h * d.dv, T: s.T + h * d.dT, m: s.m + h * d.dm };
  }

  for (let i = 0; i < steps; i++) {
    const y = result[i];
    const s0: State = { z: y.z, v: y.v, T: y.T, m: y.m };

    // Four derivative evaluations per step, at t, two midpoints, and t+dt
    const k1 = derivatives(s0);
    const k2 = derivatives(addScaled(s0, k1, dt / 2));
    const k3 = derivatives(addScaled(s0, k2, dt / 2));
    const k4 = derivatives(addScaled(s0, k3, dt));

    // Weighted average of the four slopes (Simpson's-rule-like weighting)
    const z = s0.z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
    const v = s0.v + (dt / 6) * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);
    const T = s0.T + (dt / 6) * (k1.dT + 2 * k2.dT + 2 * k3.dT + k4.dT);
    const m = s0.m + (dt / 6) * (k1.dm + 2 * k2.dm + 2 * k3.dm + k4.dm);

    const { T: Tenv, p } = airDataModel(z);

    result.push({ t: y.t + dt, z, v, T, m, Tenv, p });
  }
  return result;
}
