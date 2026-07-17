/** gravitational acceleration [m/s^2] */
const g = 9.81;
/** specific gas constant for dry air [J/(kg * K)] */
const Rs = 287.052874;
/** dry adiabatic lapse rate [K/m] */
const Gd = 9.8e-3;

/** initial radius of the thermal [m] */
const R0 = initialRadius();

const e0 = 611.2; // Pa 
const Rv = 461.5; // J/(kg*K) gas constant for water vapor
const L = 2.5e6; // J/kg latent heat of vaporization
const epsilon = Rs/Rv; // kg/kg (ratio of gas constants for dry air and water vapor)

const Lv = 2.5e6;// J/kg
const Cp = 1004;// J/kg/K

/**
 * Magnus formula for saturation vapor pressure over water.
 * @param T temperature in K
 * @returns saturation vapor pressure in Pa
 */
function saturationVaporPressure(T) {
  const T0 = 273.15; // K
  return e0 * Math.exp(L / Rv * (1 / T0 - 1 / T));
}

/**
 * Calculates the mixing ratio of water vapor in air.
 * @param Td dew point temperature in K
 * @param p pressure in Pa
 * @returns mixing ratio in kg/kg
 */
function mixingRatio(Td, p) {
  const e = saturationVaporPressure(Td);
  return epsilon * e / (p - e);
}

/**
 * The model function, called by the simulator. Do not rename.
 * All output fields are optional and assumed zero if omitted.
 * @param {ModelInput}
 * @returns {ModelOutput} dudt, dTdt, dmdt, dragCoefficient
 */
function model({z, v, T, m, r, rl, Tenv, p, renv}) {
  const Tv    = T    * (1 + 0.608 * r - rl);   // virtual T of parcel
  const Tvenv = Tenv * (1 + 0.608 * renv);      // virtual T of environment
  const rho    = p / (Rs * Tv);
  const rhoEnv = p / (Rs * Tvenv);
  /** volume of the thermal [m^3] */
  const V = m / rho;
  /** radius of the sphere [m] */
  const R = Math.cbrt((3 * V) / (4 * Math.PI));
  /** area of the sphere [m^2] */
  const A = 4 * Math.PI * R * R;

  const lambda = 0.57;
  const alpha = lambda / 6 * R / R0;
  /** entrainment velocity [m/s] */
  const ve = Math.abs(v) * alpha;
  /** mass gain due to entrainment [kg/s] */
  const dmdt = A * ve * rhoEnv; 

  // --- dry adiabatic temperature tendency ---
  let dTdt = -Gd * v + (Tenv - T) * (dmdt / m);

  // --- mixing ratio tendency from entrainment ---
  let drdt = (renv - r) * (dmdt / m);

  // --- check for condensation ---
  const rs = mixingRatio(T, p);   // saturation mixing ratio at parcel T
  const rTotal = r + rl;          // total water (vapor + liquid)

  let drldt = 0;
  // if (r > rs) {
  //   // supersaturated: condense excess
  //   // latent heat release warms the parcel
  //   const excess = r - rs;        // kg/kg condensed this step (approx)
  //   // proper tendency: use drs/dT to iterate, or just:
  //   const dTdt_latent = (Lv / Cp) * excess / dt;  // K/s if you pass dt
  //   dTdt += dTdt_latent;
  //   drdt -= excess / dt;
  //   drldt = excess / dt;
  // }

  // --- buoyancy with virtual temperature ---
  const buoyancy = g * (Tvenv - Tv) / Tvenv;

  return {
    dvdt: buoyancy - v * (dmdt / m),
    dTdt,
    drdt,
    drldt,
    dmdt,
  };
};