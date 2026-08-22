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

  const severity = severityFor(type);
  await ExamEvent.create({ student: studentId, type, severity, meta });

  const allEvents = await ExamEvent.find({ student: studentId });
  student.trustScore = computeScoreFromEvents(allEvents);
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
