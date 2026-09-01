![@animatereactnative/skia-loaders](https://raw.githubusercontent.com/animate-react-native/skia-loaders/main/docs/banner.png)

<div align="center">
<h1>React Native Skia Loaders</h1>



https://github.com/user-attachments/assets/7aee7726-0f42-4619-be79-738562838739



[![NPM Version](https://img.shields.io/npm/v/@animatereactnative/skia-loaders.svg?style=flat&color=black)](https://www.npmjs.org/package/@animatereactnative/skia-loaders) [![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/) [![npm](https://img.shields.io/npm/l/@animatereactnative/skia-loaders?style=flat-square)](https://www.npmjs.com/package/@animatereactnative/skia-loaders) [![npm](https://img.shields.io/badge/types-included-blue?style=flat-square)](https://www.npmjs.com/package/@animatereactnative/skia-loaders) <a href="https://twitter.com/mironcatalin"><img src="https://img.shields.io/twitter/follow/mironcatalin?label=Follow @mironcatalin&color=black" alt="Follow Miron Catalin"></a>

</div>

Port of [math-curve-loaders](https://github.com/Paidax01/math-curve-loaders) to React Native using skia

20 mathematical curve loaders for React Native — roses, spirographs, lemniscates, butterflies, hearts — each tracing a parametric curve with a fading comet tail and a slow breathing pulse, powered by Skia and Reanimated:

- 🔋 Powered by Skia Atlas & Reanimated 4
- 📱 Works with Expo, including Expo Go
- ✅ Cross-platform (iOS, Android, Web)
- ⚡️ 60-120fps, animated entirely on the UI thread
- 🌀 20 built-in curves, or bring your own
- 🎨 Any color, any size, composable into your own Skia canvas
- ⌨️ Written in TypeScript

## Installation

```sh
npm install @animatereactnative/skia-loaders
```

> Also, you need to install [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/) and [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated), and follow their installation instructions. Both ship with Expo Go, so there is nothing else to configure there.

```sh
npx expo install @shopify/react-native-skia react-native-reanimated
```

## Usage

```js
import { CurveLoader } from '@animatereactnative/skia-loaders';

// ...

export function Example() {
  return <CurveLoader curve="roseOrbit" size={120} color="#bada55" />;
}
```

## Props

Both `CurveLoader` and `CurveLoaderContents` accept:

| name            | description                                                                            | required | type                        | default     |
| --------------- | -------------------------------------------------------------------------------------- | -------- | --------------------------- | ----------- |
| `curve`         | A built-in curve name, or your own curve config                                        | YES      | `CurveName \| CurveConfig`  |             |
| `size`          | Side of the square the loader draws into, in pixels                                    | YES      | `number`                    |             |
| `color`         | Particle and outline color. Any Skia-parseable color string                            | NO       | `string`                    | `'#ffffff'` |
| `particleScale` | Multiplies particle radius. Useful to bulk up the trail at large sizes                 | NO       | `number`                    | `1`         |
| `phaseOffset`   | Shifts this loader along its own timeline (`0…1`). Stagger siblings so they don't sync  | NO       | `number`                    | `0`         |
| `paused`        | Freezes the animation. A paused loader schedules no frames at all                      | NO       | `boolean`                   | `false`     |
| `style`         | View style applied to the underlying Skia `<Canvas>`. `CurveLoader` only               | NO       | `StyleProp<ViewStyle>`      |             |

## Curves

```js
import { CurveLoader, curveNames, curves } from '@animatereactnative/skia-loaders';

curveNames.map((name, i) => (
  <View key={name}>
    <CurveLoader curve={name} size={140} phaseOffset={i / curveNames.length} />
    <Text>{curves[name].name}</Text>
  </View>
));
```

|                    |                    |                    |                  |
| ------------------ | ------------------ | ------------------ | ---------------- |
| `originalThinking` | `thinkingFive`     | `thinkingNine`     | `roseOrbit`      |
| `roseCurve`        | `roseTwo`          | `roseThree`        | `lissajousDrift` |
| `lemniscateBloom`  | `hypotrochoidLoop` | `threePetalSpiral` | `fourPetalSpiral`|
| `fivePetalSpiral`  | `sixPetalSpiral`   | `butterflyPhase`   | `cardioidGlow`   |
| `cardioidHeart`    | `heartWave`        | `spiralSearch`     | `fourierFlow`    |

Every entry in `curves` carries a `name` and `tag` for labelling, plus its timings and particle count. Prose descriptions live behind a separate entry point so they don't ship with the library by default:

```js
import { curveDescriptions } from '@animatereactnative/skia-loaders/descriptions';

curveDescriptions.roseOrbit.en; // "Radius expands and contracts with cos(7t)…"
curveDescriptions.roseOrbit.zh; // "半径随 cos(7t) 起伏…"
```

## Composing into an existing canvas

`<CurveLoader />` mounts its own `<Canvas>`. If you already have one — a loader inside a larger Skia scene — use `<CurveLoaderContents />` and position it with a `<Group>`. One canvas holding many loaders is meaningfully cheaper than many canvases, so prefer this for grids.

```js
import { Canvas, Group } from '@shopify/react-native-skia';
import { CurveLoaderContents } from '@animatereactnative/skia-loaders';

// ...

<Canvas style={{ flex: 1 }}>
  <Group transform={[{ translateX: 40 }, { translateY: 120 }]}>
    <CurveLoaderContents curve="roseOrbit" size={80} />
  </Group>
</Canvas>;
```

## Custom curves

A curve is a `point` worklet mapping progress `0…1` onto a `[0,100]²` box, plus its parameters and timings. `detailScale` (`~0.52…1`) is the breathing factor.

```js
import type { CurveConfig } from '@animatereactnative/skia-loaders';

// Define at module scope — a new object identity each render rebuilds geometry.
const wobble: CurveConfig<{ lobes: number }> = {
  name: 'Wobble',
  tag: 'custom',
  particleCount: 70,
  trailSpan: 0.35,
  durationMs: 5000,
  rotationDurationMs: 24000,
  pulseDurationMs: 4200,
  strokeWidth: 4.5,
  rotate: true,
  params: { lobes: 6 },
  point(progress, detailScale, params) {
    'worklet';
    const t = progress * Math.PI * 2;
    const r = 30 + Math.cos(params.lobes * t) * 8 * detailScale;
    return { x: 50 + Math.cos(t) * r, y: 50 + Math.sin(t) * r };
  },
};

<CurveLoader curve={wobble} size={140} />;
```

The `point` function **must** carry the `'worklet'` directive — it runs on the UI thread. The built-in point functions (`rosePoint`, `spiroPoint`, `lissajousPoint`, …) are exported too, if you want to reuse one with your own parameters and timings.

## Performance

The loaders are built to run many at once:

- The faint outline is baked once per quantized breathing step at mount, so no path geometry is rebuilt per frame.
- Per-particle size, opacity and trail position are precomputed into typed arrays; the per-frame work per particle is one curve evaluation and one transform write.
- Particles draw through a single `<Atlas>` against a sprite sheet cached per color, so there are no per-frame allocations for color or blending.
- Rotation only costs anything for curves that actually rotate.
- `paused` fully detaches the frame callback, so an off-screen loader is free.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[MIT](./LICENSE)

---

<p align="center">
  <a href="https://www.animatereactnative.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://www.animatereactnative.com/animatereactnative_dark.svg">
      <img alt="AnimateReactNative.com - Premium and Custom React Native animations." src="https://www.animatereactnative.com/animatereactnative_logo.svg" height="34" align="middle">
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;<b>&times;</b>&nbsp;&nbsp;&nbsp;
  <a href="https://keyframer.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://keyframer.dev/logo-dark.png">
      <img alt="Keyframer.dev - design and ship React Native animations." src="https://keyframer.dev/logo-light.png" height="24" align="middle">
    </picture>
  </a>
</p>
