import {
  Atlas,
  Canvas,
  Group,
  Path,
  Skia,
  useRSXformBuffer,
  type SkImage,
  type SkPath,
  type SkPoint,
  type SkRect,
  type Transforms3d,
} from '@shopify/react-native-skia';
import React, { memo, useEffect, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { curveNames, curves, type CurveName } from './curves';
import {
  DS_MIN,
  DS_RANGE,
  getDetailScale,
  getRotationDeg,
  normalizeProgress,
} from './math';
import type { AnyCurveConfig } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Sprite sheet — circles baked at increasing opacity levels so <Atlas>
// needs no per-sprite colors and no blendMode (zero per-frame allocations).
// One sheet is created per unique color string and cached for reuse.
//
// The circle is inset from its cell so that minifying the atlas with linear
// filtering cannot bleed a neighbouring (different-alpha) sprite into it.
// ─────────────────────────────────────────────────────────────────────────────

const SPRITE_SIZE = 32;
const SPRITE_HALF = SPRITE_SIZE / 2;
const SPRITE_RADIUS = 14; // 2px padding on each side of the cell
const OPACITY_LEVELS = 20;
const SHEET_W = SPRITE_SIZE * OPACITY_LEVELS;

// Sheets are intentionally never released: the palette is small and fixed, and
// an SkImage kept alive is far cheaper than re-rasterizing one per mount.
const spriteSheetCache = new Map<string, SkImage | null>();

function getSpriteSheet(color: string): SkImage | null {
  const cached = spriteSheetCache.get(color);
  if (cached !== undefined) return cached;
  const surf = Skia.Surface.Make(SHEET_W, SPRITE_SIZE);
  if (!surf) {
    spriteSheetCache.set(color, null);
    return null;
  }
  const canvas = surf.getCanvas();
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  for (let i = 0; i < OPACITY_LEVELS; i++) {
    paint.setAlphaf((i + 1) / OPACITY_LEVELS);
    canvas.drawCircle(
      i * SPRITE_SIZE + SPRITE_HALF,
      SPRITE_HALF,
      SPRITE_RADIUS,
      paint
    );
  }
  surf.flush();
  const sheet = surf.makeImageSnapshot();
  spriteSheetCache.set(color, sheet);
  return sheet;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ghost path — the faint full-curve outline behind the particles.
//
// Its geometry depends only on the slow breathing factor `ds`, so instead of
// rebuilding it every frame we bake one path per quantized `ds` bucket at mount
// and just pick one on the UI thread. 16 buckets is ~0.03 of `ds`, i.e. well
// under a pixel of drift on an 8%-alpha stroke.
// ─────────────────────────────────────────────────────────────────────────────

const GHOST_BUCKETS = 16;
const MIN_GHOST_STEPS = 96;
const MAX_GHOST_STEPS = 360;

// `strokeWidth` on a curve is authored in pixels at this canvas size, and
// scaled from here so the ghost keeps a constant weight *relative to the
// curve* at every size.
const STROKE_REFERENCE_SIZE = 340;

/** Alpha of the ghost outline. */
const GHOST_ALPHA = 0.08;

function buildGhostPaths(
  cfg: AnyCurveConfig,
  coordScale: number,
  size: number
): SkPath[] {
  const steps = Math.max(
    MIN_GHOST_STEPS,
    Math.min(MAX_GHOST_STEPS, Math.round(size))
  );
  const paths: SkPath[] = [];
  for (let b = 0; b < GHOST_BUCKETS; b++) {
    const ds = DS_MIN + ((b + 0.5) / GHOST_BUCKETS) * DS_RANGE;
    const path = Skia.Path.Make();
    for (let i = 0; i <= steps; i++) {
      const { x, y } = cfg.point(i / steps, ds, cfg.params);
      if (i === 0) path.moveTo(x * coordScale, y * coordScale);
      else path.lineTo(x * coordScale, y * coordScale);
    }
    paths.push(path);
  }
  return paths;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-particle constants. Trail position, size and opacity depend only on the
// particle's index, so they are computed once instead of 60×/second.
// ─────────────────────────────────────────────────────────────────────────────

interface TrailTables {
  sprites: SkRect[];
  /** Atlas scale factor per particle. */
  scales: Float32Array;
  /** Pre-multiplied centering offset (`scale * SPRITE_HALF`) per particle. */
  offsets: Float32Array;
  /** How far behind the head each particle sits, in progress units. */
  tails: Float32Array;
}

function buildTrailTables(
  cfg: AnyCurveConfig,
  coordScale: number,
  particleScale: number
): TrailTables {
  const n = cfg.particleCount;
  const denom = Math.max(1, n - 1);

  const sprites: SkRect[] = [];
  const scales = new Float32Array(n);
  const offsets = new Float32Array(n);
  const tails = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const tailOffset = i / denom;
    const fade = Math.pow(1 - tailOffset, 0.56);

    tails[i] = tailOffset * cfg.trailSpan;

    const radius = (0.9 + fade * 2.7) * coordScale * particleScale;
    const scale = radius / SPRITE_RADIUS;
    scales[i] = scale;
    offsets[i] = scale * SPRITE_HALF;

    const opacity = Math.min(1, 0.04 + fade * 0.96);
    const level = Math.min(
      OPACITY_LEVELS - 1,
      Math.round(opacity * (OPACITY_LEVELS - 1))
    );
    sprites.push(
      Skia.XYWHRect(level * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE)
    );
  }

  return { sprites, scales, offsets, tails };
}

function resolveCurve(curve: CurveName | AnyCurveConfig): AnyCurveConfig {
  if (typeof curve !== 'string') return curve;
  const cfg = curves[curve];
  if (!cfg) {
    throw new Error(
      `[skia-loaders] Unknown curve "${curve}". Available names: ${curveNames.join(', ')}`
    );
  }
  return cfg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

export interface CurveLoaderContentsProps {
  /**
   * A built-in curve name (e.g. `"roseOrbit"`) or your own curve config.
   *
   * Custom configs should be defined at module scope, not inline — a new
   * object identity on every render rebuilds the baked geometry.
   */
  curve: CurveName | AnyCurveConfig;
  /** Width and height of the square the loader draws into, in pixels. */
  size: number;
  /** Particle and outline color. Any Skia-parseable color string. */
  color?: string;
  /** Multiplies particle radius. Useful to bulk up the trail at large sizes. */
  particleScale?: number;
  /**
   * Shifts this loader along its own timeline (0–1). Give sibling loaders
   * different offsets so they don't animate in lockstep.
   */
  phaseOffset?: number;
  /** Freeze the animation. A paused loader schedules no frames at all. */
  paused?: boolean;
}

export interface CurveLoaderProps extends CurveLoaderContentsProps {
  /** Style for the underlying Skia `<Canvas>`. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Rotates its children around the canvas centre. Split out so that the
 * per-frame rotation mapper only exists for curves that actually rotate.
 */
function RotatingGroup({
  cfg,
  clock,
  phaseOffset,
  origin,
  children,
}: {
  cfg: AnyCurveConfig;
  clock: SharedValue<number>;
  phaseOffset: number;
  origin: SkPoint;
  children: React.ReactNode;
}) {
  const transform = useDerivedValue<Transforms3d>(() => {
    'worklet';
    return [
      {
        rotateZ:
          (getRotationDeg(clock.value, cfg, phaseOffset) * Math.PI) / 180,
      },
    ];
  });
  return (
    <Group origin={origin} transform={transform}>
      {children}
    </Group>
  );
}

/**
 * The loader's Skia nodes, without a `<Canvas>` of its own.
 *
 * Use this to compose a loader into an existing Skia scene — it draws into a
 * `size`×`size` box at the origin, so wrap it in a `<Group>` to position it:
 *
 * ```tsx
 * <Canvas style={{ flex: 1 }}>
 *   <Group transform={[{ translateX: 40 }, { translateY: 120 }]}>
 *     <CurveLoaderContents curve="roseOrbit" size={80} />
 *   </Group>
 * </Canvas>
 * ```
 */
function CurveLoaderContentsImpl({
  curve,
  size,
  color = '#ffffff',
  particleScale = 1,
  phaseOffset = 0,
  paused = false,
}: CurveLoaderContentsProps) {
  const cfg = resolveCurve(curve);
  const coordScale = size / 100;
  const n = cfg.particleCount;

  const spriteSheet = getSpriteSheet(color);
  const ghostColor = useMemo(() => {
    // Skia.Color yields [r, g, b, a]; keep the RGB and swap in our own alpha.
    const rgba = Float32Array.from(Skia.Color(color));
    rgba[3] = GHOST_ALPHA;
    return rgba;
  }, [color]);

  const ghostPaths = useMemo(
    () => buildGhostPaths(cfg, coordScale, size),
    [cfg, coordScale, size]
  );
  const { sprites, scales, offsets, tails } = useMemo(
    () => buildTrailTables(cfg, coordScale, particleScale),
    [cfg, coordScale, particleScale]
  );

  // ── Time. Accumulating deltas (rather than reading an absolute clock) means
  // pausing freezes the animation instead of restarting it on resume.
  const clock = useSharedValue(0);
  const progress = useSharedValue(0);
  const detail = useSharedValue(DS_MIN);

  const frameCallback = useFrameCallback((info) => {
    'worklet';
    const time = clock.value + (info.timeSincePreviousFrame ?? 0);
    clock.value = time;
    progress.value =
      ((time + phaseOffset * cfg.durationMs) % cfg.durationMs) / cfg.durationMs;
    detail.value = getDetailScale(time, cfg, phaseOffset);
  }, false);

  useEffect(() => {
    frameCallback.setActive(!paused);
  }, [frameCallback, paused]);

  // Runs once per particle per frame — keep it to the curve evaluation and the
  // transform write; everything else is precomputed above.
  const xforms = useRSXformBuffer(n, (xform, i) => {
    'worklet';
    const np = normalizeProgress(progress.value - tails[i]!);
    const { x, y } = cfg.point(np, detail.value, cfg.params);
    const offset = offsets[i]!;
    xform.set(scales[i]!, 0, x * coordScale - offset, y * coordScale - offset);
  });

  const ghostPath = useDerivedValue(() => {
    'worklet';
    const raw = Math.floor(
      ((detail.value - DS_MIN) / DS_RANGE) * GHOST_BUCKETS
    );
    const bucket = Math.min(GHOST_BUCKETS - 1, Math.max(0, raw));
    return ghostPaths[bucket]!;
  });

  const origin = useMemo(() => ({ x: size / 2, y: size / 2 }), [size]);

  const content = (
    <>
      <Path
        path={ghostPath}
        style="stroke"
        strokeWidth={(cfg.strokeWidth * size) / STROKE_REFERENCE_SIZE}
        strokeCap="round"
        strokeJoin="round"
        color={ghostColor}
        antiAlias
      />
      {spriteSheet && (
        <Atlas image={spriteSheet} sprites={sprites} transforms={xforms} />
      )}
    </>
  );

  if (!cfg.rotate) return content;

  return (
    <RotatingGroup
      cfg={cfg}
      clock={clock}
      phaseOffset={phaseOffset}
      origin={origin}
    >
      {content}
    </RotatingGroup>
  );
}

export const CurveLoaderContents = memo(CurveLoaderContentsImpl);
CurveLoaderContents.displayName = 'CurveLoaderContents';

/**
 * A self-contained mathematical curve loader.
 *
 * ```tsx
 * <CurveLoader curve="roseOrbit" size={120} color="#bada55" />
 * ```
 */
function CurveLoaderImpl({ size, style, ...rest }: CurveLoaderProps) {
  const canvasStyle = useMemo(
    () => [{ width: size, height: size }, style],
    [size, style]
  );
  return (
    <Canvas style={canvasStyle}>
      <CurveLoaderContents size={size} {...rest} />
    </Canvas>
  );
}

export const CurveLoader = memo(CurveLoaderImpl);
CurveLoader.displayName = 'CurveLoader';
