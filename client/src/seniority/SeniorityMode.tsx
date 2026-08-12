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
  // Warn before a tab switch for every phase that still lives on the conversation screen (017 §1):
  // the live turns AND `generating`, where the report call is in flight and leaving would lose it.
  const isLive =
    session.phase === 'connecting' ||
    session.phase === 'interviewing' ||
    session.phase === 'generating';
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
