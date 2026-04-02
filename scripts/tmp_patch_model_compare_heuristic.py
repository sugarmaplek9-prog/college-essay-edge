from pathlib import Path

path = Path('src/lib/ml/evidenceStrength/model.ts')
text = path.read_text()

text_new = text.replace(
"""  const recoverableCompareChoice =
    viability === 'needs_more_input'
    && f.helpSeekingQuestion === 1
    && f.topicOptionCount >= 2
    && f.tooThinToRecoverSignal === 0
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !escalationBlocking;
""",
"""  const recoverableCompareChoice =
    viability === 'needs_more_input'
    && f.topicOptionCount >= 2
    && f.scopeUncertainSignal === 1
    && f.tooThinToRecoverSignal === 0
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !escalationBlocking;
"""
)

text_new = text_new.replace(
"""  const recoverableCompareChoiceForDirection =
    f.helpSeekingQuestion === 1
    && f.topicOptionCount >= 2
    && f.tooThinToRecoverSignal === 0
    && intelligence.recommendation_viability.decision !== 'blocked'
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !intelligence.escalation.blocking;
""",
"""  const recoverableCompareChoiceForDirection =
    f.topicOptionCount >= 2
    && f.scopeUncertainSignal === 1
    && f.tooThinToRecoverSignal === 0
    && intelligence.recommendation_viability.decision !== 'blocked'
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !intelligence.escalation.blocking;
"""
)

if text_new == text:
    raise SystemExit('no replacements made')

path.write_text(text_new)
print('patched model compare heuristic')
