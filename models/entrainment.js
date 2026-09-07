/** gravitational acceleration [m/s^2] */
const g = 9.81;
/** specific gas constant for dry air [J/(kg * K)] */
const Rs = 287.052874;
/** dry adiabatic lapse rate [K/m] */
const Gd = 9.8e-3;

/** initial radius of the thermal [m] */
const R0 = initialRadius();

/**
 * The model function, called by the simulator. Do not rename.
 * All output fields are optional and assumed zero if omitted.
 * @param {ModelInput}
 * @returns {ModelOutput} dudt, dTdt, dmdt, dragCoefficient
 */
function model({z, v, T, m, Tenv, p}) {
  /** density [kg/m^3] */
  const rho = p / (Rs * T);
  /** density of environment [kg/m^3] */
  const rhoEnv = p / (Rs * Tenv);
  /** volume of the thermal [m^3] */
  const V = m / rho;
  /** radius of the sphere [m] */
  const R = Math.cbrt((3 * V) / (4 * Math.PI));
  /** area of the sphere [m^2] */
  const A = 4 * Math.PI * R * R;

  /** buoyancy force per unit mass [m/s^2] */
  const buoyancy = g * (rhoEnv - rho) / rho;
  /** adiabatic temperature lapse rate [K/s] */
  const adiabatic = -Gd * v; 

  const lambda = 0.57;
  const alpha = lambda / 6 * R / R0;
  /** entrainment velocity [m/s] */
  const ve = Math.abs(v) * alpha;
  /** mass gain due to entrainment [kg/s] */
  const dmdt = A * ve * rhoEnv; 

  return {
    dvdt: buoyancy - v * (dmdt / m),
    dTdt: adiabatic + (Tenv - T) * (dmdt / m),
    dmdt,
  };
};