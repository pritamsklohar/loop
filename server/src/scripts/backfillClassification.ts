import connectDB from '../config/db';
import { Feedback } from '../models';
import { classifyFeedbackDocument } from '../services/classifier';
import mongoose from 'mongoose';

async function backfill() {
  try {
    await connectDB();
    console.log("Database connected for backfilling classification...");

    // Find all feedback that lacks a sentiment (is null or undefined)
    const unclassifiedFeedback = await Feedback.find({
      $or: [
        { sentiment: null },
        { sentiment: { $exists: false } },
        { embedding: null },
        { embedding: { $exists: false } }
      ]
    });

    const total = unclassifiedFeedback.length;
    console.log(`Found ${total} unclassified feedback items.`);

    let index = 1;
    for (const doc of unclassifiedFeedback) {
      console.log(`[${index}/${total}] Classifying feedback ID: ${doc._id}...`);
      await classifyFeedbackDocument(doc._id.toString());
      
      // Add a small 200ms delay to prevent rate limit bottlenecks
      await new Promise(resolve => setTimeout(resolve, 200));
      index++;
    }

    console.log("Backfill classification script completed successfully!");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

backfill();
