import { ConversationScreen } from './ConversationScreen';
import { ReportScreen } from './ReportScreen';
import { StartScreen } from './StartScreen';
import { useInterviewSession } from './useInterviewSession';

/**
 * Orchestrates the seniority mode's three screens (ticket 017): start -> live conversation ->
 * report. A live session exposes `isLive` up to the shell so it can warn before a tab switch.
 */
export function SeniorityMode({ onLiveChange }: { onLiveChange?: (live: boolean) => void }) {
  const session = useInterviewSession();
  const isLive = session.phase === 'connecting' || session.phase === 'interviewing';
  onLiveChange?.(isLive);

  if (session.phase === 'idle') {
    return <StartScreen onStart={session.start} />;
  }

  if (session.phase === 'report' && session.report) {
    return <ReportScreen report={session.report} onNewInterview={session.reset} />;
  }

  return (
    <ConversationScreen
      phase={session.phase}
      prompt={session.currentPrompt}
      error={session.error}
      onAnswer={() => session.submitAnswer()}
      onRetry={session.reset}
    />
  );
}
