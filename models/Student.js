const mongoose = require("mongoose");

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
