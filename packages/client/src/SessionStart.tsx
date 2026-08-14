import { QUESTION_BANK } from '@starling/bank';
import { behavioralTreesForPicker, formatProfileSummary, type InterviewProfile } from './profiles';
import styles from './SessionStart.module.css';
import type { ReviewStance } from './sessionPhases';
import type { ProfileOption } from './useUnifiedSession';

const CTA = styles.start__cta;
const LABEL_BODY = styles['start__label-body'];
const PROFILE_NAME = styles['start__profile-name'];
const PROFILE_META = styles['start__profile-meta'];
const STANCE_ROW = styles['start__stance-row'];
const STANCE_BTN = styles['start__stance-btn'];
const STANCE_BTN_ACTIVE = `${STANCE_BTN} ${styles['start__stance-btn--active']}`;
const LABEL_DISABLED = `${styles.start__label} ${styles['start__label--disabled']}`;

export function SessionStart({
  profileOptions,
  profileId,
  onProfileId,
  stance,
  onStance,
  pickedTreeId,
  onPickedTreeId,
  selectedProfile,
  onStart,
  error,
}: {
  profileOptions: ProfileOption[];
  profileId: string;
  onProfileId: (id: string) => void;
  stance: ReviewStance;
  onStance: (stance: ReviewStance) => void;
  pickedTreeId: string | 'random';
  onPickedTreeId: (id: string | 'random') => void;
  selectedProfile: InterviewProfile;
  onStart: () => void;
  error: string | null;
}) {
  const selected = profileOptions.find((option) => option.profile.id === profileId);
  const canStart = selected?.fillable === true;
  const showTreePicker = selectedProfile.treePick === 'userOptional';
  const drillTrees = behavioralTreesForPicker(QUESTION_BANK);

  return (
    <section className={styles.start}>
      <h1 className={styles.start__title}>Choose a session</h1>

      <fieldset className={styles.start__profiles}>
        <legend className={styles.start__legend}>Profile</legend>
        <ul className={styles.start__list}>
          {profileOptions.map(({ profile, fillable, reason }) => {
            const inputId = `profile-${profile.id}`;
            return (
              <li key={profile.id} className={styles.start__row}>
                <label
                  className={fillable ? styles.start__label : LABEL_DISABLED}
                  htmlFor={inputId}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name="profile"
                    value={profile.id}
                    checked={profileId === profile.id}
                    disabled={!fillable}
                    onChange={() => onProfileId(profile.id)}
                  />
                  <span className={LABEL_BODY}>
                    <span className={PROFILE_NAME}>{profile.label}</span>
                    <span className={PROFILE_META}>
                      {formatProfileSummary(profile)}
                      {!fillable && reason ? ` — ${reason}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className={styles.start__stance}>
        <legend className={styles.start__legend}>How do you want to run it?</legend>
        <div className={STANCE_ROW}>
          <StanceButton
            active={stance === 'practice'}
            onClick={() => onStance('practice')}
            label="Practice"
          />
          <StanceButton
            active={stance === 'simulation'}
            onClick={() => onStance('simulation')}
            label="Simulation"
          />
        </div>
      </fieldset>

      {showTreePicker && (
        <label className={styles.start__tree}>
          <span className={styles.start__legend}>Tree</span>
          <select
            className={styles.start__select}
            value={pickedTreeId}
            onChange={(event) =>
              onPickedTreeId(event.target.value === 'random' ? 'random' : event.target.value)
            }
          >
            <option value="random">Random</option>
            {drillTrees.map((tree) => (
              <option key={tree.id} value={tree.id}>
                {tree.main.text.length > 72 ? `${tree.main.text.slice(0, 72)}…` : tree.main.text}
              </option>
            ))}
          </select>
        </label>
      )}

      <button type="button" className={CTA} onClick={onStart} disabled={!canStart}>
        Start session
      </button>

      {error && (
        <p className={styles.start__error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function StanceButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={active ? STANCE_BTN_ACTIVE : STANCE_BTN}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
