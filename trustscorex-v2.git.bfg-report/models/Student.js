const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    hasWebcam: { type: Boolean, default: true },
    reducedSensitivity: { type: Boolean, default: false },
    accessibilityNotes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const onboardingSchema = new mongoose.Schema(
  {
    step: { type: Number, default: 1, min: 1, max: 4 },
    deviceCheckPassed: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const idVerificationSchema = new mongoose.Schema(
  {
    idPhotoDataUrl: { type: String, default: null }, // small base64 preview, for admin review only
    faceEmbedding: { type: [Number], default: null }, // 128-d descriptor from the ID photo
    verified: { type: Boolean, default: false }, // live camera matched the ID photo
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["clean", "warning", "high_risk"],
      default: "clean",
    },
    preferences: { type: preferencesSchema, default: () => ({}) },
    onboarding: { type: onboardingSchema, default: () => ({}) },
    idVerification: { type: idVerificationSchema, default: () => ({}) },

    // Session lifecycle — set once the trust score hits the termination
    // floor or the exam timer runs out. A terminated student cannot log
    // back in or resume/attempt an exam until an admin clears this.
    sessionTerminated: { type: Boolean, default: false },
    terminatedAt: { type: Date, default: null },
    terminationReason: {
      type: String,
      enum: ["trust_score_threshold", "time_expired", "camera_not_working", null],
      default: null,
    },

    // Set when the exam clock actually starts (final review confirmed),
    // used to drive the 5-minute session timer and shown to admins.
    examStartedAt: { type: Date, default: null },

    // Timestamp of the most recent logged action for this student (event,
    // login, termination, etc.) — kept denormalized on the student doc so
    // every list view can show "last activity" without an extra query per
    // row. The full per-action history lives in ExamEvent.
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Keep status in sync with score whenever it's saved
studentSchema.pre("save", function (next) {
  if (this.trustScore < 50) this.status = "high_risk";
  else if (this.trustScore < 75) this.status = "warning";
  else this.status = "clean";
  next();
});

module.exports = mongoose.model("Student", studentSchema);
