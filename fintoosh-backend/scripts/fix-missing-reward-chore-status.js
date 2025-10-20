/**
 * Set status: 'active' for all rewards and chores where status is missing or undefined.
 * One-time repair script. Run with: node scripts/fix-missing-reward-chore-status.js
 */
const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const Chore = require('../models/Chore');

const connStr = process.env.MONGO_URL
  || "mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster"; // adjust as needed

async function run() {
  await mongoose.connect(connStr);
  console.log("Connected to database");
  // Patch Rewards
  const rewardsPatched = await Reward.updateMany(
    { $or: [ { status: { $exists: false } }, { status: null } ] },
    { $set: { status: "active" } }
  );
  // Patch Chores
  const choresPatched = await Chore.updateMany(
    { $or: [ { status: { $exists: false } }, { status: null } ] },
    { $set: { status: "active" } }
  );
  console.log("Updated rewards:", rewardsPatched.modifiedCount);
  console.log("Updated chores:", choresPatched.modifiedCount);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Error fixing reward/chore statuses:", err);
  process.exit(1);
});
