const express = require("express");
const Student = require("../models/Student");
const ExamEvent = require("../models/ExamEvent");
const { severityFor, computeScoreFromEvents, TERMINATION_THRESHOLD } = require("../utils/trustScore");

const router = express.Router();

// Marks a student's session terminated, logs the termination itself as a
// timestamped event, and returns the fields the frontend needs to react.
async function terminateSession(student, reason) {
  student.sessionTerminated = true;
  student.terminatedAt = new Date();
  student.terminationReason = reason;
  await student.save();

  await ExamEvent.create({
    student: student._id,
    type: "session_terminated",
    severity: 0,
    meta: { reason },
  });

  student.lastActivityAt = student.terminatedAt;
  await student.save();
}

// Called by the exam-monitor page whenever a suspicious signal fires
// (tab switch, no face detected, copy attempt, etc.)
router.post("/event", async (req, res) => {
  const { studentId, type, meta } = req.body;
  if (!studentId || !type) {
    return res.status(400).json({ message: "studentId and type are required" });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // Once a session is terminated, no further events can change the score —
  // the exam page should already have redirected the student home, but
  // this is the server-side backstop against a stray/late request.
  if (student.sessionTerminated) {
    return res.status(403).json({
      message: "Session already terminated — no further exam events accepted.",
      terminated: true,
      terminationReason: student.terminationReason,
      newScore: student.trustScore,
      status: student.status,
    });
  }

  // Server-side enforcement of personalization — mirrors the client-side
  // skip in exam.html, but re-checked here so a no-webcam student can't be
  // dinged by a face-detection event fired directly against the API.
  const CAMERA_DEPENDENT_EVENTS = new Set([
    "no_face_detected",
    "multiple_faces_detected",
    "face_mismatch",
    "camera_blurred_or_covered",
    "suspicious_object_detected",
  ]);
  const isFaceEvent = CAMERA_DEPENDENT_EVENTS.has(type);
  if (isFaceEvent && !student.preferences.hasWebcam) {
    return res.json({
      message: "Event ignored — student has no-webcam accommodation",
      newScore: student.trustScore,
      status: student.status,
      terminated: false,
    });
  }

  const severity = severityFor(type);
  await ExamEvent.create({ student: studentId, type, severity, meta });

  const allEvents = await ExamEvent.find({ student: studentId });
  const leniency = student.preferences.reducedSensitivity ? 0.7 : 1;
  student.trustScore = computeScoreFromEvents(allEvents, leniency);
  student.lastActivityAt = new Date();
  await student.save();

  // Trust score hit the floor — terminate immediately: no more exam
  // attempts for this student until an admin clears it.
  if (student.trustScore <= TERMINATION_THRESHOLD) {
    await terminateSession(student, "trust_score_threshold");
    return res.json({
      message: "Trust score fell to or below the allowed limit — session terminated.",
      newScore: student.trustScore,
      status: student.status,
      terminated: true,
      terminationReason: "trust_score_threshold",
      terminatedAt: student.terminatedAt,
    });
  }

  res.json({
    message: "Event logged",
    newScore: student.trustScore,
    status: student.status,
    terminated: false,
  });
});

// Called by the exam page when the 5-minute session timer runs out.
router.post("/terminate", async (req, res) => {
  const { studentId, reason } = req.body;
  if (!studentId) return res.status(400).json({ message: "studentId is required" });

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (!student.sessionTerminated) {
    await terminateSession(student, "time_expired");
  }

  res.json({
    message: "Session terminated",
    terminated: true,
    terminationReason: student.terminationReason,
    terminatedAt: student.terminatedAt,
  });
});

// Full event timeline for a student (used on the admin detail view) —
// includes createdAt/updatedAt timestamps from the schema's
// `timestamps: true` option, which the frontend formats into a readable
// date + time.
router.get("/events/:studentId", async (req, res) => {
  const events = await ExamEvent.find({ student: req.params.studentId }).sort({
    createdAt: -1,
  });
  res.json(events);
});

module.exports = router;
