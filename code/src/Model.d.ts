/**
 * Model output
 */
declare interface ModelOutput {
  /** acceleration [m/s^2] */
  dvdt: number;
  /** temperature change [K/s] */
  dTdt: number;
  /** mass change [kg/s] */
  dmdt: number;
  /** water vapor mixing ratio change [kg/kg/s] */
  drdt: number;
  /** liquid water mixing ratio change [kg/kg/s] */
  drldt: number;
  /** decay rate [1/s], applied as exp(-k * dt) */
  dragCoefficient: number;
}

declare interface ModelInput {
  /** altitude [m] */
  z: number;
  /** vertical speed [m/s] */
  v: number;
  /** temperature of thermal [K] */
  T: number;
  /** mass of the thermal [kg] */
  m: number;
  Tenv: number;
  /** pressure [Pa] */
  p: number;
}

/**
 * Gets the initial radius of the thermal from the UI
 */
declare function initialRadius():number
