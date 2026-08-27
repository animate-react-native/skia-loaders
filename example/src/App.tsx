import {
  CurveLoader,
  curveNames,
  curves,
  type CurveName,
} from '@animatereactnative/skia-loaders';
import { curveDescriptions } from '@animatereactnative/skia-loaders/descriptions';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SkiaProvider } from './skia-provider';

const COLOR = '#bada55';

// Deterministic low-discrepancy spread (golden ratio) so the loaders don't
// animate in lockstep, and stay stable across reloads.
const PHI_INV = 0.6180339887498949;
const phaseOffsets = curveNames.map((_, i) => (i * PHI_INV) % 1);

function GalleryCardImpl({
  name,
  index,
  size,
  phaseOffset,
  paused,
  onSelect,
}: {
  name: CurveName;
  index: number;
  size: number;
  phaseOffset: number;
  paused: boolean;
  onSelect: (index: number) => void;
}) {
  const cfg = curves[name];
  const onPress = useCallback(() => onSelect(index), [onSelect, index]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardFrame}>
        <CurveLoader
          curve={name}
          size={size}
          phaseOffset={phaseOffset}
          color={COLOR}
          paused={paused}
        />
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {cfg.name}
        </Text>
        <Text style={styles.cardTag} numberOfLines={1}>
          {cfg.tag}
        </Text>
      </View>
    </Pressable>
  );
}

const GalleryCard = memo(GalleryCardImpl);

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ViewerModal({
  name,
  phaseOffset,
  size,
  width,
  maxHeight,
  onClose,
}: {
  name: CurveName | null;
  phaseOffset: number;
  size: number;
  width: number;
  maxHeight: number;
  onClose: () => void;
}) {
  const cfg = name ? curves[name] : null;
  return (
    <Modal
      visible={!!name}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.viewerContainer, { width, maxHeight }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            contentContainerStyle={styles.viewerScroll}
            showsVerticalScrollIndicator={false}
          >
            {name && cfg && (
              <>
                <View
                  style={[
                    styles.viewerCanvasWrap,
                    { width: size, height: size },
                  ]}
                >
                  <CurveLoader
                    curve={name}
                    size={size}
                    particleScale={1.35}
                    phaseOffset={phaseOffset}
                    color={COLOR}
                  />
                </View>
                <Text style={styles.viewerTitle}>{cfg.name}</Text>
                <Text style={styles.viewerTagText}>{cfg.tag}</Text>
                <Text style={styles.viewerDesc}>
                  {curveDescriptions[name].en}
                </Text>
                <View style={styles.statsRow}>
                  <StatBadge
                    label="Particles"
                    value={String(cfg.particleCount)}
                  />
                  <StatBadge
                    label="Loop"
                    value={`${(cfg.durationMs / 1000).toFixed(1)}s`}
                  />
                  <StatBadge
                    label="Stroke"
                    value={cfg.strokeWidth.toFixed(1)}
                  />
                </View>
              </>
            )}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Gallery() {
  const { width, height } = useWindowDimensions();
  const cardSize = Math.floor((width - 48) / 2) - 2;
  const viewerSize = Math.min(width - 48, 340);

  const [active, setActive] = useState<{
    name: CurveName;
    phase: number;
  } | null>(null);

  const onSelect = useCallback((index: number) => {
    setActive({ name: curveNames[index]!, phase: phaseOffsets[index]! });
  }, []);
  const onClose = useCallback(() => setActive(null), []);

  // Cards freeze while the viewer covers them. Cards scrolled far outside the
  // window are unmounted by FlatList, which disposes their frame callbacks.
  const paused = active !== null;

  const renderItem = useCallback(
    ({ item, index }: { item: CurveName; index: number }) => (
      <GalleryCard
        name={item}
        index={index}
        size={cardSize}
        phaseOffset={phaseOffsets[index]!}
        paused={paused}
        onSelect={onSelect}
      />
    ),
    [cardSize, paused, onSelect]
  );

  const viewerWidth = useMemo(() => Math.min(width - 32, 400), [width]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.header}>
        <Text style={styles.heroEyebrow}>Mathematical Curve Motion</Text>
        <Text style={styles.heroTitle}>
          A Gallery of Mathematical Loading Animations
        </Text>
      </View>
      <FlatList
        data={curveNames}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        updateCellsBatchingPeriod={100}
      />
      <ViewerModal
        name={active?.name ?? null}
        phaseOffset={active?.phase ?? 0}
        size={viewerSize}
        width={viewerWidth}
        maxHeight={height - 80}
        onClose={onClose}
      />
    </View>
  );
}

export default function App() {
  return (
    <SkiaProvider>
      <Gallery />
    </SkiaProvider>
  );
}

const C = {
  bg: '#060608',
  surface: '#0e0e12',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#f0eee8',
  textSecondary: 'rgba(240,238,232,0.48)',
  textMuted: 'rgba(240,238,232,0.28)',
  accent: 'rgba(200,180,255,0.9)',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: C.textMuted,
    marginBottom: 6,
    fontFamily: 'Courier New',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  grid: { padding: 12, paddingBottom: 40 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.7 },
  cardFrame: {
    aspectRatio: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { padding: 10, paddingTop: 8 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 2,
  },
  cardTag: {
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 0.5,
    fontFamily: 'Courier New',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  viewerScroll: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  viewerCanvasWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.bg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  viewerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  viewerTagText: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: C.accent,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Courier New',
  },
  viewerDesc: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 72,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    fontFamily: 'Courier New',
  },
  statLabel: {
    fontSize: 9,
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
});
