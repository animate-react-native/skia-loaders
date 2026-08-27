export interface Point {
  x: number;
  y: number;
}

/** Everything that describes a curve except its parameters and point function. */
export interface CurveBase {
  /** Human-readable label, e.g. `"Rose Orbit"`. */
  name: string;
  /** Short formula or family label, e.g. `"r = a cos(kθ)"`. */
  tag: string;
  /** Number of particles in the trail. */
  particleCount: number;
  /** How much of the curve the trail covers, in progress units (0–1). */
  trailSpan: number;
  /** Time for one full trip around the curve. */
  durationMs: number;
  /** Time for one full rotation (ignored when `rotate` is false). */
  rotationDurationMs: number;
  /** Time for one in-and-out "breath" of the shape. */
  pulseDurationMs: number;
  /** Ghost outline stroke width, in pixels at a 340px canvas. */
  strokeWidth: number;
  /** Whether the whole shape slowly rotates. */
  rotate: boolean;
}

/**
 * A curve definition. `point` maps a normalized progress plus a breathing
 * factor onto a [0,100]² box; the loader scales that to the canvas.
 *
 * `point` must be a Reanimated worklet — it runs on the UI thread.
 */
export interface CurveConfig<P = unknown> extends CurveBase {
  params: P;
  point(progress: number, detailScale: number, params: P): Point;
}

/** A curve of any parameter shape — the form the loader accepts. */
export type AnyCurveConfig = CurveConfig<any>;

// ─── Parameter shapes, one per curve family ──────────────────────────────────

export interface RoseTrailParams {
  baseRadius: number;
  detailAmplitude: number;
  petalCount: number;
  curveScale: number;
}

export interface RoseOrbitParams {
  orbitRadius: number;
  detailAmplitude: number;
  petalCount: number;
  curveScale: number;
}

export interface RoseParams {
  roseA: number;
  roseABoost: number;
  roseBreathBase: number;
  roseBreathBoost: number;
  roseK: number;
  roseScale: number;
}

export interface SpiroParams {
  R: number;
  r: number;
  rBoost: number;
  d: number;
  dBoost: number;
  scale: number;
  scaleBoost: number;
}

export interface LissajousParams {
  lissajousAmp: number;
  lissajousAmpBoost: number;
  lissajousAX: number;
  lissajousBY: number;
  lissajousPhase: number;
  lissajousYScale: number;
}

export interface LemniscateParams {
  lemniscateA: number;
  lemniscateBoost: number;
}

export interface ButterflyParams {
  butterflyTurns: number;
  butterflyScale: number;
  butterflyPulse: number;
  butterflyCosWeight: number;
  butterflyPower: number;
}

export interface CardioidParams {
  cardioidA: number;
  cardioidPulse: number;
  cardioidScale: number;
}

export interface HeartWaveParams {
  heartWaveB: number;
  heartWaveRoot: number;
  heartWaveAmp: number;
  heartWaveScaleX: number;
  heartWaveScaleY: number;
}

export interface SearchParams {
  searchTurns: number;
  searchBaseRadius: number;
  searchRadiusAmp: number;
  searchPulse: number;
  searchScale: number;
}

export interface FourierParams {
  fourierX1: number;
  fourierX3: number;
  fourierX5: number;
  fourierY1: number;
  fourierY2: number;
  fourierY4: number;
  fourierMixBase: number;
  fourierMixPulse: number;
}
