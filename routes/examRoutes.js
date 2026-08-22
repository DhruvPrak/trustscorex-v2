const express = require("express");
const Student = require("../models/Student");
const ExamEvent = require("../models/ExamEvent");
const { severityFor, computeScoreFromEvents } = require("../utils/trustScore");

const router = express.Router();

// Called by the exam-monitor page whenever a suspicious signal fires
// (tab switch, no face detected, copy attempt, etc.)
router.post("/event", async (req, res) => {
  const { studentId, type, meta } = req.body;
  if (!studentId || !type) {
    return res.status(400).json({ message: "studentId and type are required" });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // Server-side enforcement of personalization — mirrors the client-side
  // skip in exam.html, but re-checked here so a no-webcam student can't be
  // dinged by a face-detection event fired directly against the API.
  const isFaceEvent = type === "no_face_detected" || type === "multiple_faces_detected";
  if (isFaceEvent && !student.preferences.hasWebcam) {
    return res.json({
      message: "Event ignored — student has no-webcam accommodation",
      newScore: student.trustScore,
      status: student.status,
    });
  }

  const severity = severityFor(type);
  await ExamEvent.create({ student: studentId, type, severity, meta });

  const allEvents = await ExamEvent.find({ student: studentId });
  const leniency = student.preferences.reducedSensitivity ? 0.7 : 1;
  student.trustScore = computeScoreFromEvents(allEvents, leniency);
  await student.save();

  res.json({
    message: "Event logged",
    newScore: student.trustScore,
    status: student.status,
  });
});

// Full event timeline for a student (used on the admin detail view)
router.get("/events/:studentId", async (req, res) => {
  const events = await ExamEvent.find({ student: req.params.studentId }).sort({
    createdAt: -1,
  });
  res.json(events);
});

module.exports = router;
