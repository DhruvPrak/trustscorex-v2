const mongoose = require("mongoose");

const examEventSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    type: {
      type: String,
      enum: [
        "tab_switch",
        "window_blur",
        "copy_attempt",
        "paste_attempt",
        "right_click",
        "no_face_detected",
        "multiple_faces_detected",
        "face_mismatch",
        "camera_blurred_or_covered",
        "suspicious_object_detected",
        "devtools_opened",
        // Lifecycle/audit events — logged for the timestamped activity
        // trail, not counted as fresh violations themselves (severity 0).
        "session_terminated",
        "student_login",
      ],
      required: true,
    },
    severity: { type: Number, required: true }, // points deducted for this event
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamEvent", examEventSchema);
