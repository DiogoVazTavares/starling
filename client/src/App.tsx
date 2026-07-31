import { usePracticeSession } from './practice-variants/usePracticeSession';
import { PrototypeSwitcher, useVariantParam } from './practice-variants/PrototypeSwitcher';
import { VariantWizard } from './practice-variants/VariantWizard';
import { VariantTimeline } from './practice-variants/VariantTimeline';
import { VariantSplit } from './practice-variants/VariantSplit';
import './App.css';
import './practice-variants/variants.css';

/**
 * PROTOTYPE (wayfinder ticket 005) — three structurally different takes on the practice
 * screen, switchable via `?variant=`. See wayfinder/tickets/005-prototype-practice-ux.md.
 * Once a direction is picked, fold the winner back into a single App.tsx and delete the rest.
 */
const VARIANTS = [
  { key: 'A', name: 'Guided steps' },
  { key: 'B', name: 'Session log' },
  { key: 'C', name: 'Cockpit' },
];

export default function App() {
  const session = usePracticeSession();
  const [variant, setVariant] = useVariantParam(VARIANTS);

  return (
    <>
      {variant === 'A' && <VariantWizard session={session} />}
      {variant === 'B' && <VariantTimeline session={session} />}
      {variant === 'C' && <VariantSplit session={session} />}
      {import.meta.env.DEV && (
        <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
      )}
    </>
  );
}
