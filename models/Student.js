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
