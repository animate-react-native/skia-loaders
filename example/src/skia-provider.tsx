// Web: CanvasKit is a WASM module that must finish loading before any Skia API
// is touched, so suspend until it's ready. Native has nothing to wait for —
// see skia-provider.native.tsx.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ReactNode } from 'react';
import { Suspense, use } from 'react';

let promise: Promise<unknown> | null = null;

function SkiaGate({ children }: { children: ReactNode }) {
  promise ??= LoadSkiaWeb();
  use(promise);
  return <>{children}</>;
}

export function SkiaProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SkiaGate>{children}</SkiaGate>
    </Suspense>
  );
}
