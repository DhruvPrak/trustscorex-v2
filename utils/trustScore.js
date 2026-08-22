// Weighted severity per suspicious event type.
// Tunable - this is the "AI monitoring rules engine" for the demo.
const SEVERITY = {
  tab_switch: 5,
  window_blur: 3,
  copy_attempt: 8,
  paste_attempt: 8,
  right_click: 2,
  no_face_detected: 6,
  multiple_faces_detected: 12,
  devtools_opened: 15,
};

function severityFor(type) {
  return SEVERITY[type] ?? 5;
}

// Recompute a student's score from scratch based on ALL logged events.
// Score starts at 100 and decays with diminishing returns so one bad
// exam doesn't zero a student out permanently (uses sqrt scaling).
function computeScoreFromEvents(events) {
  const totalPenalty = events.reduce((sum, e) => sum + e.severity, 0);
  const dampened = Math.sqrt(totalPenalty) * 4; // diminishing returns curve
  const score = Math.max(0, Math.round(100 - dampened));
  return score;
}

module.exports = { SEVERITY, severityFor, computeScoreFromEvents };
