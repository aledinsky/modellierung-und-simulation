/** gravitational acceleration [m/s^2] */
const g = 9.81;
/** specific gas constant for dry air [J/(kg * K)] */
const Rs = 287.052874;
/** dry adiabatic lapse rate [K/m] */
const Gd = 9.8e-3;

const eta = 1;

/**
 * The model function, called by the simulator. Do not rename.
 * All output fields are optional and assumed zero if omitted.
 * @param {ModelInput}
 * @returns {ModelOutput} dudt, dTdt, dmdt
 */
function model({z, v, T, m, Tenv, p}) {
  const rho = p / (Rs * T);
  /** volume of the thermal [m^3] */
  const V = m / rho;
  /** radius of the sphere [m] */
  const R = Math.cbrt((3 * V) / (4 * Math.PI));
 
  /** buoyancy force per unit mass [m/s^2] */
  const buoyancy = g * (T - Tenv) / Tenv;
  /** adiabatic temperature lapse rate [K/s] */
  const adiabatic = -Gd * v; 
  /** Stokes drag per unit mass [m/s^2] */
  const drag = 6 * Math.PI * R * eta * v / m;

  return {
    dvdt: buoyancy - drag,
    dTdt: adiabatic,
  };
};