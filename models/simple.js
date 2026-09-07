/** gravitational acceleration [m/s^2] */
const g = 9.81;
/** dry adiabatic lapse rate [K/m] */
const Gd = 9.8e-3;

/**
 * The model function, called by the simulator. Do not rename.
 * All output fields are optional and assumed zero if omitted.
 * @param {ModelInput} z, v, T, m, Tenv, p
 * @returns {ModelOutput} dudt, dTdt, dmdt
 */
function model({v, T, Tenv}) {  
  /** buoyancy force per unit mass [m/s^2] */
  const buoyancy = g * (T - Tenv) / Tenv;
  /** adiabatic temperature lapse rate [K/s] */
  const adiabatic = -Gd * v; 

  return {
    dvdt: buoyancy,
    dTdt: adiabatic,
  };
};