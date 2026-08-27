import type { CurveName } from './curves';

/**
 * Prose descriptions of each built-in curve, for docs and gallery UIs.
 *
 * Kept out of the main entry point on purpose: Metro does not tree-shake, so
 * importing these from the root would ship ~4KB of copy to every consumer.
 * Import them explicitly when you need them:
 *
 * ```ts
 * import { curveDescriptions } from '@animatereactnative/skia-loaders/descriptions';
 * ```
 */
export const curveDescriptions: Record<CurveName, { en: string; zh: string }> =
  {
    originalThinking: {
      en: 'The base circle carved by a sevenfold cosine term blooms into a rotating seven-petal ring.',
      zh: '基础圆周叠加了 7 倍频余弦项，轨迹会长成一个旋转中的七瓣花环。',
    },
    thinkingFive: {
      en: 'Replacing sevenfold with fivefold gives a cleaner five-petal rhythm.',
      zh: '把 7 倍频项换成 5 倍频后，呈现更简洁的五瓣节奏。',
    },
    thinkingNine: {
      en: 'Ninefold term packs more inner turns, feeling denser and more finely braided.',
      zh: '9 倍频项会把更多小回环压进同一圈轨道里，花环更密、更细。',
    },
    roseOrbit: {
      en: 'Radius expands and contracts with cos(7t), breathing into repeated petals.',
      zh: '半径随 cos(7t) 起伏，在圆周上反复鼓起花瓣，同时保持绕圈感。',
    },
    roseCurve: {
      en: 'r = a cos(5t) creates five evenly spaced lobes with a gentle breathing multiplier.',
      zh: '使用 r = a cos(5t) 得到五个均匀花瓣，呼吸倍率让每片花瓣轻微胀缩。',
    },
    roseTwo: {
      en: 'k=2 forms broad opposing petals; breathing makes the center pulse.',
      zh: 'k=2 生成宽阔的对称花瓣，呼吸倍率让中心脉动。',
    },
    roseThree: {
      en: 'k=3 resolves into three rotating petals; breathing keeps it fluid.',
      zh: 'k=3 落成三瓣旋转结构，内层呼吸感让它不只是静态图形。',
    },
    lissajousDrift: {
      en: 'Different sine frequencies on x/y make the path cross like an oscilloscope trace.',
      zh: 'x 和 y 使用不同频率的正弦后，路径反复交叉，呈现示波器编织感。',
    },
    lemniscateBloom: {
      en: '1 + sin²t pinches the center preserving two lobes — a breathing infinity sign.',
      zh: '分母里的 1 + sin²t 把中间收紧、两侧保留双环，像会呼吸的无限符号。',
    },
    hypotrochoidLoop: {
      en: 'Rolling-circle terms create nested turns like a machine-traced spirograph.',
      zh: '滚动圆项叠出嵌套回环和偏移卷曲，像机械画出来的紧凑内旋轮线。',
    },
    threePetalSpiral: {
      en: 'Three large looping petals breathing together like a compact spiral flower.',
      zh: '3 个大回环像原版一样统一呼吸，像一朵紧凑的三瓣螺旋花。',
    },
    fourPetalSpiral: {
      en: 'R=4 settles into four looping petals, rotating and breathing as one ring.',
      zh: 'R=4 时稳定成 4 个回环花瓣，一起旋转、一起呼吸。',
    },
    fivePetalSpiral: {
      en: 'Five petals give the spiral flower a denser, more ornate rhythm.',
      zh: '5 个花瓣让整朵螺旋花更密、更华丽。',
    },
    sixPetalSpiral: {
      en: 'Six petals, the whole ring breathing in one unified pulse.',
      zh: '滚动圆路径展开成六个花瓣，整组以统一节奏一起呼吸缩放。',
    },
    butterflyPhase: {
      en: 'Exponential and high-frequency cosine terms create an unmistakably fluttering butterfly.',
      zh: '指数项和高频余弦把两侧翅膀不均匀拉开，轨迹像蝴蝶拍动。',
    },
    cardioidGlow: {
      en: 'r = a(1 - cos t) collapses to zero one side — a soft pulsing heart wave.',
      zh: 'r = a(1 - cos t) 在一侧收成尖点、另一侧鼓起，像温和起伏的心形脉冲。',
    },
    cardioidHeart: {
      en: 'r = a(1 + cos t) rotated into a legible upright heart.',
      zh: 'r = a(1 + cos t) 旋转后变成更直观的竖向爱心。',
    },
    heartWave: {
      en: 'x^(2/3) supplies the heart outline, sin(bπx) fills it with adjustable ripples.',
      zh: 'x^(2/3) 给出爱心轮廓，sin(bπx) 把可调密度的波纹填进心形内部。',
    },
    spiralSearch: {
      en: 'Fast-growing angle with cosine-modulated radius creates a cleanly self-closing spiral.',
      zh: '快速增长角度配合余弦调制半径，形成向外展开又能平顺闭合的螺旋轨迹。',
    },
    fourierFlow: {
      en: 'Multiple sine and cosine components interfere — shape mutates like a living waveform.',
      zh: '多组正弦和余弦彼此干涉后，轮廓会持续变形，像有生命的信号波。',
    },
  };
