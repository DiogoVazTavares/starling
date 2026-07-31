import { useEffect, useState } from 'react';

/** PROTOTYPE-ONLY — floating variant switcher, per the `/prototype` skill's UI convention. */

export interface VariantOption {
  key: string;
  name: string;
}

const VARIANT_CHANGE_EVENT = 'prototype-variant-change';

function readVariant(fallback: string): string {
  return new URLSearchParams(window.location.search).get('variant') ?? fallback;
}

export function useVariantParam(options: VariantOption[]): [string, (key: string) => void] {
  const [current, setCurrent] = useState(() => readVariant(options[0].key));

  useEffect(() => {
    function sync() {
      setCurrent(readVariant(options[0].key));
    }
    window.addEventListener(VARIANT_CHANGE_EVENT, sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(VARIANT_CHANGE_EVENT, sync);
      window.removeEventListener('popstate', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setVariant(key: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', key);
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new Event(VARIANT_CHANGE_EVENT));
  }

  return [current, setVariant];
}

export function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: {
  variants: VariantOption[];
  current: string;
  onChange: (key: string) => void;
}) {
  const index = variants.findIndex((option) => option.key === current);
  const active = variants[index] ?? variants[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function cycle(delta: number) {
    const nextIndex = (index + delta + variants.length) % variants.length;
    onChange(variants[nextIndex].key);
  }

  return (
    <div className="prototype-switcher" role="toolbar" aria-label="Prototype variant switcher">
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous variant">
        ←
      </button>
      <span>
        {active.key} — {active.name}
      </span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">
        →
      </button>
    </div>
  );
}
