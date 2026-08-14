import { SessionRun } from './SessionRun';
import { SessionStart } from './SessionStart';
import styles from './StarlingApp.module.css';
import { useUnifiedSession } from './useUnifiedSession';

/**
 * Single-entry shell (ticket 020): brand wordmark only — no mode tabs.
 * Seniority Live stays in the tree but is not reachable from here.
 */
export function StarlingApp() {
  const session = useUnifiedSession();

  return (
    <div className={styles.app}>
      <header className={styles.app__brand}>
        <p className={styles.app__wordmark}>Starling</p>
      </header>

      {session.phase === 'start' ? (
        <SessionStart
          profileOptions={session.profileOptions}
          profileId={session.profileId}
          onProfileId={session.setProfileId}
          stance={session.stance}
          onStance={session.setStance}
          pickedTreeId={session.pickedTreeId}
          onPickedTreeId={session.setPickedTreeId}
          selectedProfile={session.selectedProfile}
          onStart={session.startSession}
          error={session.error}
        />
      ) : (
        <SessionRun session={session} />
      )}
    </div>
  );
}
