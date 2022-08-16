// Do not change this file
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

export default async function(callback) {
  const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file


  try {
    // Connect to the MongoDB cluster
    mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(() => {
      callback();
    });

    // Make the appropriate DB calls
  } catch (e) {
    // Catch any errors
    console.error(e);
    throw new Error("Unable to Connect to Database");
  }
}

