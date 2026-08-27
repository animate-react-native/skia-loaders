import type { ReactNode } from 'react';

// Native builds link Skia directly — nothing to wait for.
export function SkiaProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
