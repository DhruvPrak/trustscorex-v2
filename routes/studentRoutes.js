const express = require("express");
const Student = require("../models/Student");
const requireAdmin = require("../middleware/auth");

const router = express.Router();

// Public: register a new student (starts at a clean 100 score)
router.post("/register", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const student = await Student.create({ name, email });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A student with that email already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/students", async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

// Public: fetch a single student (used by the onboarding wizard + exam page
// to read back preferences/onboarding state across steps)
router.get("/students/:id", async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

// Public: step 2 of the wizard — save accommodation preferences
router.patch("/students/:id/preferences", async (req, res) => {
  const { hasWebcam, reducedSensitivity, accessibilityNotes } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (hasWebcam !== undefined) student.preferences.hasWebcam = !!hasWebcam;
  if (reducedSensitivity !== undefined) student.preferences.reducedSensitivity = !!reducedSensitivity;
  if (accessibilityNotes !== undefined) student.preferences.accessibilityNotes = String(accessibilityNotes).trim();
  student.onboarding.step = Math.max(student.onboarding.step, 2);

  await student.save();
  res.json(student);
});

// Public: step 3 of the wizard — record the outcome of the live device check
router.patch("/students/:id/device-check", async (req, res) => {
  const { passed } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  student.onboarding.deviceCheckPassed = !!passed;
  student.onboarding.step = Math.max(student.onboarding.step, 3);

  await student.save();
  res.json(student);
});

// Public: step 4 of the wizard — final consent, marks onboarding complete
router.patch("/students/:id/onboarding-complete", async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  student.onboarding.step = 4;
  student.onboarding.completed = true;

  await student.save();
  res.json(student);
});

router.get("/search/:name", async (req, res) => {
  const regex = new RegExp(req.params.name, "i");
  const students = await Student.find({ name: regex });
  res.json(students);
});

router.get("/leaderboard", async (req, res) => {
  const students = await Student.find().sort({ trustScore: -1 });
  res.json(students);
});

router.get("/risk-students", async (req, res) => {
  const students = await Student.find({ trustScore: { $lt: 70 } }).sort({ trustScore: 1 });
  res.json(students);
});

router.get("/analytics", async (req, res) => {
  const students = await Student.find();
  const totalStudents = students.length;
  const avgScore =
    totalStudents > 0
      ? students.reduce((a, b) => a + b.trustScore, 0) / totalStudents
      : 0;
  const highRisk = students.filter((s) => s.trustScore < 50).length;
  const warning = students.filter((s) => s.trustScore >= 50 && s.trustScore < 75).length;
  const clean = students.filter((s) => s.trustScore >= 75).length;

  res.json({
    totalStudents,
    avgScore: Number(avgScore.toFixed(2)),
    highRisk,
    warning,
    clean,
  });
});

router.get("/export", async (req, res) => {
  const students = await Student.find();
  res.setHeader("Content-Disposition", "attachment; filename=students.json");
  res.json(students);
});

// Admin-only: manual score override
router.post("/update-score", requireAdmin, async (req, res) => {
  const { id, trustScore } = req.body;
  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  student.trustScore = Math.max(0, Math.min(100, Number(trustScore)));
  await student.save();
  res.json({ message: "Score updated", student });
});

// Admin-only: delete student
router.delete("/delete/:id", requireAdmin, async (req, res) => {
  const deleted = await Student.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Student not found" });
  res.json({ message: "Student deleted" });
});

module.exports = router;
