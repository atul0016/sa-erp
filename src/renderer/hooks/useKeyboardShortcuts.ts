/**
 * SA ERP - Keyboard Shortcuts Hook
 */

import { useEffect, useRef } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

/**
 * Register keyboard shortcuts. Key format: "ctrl+k", "ctrl+shift+n", "f2", "escape"
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input/textarea/select fields unless it's Escape
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      
      const combo = parts.join('+');

      const handler = shortcutsRef.current[combo];
      if (handler) {
        if (isInput && combo !== 'escape') return;
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/**
 * Common keyboard shortcut descriptions for help overlay
 */
export const SHORTCUT_MAP = {
  'ctrl+k': 'Global Search',
  'ctrl+n': 'New Record',
  'ctrl+s': 'Save',
  'ctrl+p': 'Print',
  'ctrl+e': 'Export',
  'escape': 'Close / Cancel',
  'f2': 'Edit Selected',
  'f5': 'Refresh',
  '?': 'Show Shortcuts',
};
