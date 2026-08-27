// Web: CanvasKit is a WASM module that must finish loading before any Skia API
// is touched, so suspend until it's ready. Native has nothing to wait for —
// see skia-provider.native.tsx.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ReactNode } from 'react';
import { Suspense, use } from 'react';

let promise: Promise<unknown> | null = null;

function SkiaGate({ children }: { children: ReactNode }) {
  // CanvasKit resolves canvaskit.wasm relative to its own script URL. In this
  // monorepo Metro's server root is the repo root, so the bundle is served from
  // /example/ and that guess becomes /example/canvaskit.wasm — which the dev
  // server answers with index.html, and the WASM parse fails on `<!DO...`.
  // The file is served from example/public at the server root, so say so.
  promise ??= LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
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
