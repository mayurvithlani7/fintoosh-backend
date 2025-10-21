/**
 * Add completed and approved fields to all existing Reward documents.
 * One-time migration script. Run with: node scripts/add-completed-approved-fields.js
 */
const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const Chore = require('../models/Chore');

const connStr = process.env.MONGO_URL
  || "mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster"; // adjust as needed

async function run() {
  await mongoose.connect(connStr);
  console.log("Connected to database");

  // Add completed and approved fields to ALL Rewards (safe operation setting defaults)
  const rewardsPatched = await Reward.updateMany(
    {},
    {
      $set: {
        completed: false,
        approved: false
      }
    }
  );

  // Also add completed field to ALL Chores (for consistency)
  const choresPatched = await Chore.updateMany(
    {},
    { $set: { completed: false } }
  );

  console.log("Rewards update result:", JSON.stringify(rewardsPatched, null, 2));
  console.log("Chores update result:", JSON.stringify(choresPatched, null, 2));
  console.log("Updated rewards with completed/approved fields:", rewardsPatched.modifiedCount || 0);
  console.log("Updated chores with completed field:", choresPatched.modifiedCount || 0);

  await mongoose.disconnect();
  console.log("Migration completed successfully!");
}

run().catch(err => {
  console.error("Error during migration:", err);
  process.exit(1);
});
