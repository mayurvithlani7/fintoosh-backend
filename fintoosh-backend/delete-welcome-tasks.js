const mongoose = require('mongoose');
const Chore = require('./models/Chore');

async function deleteWelcomeTasks() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb+srv://fintoosh_prod:fintoosh2024@fintoosh-cluster.mwuprcs.mongodb.net/fintoosh_prod?retryWrites=true&w=majority&appName=fintoosh-cluster';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete all welcome tasks
    const result = await Chore.deleteMany({
      $or: [
        { name: /Customize Your Avatar/ },
        { isWelcomeTask: true }
      ]
    });

    console.log(`Deleted ${result.deletedCount} welcome tasks`);
    console.log('Welcome tasks deletion completed successfully');

  } catch (error) {
    console.error('Error deleting welcome tasks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteWelcomeTasks();
