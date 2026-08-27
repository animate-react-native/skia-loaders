import type {
  ButterflyParams,
  CardioidParams,
  CurveBase,
  FourierParams,
  HeartWaveParams,
  LemniscateParams,
  LissajousParams,
  Point,
  RoseOrbitParams,
  RoseParams,
  RoseTrailParams,
  SearchParams,
  SpiroParams,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Curve math. Every `point` function is a UI-thread worklet: it maps a
// normalized progress [0,1] plus a breathing factor `ds` onto a [0,100]² box.
// One function per family, shared by every curve that belongs to it.
// ─────────────────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;

/** Lower bound of `getDetailScale`. */
export const DS_MIN = 0.52;
/** Span of `getDetailScale` above `DS_MIN`. */
export const DS_RANGE = 0.48;

export function normalizeProgress(p: number): number {
  'worklet';
  return ((p % 1) + 1) % 1;
}

/** The slow "breathing" factor that swells and shrinks the shape. */
export function getDetailScale(
  time: number,
  cfg: CurveBase,
  phaseOffset: number
): number {
  'worklet';
  const pp =
    ((time + phaseOffset * cfg.pulseDurationMs) % cfg.pulseDurationMs) /
    cfg.pulseDurationMs;
  return DS_MIN + ((Math.sin(pp * TAU + 0.55) + 1) / 2) * DS_RANGE;
}

/** Rotation of the whole shape, in degrees. Zero when `cfg.rotate` is false. */
export function getRotationDeg(
  time: number,
  cfg: CurveBase,
  phaseOffset: number
): number {
  'worklet';
  if (!cfg.rotate) return 0;
  return (
    -(
      ((time + phaseOffset * cfg.rotationDurationMs) % cfg.rotationDurationMs) /
      cfg.rotationDurationMs
    ) * 360
  );
}

// ─── Curve families ──────────────────────────────────────────────────────────

/** Circle with a k-fold cosine carved out of it — a rotating petal ring. */
export function roseTrailPoint(
  p: number,
  ds: number,
  c: RoseTrailParams
): Point {
  'worklet';
  const t = p * TAU;
  const k = c.petalCount;
  const m = c.detailAmplitude * ds;
  return {
    x: 50 + (c.baseRadius * Math.cos(t) - m * Math.cos(k * t)) * c.curveScale,
    y: 50 + (c.baseRadius * Math.sin(t) - m * Math.sin(k * t)) * c.curveScale,
  };
}

/** Orbit whose radius ripples with cos(kθ). */
export function roseOrbitPoint(
  p: number,
  ds: number,
  c: RoseOrbitParams
): Point {
  'worklet';
  const t = p * TAU;
  const r =
    (c.orbitRadius - c.detailAmplitude * ds * Math.cos(c.petalCount * t)) *
    c.curveScale;
  return { x: 50 + Math.cos(t) * r, y: 50 + Math.sin(t) * r };
}

/** Classic rose, r = a·cos(kθ), with a breathing amplitude. */
export function rosePoint(p: number, ds: number, c: RoseParams): Point {
  'worklet';
  const t = p * TAU;
  const a = c.roseA + ds * c.roseABoost;
  const r =
    a *
    (c.roseBreathBase + ds * c.roseBreathBoost) *
    Math.cos(c.roseK * t) *
    c.roseScale;
  return { x: 50 + Math.cos(t) * r, y: 50 + Math.sin(t) * r };
}

/** Hypotrochoid — a rolling circle traced by an offset pen. */
export function spiroPoint(p: number, ds: number, c: SpiroParams): Point {
  'worklet';
  const t = p * TAU;
  const r = c.r + ds * c.rBoost;
  const d = c.d + ds * c.dBoost;
  const s = c.scale + ds * c.scaleBoost;
  const rolled = c.R - r;
  const k = rolled / r;
  return {
    x: 50 + (rolled * Math.cos(t) + d * Math.cos(k * t)) * s,
    y: 50 + (rolled * Math.sin(t) - d * Math.sin(k * t)) * s,
  };
}

/** Different sine frequencies on x and y — an oscilloscope trace. */
export function lissajousPoint(
  p: number,
  ds: number,
  c: LissajousParams
): Point {
  'worklet';
  const t = p * TAU;
  const amp = c.lissajousAmp + ds * c.lissajousAmpBoost;
  return {
    x: 50 + Math.sin(c.lissajousAX * t + c.lissajousPhase) * amp,
    y: 50 + Math.sin(c.lissajousBY * t) * amp * c.lissajousYScale,
  };
}

/** Bernoulli lemniscate — a breathing infinity sign. */
export function lemniscatePoint(
  p: number,
  ds: number,
  c: LemniscateParams
): Point {
  'worklet';
  const t = p * TAU;
  const s = c.lemniscateA + ds * c.lemniscateBoost;
  const sin = Math.sin(t);
  const cos = Math.cos(t);
  const d = 1 + sin * sin;
  return { x: 50 + (s * cos) / d, y: 50 + (s * sin * cos) / d };
}

/** Exponential and high-frequency cosine terms — a fluttering butterfly. */
export function butterflyPoint(
  p: number,
  ds: number,
  c: ButterflyParams
): Point {
  'worklet';
  const t = p * Math.PI * c.butterflyTurns;
  const s =
    Math.exp(Math.cos(t)) -
    c.butterflyCosWeight * Math.cos(4 * t) -
    Math.sin(t / 12) ** c.butterflyPower;
  const scale = c.butterflyScale + ds * c.butterflyPulse;
  return { x: 50 + Math.sin(t) * s * scale, y: 50 + Math.cos(t) * s * scale };
}

/** r = a(1 − cos t) — cusp on one side, lying sideways. */
export function cardioidPoint(p: number, ds: number, c: CardioidParams): Point {
  'worklet';
  const t = p * TAU;
  const r =
    (c.cardioidA + ds * c.cardioidPulse) * (1 - Math.cos(t)) * c.cardioidScale;
  return { x: 50 + Math.cos(t) * r, y: 50 + Math.sin(t) * r };
}

/** r = a(1 + cos t), rotated into an upright heart. */
export function heartPoint(p: number, ds: number, c: CardioidParams): Point {
  'worklet';
  const t = p * TAU;
  const r =
    (c.cardioidA + ds * c.cardioidPulse) * (1 + Math.cos(t)) * c.cardioidScale;
  return { x: 50 - Math.sin(t) * r, y: 50 - Math.cos(t) * r };
}

/** x^(2/3) heart outline filled with sin(bπx) ripples. */
export function heartWavePoint(
  p: number,
  ds: number,
  c: HeartWaveParams
): Point {
  'worklet';
  const xLimit = Math.sqrt(c.heartWaveRoot);
  const x = -xLimit + p * xLimit * 2;
  const wave =
    c.heartWaveAmp *
    Math.sqrt(Math.max(0, c.heartWaveRoot - x * x)) *
    Math.sin(c.heartWaveB * Math.PI * x);
  return {
    x: 50 + x * c.heartWaveScaleX,
    y:
      18 +
      (1.75 - Math.pow(Math.abs(x), 2 / 3) - wave) *
        (c.heartWaveScaleY + ds * 1.5),
  };
}

/** Archimedean spiral with a cosine-modulated radius. */
export function searchPoint(p: number, ds: number, c: SearchParams): Point {
  'worklet';
  const t = p * TAU;
  const angle = t * c.searchTurns;
  const radius =
    (c.searchBaseRadius +
      (1 - Math.cos(t)) * (c.searchRadiusAmp + ds * c.searchPulse)) *
    c.searchScale;
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

/** Several interfering sine and cosine components — a living waveform. */
export function fourierPoint(p: number, ds: number, c: FourierParams): Point {
  'worklet';
  const t = p * TAU;
  const mix = c.fourierMixBase + ds * c.fourierMixPulse;
  return {
    x:
      50 +
      c.fourierX1 * Math.cos(t) +
      c.fourierX3 * Math.cos(3 * t + 0.6 * mix) +
      c.fourierX5 * Math.sin(5 * t - 0.4),
    y:
      50 +
      c.fourierY1 * Math.sin(t) +
      c.fourierY2 * Math.sin(2 * t + 0.25) -
      c.fourierY4 * Math.cos(4 * t - 0.5 * mix),
  };
}
