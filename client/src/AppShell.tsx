import { useRef, useState } from 'react';
import App from './App';
import styles from './AppShell.module.css';
import { SeniorityMode } from './seniority/SeniorityMode';

// A BEM modifier never stands alone, so the active tab carries its element class too.
const TAB = styles.shell__tab;
const TAB_ACTIVE = `${styles.shell__tab} ${styles['shell__tab--active']}`;

type Mode = 'behavioral' | 'seniority';

/**
 * Two-tab shell (ticket 017 §1). Default tab is Behavioral — the proven zero-setup mode; the
 * seniority screen is a committed ~25-min session you opt into. Switching away from a *live*
 * seniority interview warns first (a live session would be lost); switching is free otherwise.
 */
export function AppShell() {
  const [mode, setMode] = useState<Mode>('behavioral');
  const seniorityLive = useRef(false);

  function switchTo(target: Mode) {
    if (target === mode) return;
    if (mode === 'seniority' && seniorityLive.current) {
      const leave = window.confirm(
        "Leave the interview? Your session will end and you won't get a report.",
      );
      if (!leave) return;
    }
    setMode(target);
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.shell__tabs}>
        <button
          type="button"
          className={mode === 'behavioral' ? TAB_ACTIVE : TAB}
          onClick={() => switchTo('behavioral')}
        >
          Behavioral
        </button>
        <button
          type="button"
          className={mode === 'seniority' ? TAB_ACTIVE : TAB}
          onClick={() => switchTo('seniority')}
        >
          Seniority screen
        </button>
      </nav>

      {mode === 'behavioral' ? (
        <App />
      ) : (
        <SeniorityMode
          onLiveChange={(live) => {
            seniorityLive.current = live;
          }}
        />
      )}
    </div>
  );
}
