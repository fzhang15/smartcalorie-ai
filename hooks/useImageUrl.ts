import { useState, useEffect } from 'react';
import { resolveImageUrl, isIdbRef } from '../services/imageStore';

/**
 * React hook that resolves a MealLog imageUrl (which may be "idb:<id>")
 * into a displayable blob URL or data URL.
 * 
 * - For "idb:<id>" refs: loads from IndexedDB asynchronously, returns blob URL
 * - For "data:..." URLs: returns them directly (legacy/unmigrated)
 * - For undefined/null: returns null
 * 
 * Automatically revokes blob URLs on unmount to prevent memory leaks.
 */
export function useImageUrl(imageUrl: string | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => {
    // Synchronous fast path: if it's a data URL or undefined, resolve immediately
    if (!imageUrl) return null;
    if (!isIdbRef(imageUrl)) return imageUrl;
    return null; // Will be loaded async
  });

  useEffect(() => {
    if (!imageUrl) {
      setResolved(null);
      return;
    }

    // Data URLs don't need async resolution
    if (!isIdbRef(imageUrl)) {
      setResolved(imageUrl);
      return;
    }

    let revoked = false;
    let blobUrl: string | null = null;

    resolveImageUrl(imageUrl).then(url => {
      if (!revoked) {
        blobUrl = url;
        setResolved(url);
      } else if (url && url.startsWith('blob:')) {
        // Component unmounted before we resolved — clean up
        URL.revokeObjectURL(url);
      }
    });

    return () => {
      revoked = true;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageUrl]);

  return resolved;
}
