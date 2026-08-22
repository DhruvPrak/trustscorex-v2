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
  // Continuous per-second identity check (exam.html) catching the "handed
  // the camera to someone else mid-exam" scenario — highest weight since
  // this is the strongest single signal of impersonation.
  face_mismatch: 25,
  // Laplacian-variance blur/covered-lens check — kept low because a soft
  // or dim frame is often innocent (bad lighting, hand adjusting the
  // laptop), unlike a confirmed face mismatch or a second face.
  camera_blurred_or_covered: 4,
  // coco-ssd catching a phone/book/second device in frame.
  suspicious_object_detected: 10,
  devtools_opened: 15,
};

function severityFor(type) {
  return SEVERITY[type] ?? 5;
}

// Recompute a student's score from scratch based on ALL logged events.
// Score starts at 100 and decays with diminishing returns so one bad
// exam doesn't zero a student out permanently (uses sqrt scaling).
//
// `leniency` softens the decay curve for accommodated students (e.g. those
// flagged as reduced-sensitivity during onboarding). 1 = standard curve,
// 0.7 = 30% gentler penalty growth. Applied to the penalty sum before the
// sqrt dampening so the effect compounds naturally with the existing curve.
function computeScoreFromEvents(events, leniency = 1) {
  const totalPenalty = events.reduce((sum, e) => sum + e.severity, 0) * leniency;
  const dampened = Math.sqrt(totalPenalty) * 4; // diminishing returns curve
  const score = Math.max(0, Math.round(100 - dampened));
  return score;
}

module.exports = { SEVERITY, severityFor, computeScoreFromEvents };
