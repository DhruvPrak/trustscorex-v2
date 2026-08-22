// Every logged suspicious event costs a flat, fixed number of points —
// no per-type weighting, no diminishing-returns curve. Simple and
// predictable: score = 100 - (15 * number of violations), floored at 0.
const SUSPICIOUS_EVENT_PENALTY = 15;

// Once trustScore drops to this value or below, the session is terminated:
// the exam page kicks the student back to the home screen and the server
// refuses further exam events / logins for that student until an admin
// clears it.
const TERMINATION_THRESHOLD = 15;

// Lifecycle/audit event types that are logged for the timestamped record
// but don't themselves cost points (the termination itself, a login, etc).
const ZERO_COST_EVENT_TYPES = new Set(["session_terminated", "student_login"]);

// Kept for display/reference only (e.g. admin event log tooltips) — not
// used to compute the score anymore, since every violation costs the same
// flat amount.
function severityFor(type) {
  return ZERO_COST_EVENT_TYPES.has(type) ? 0 : SUSPICIOUS_EVENT_PENALTY;
}

// Recompute a student's score from scratch based on ALL logged events.
// Score starts at 100 and drops by a flat SUSPICIOUS_EVENT_PENALTY for
// every counted violation.
//
// `leniency` softens the penalty for accommodated students (e.g. those
// flagged as reduced-sensitivity during onboarding). 1 = standard
// (-15/event), 0.7 = 30% gentler (-10.5/event, rounded at the end).
function computeScoreFromEvents(events, leniency = 1) {
  const countedEvents = events.filter((e) => !ZERO_COST_EVENT_TYPES.has(e.type));
  const totalPenalty = countedEvents.length * SUSPICIOUS_EVENT_PENALTY * leniency;
  const score = Math.max(0, Math.round(100 - totalPenalty));
  return score;
}

module.exports = {
  SUSPICIOUS_EVENT_PENALTY,
  TERMINATION_THRESHOLD,
  ZERO_COST_EVENT_TYPES,
  severityFor,
  computeScoreFromEvents,
};
