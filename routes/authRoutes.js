const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const router = express.Router();

// One-time setup route: creates the admin account from env vars if none exists.
// Call this once after first deploy, then it's safe to leave in place
// (it refuses to run again once an admin exists).
router.post("/setup", async (req, res) => {
  const existing = await Admin.findOne();
  if (existing) {
    return res.status(400).json({ message: "Admin already set up" });
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return res.status(500).json({ message: "Set ADMIN_PASSWORD env var first" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ username, passwordHash });

  res.json({ message: "Admin created. You can now log in." });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

module.exports = router;
