const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "\n MONGO_URI is not set.\n" +
      "   Create a free MongoDB Atlas cluster (M0 tier) at https://www.mongodb.com/cloud/atlas\n" +
      "   then set MONGO_URI in your .env file or Render environment variables.\n"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(" MongoDB connected");
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
