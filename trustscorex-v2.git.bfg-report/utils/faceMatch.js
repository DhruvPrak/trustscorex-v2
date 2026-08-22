// Compares 128-dimension face descriptors produced client-side by
// face-api.js's faceRecognitionNet. Lower distance = more similar face.
// These thresholds follow face-api.js's own convention (0.6 is the
// library's documented default for "same person").
const LIVE_MATCH_THRESHOLD = 0.55; // live camera vs uploaded ID — stricter, single decision
const DUPLICATE_THRESHOLD = 0.5; // ID vs every other enrolled student's ID — stricter, catches near-duplicates

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error("Invalid face descriptors — expected two equal-length numeric arrays");
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

module.exports = { euclideanDistance, LIVE_MATCH_THRESHOLD, DUPLICATE_THRESHOLD };
