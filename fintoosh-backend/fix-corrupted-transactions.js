const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

async function fixCorruptedTransactions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fintoosh';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Use raw MongoDB collection to find corrupted documents
    const db = mongoose.connection.db;
    const collection = db.collection('transactions');

    // Find transactions where createdAt is an empty object or invalid
    const corruptedDocuments = await collection.find({
      $or: [
        { createdAt: {} }, // Empty object
        { createdAt: null }, // Null value
        { createdAt: { $exists: false } } // Missing field
      ]
    }).toArray();

    console.log(`Found ${corruptedDocuments.length} corrupted transactions`);

    // Fix each corrupted transaction
    for (const doc of corruptedDocuments) {
      console.log(`Fixing transaction ${doc._id}:`);
      console.log(`  Current createdAt: ${JSON.stringify(doc.createdAt)} (type: ${typeof doc.createdAt})`);

      // Update using raw MongoDB update to avoid Mongoose casting
      await collection.updateOne(
        { _id: doc._id },
        { $set: { createdAt: new Date() } }
      );

      console.log(`  Fixed createdAt to: ${new Date()}`);
    }

    // Also check for any other potential issues
    const allTransactions = await Transaction.find({});
    console.log(`\nTotal transactions in database: ${allTransactions.length}`);

    let dateIssues = 0;
    for (const transaction of allTransactions) {
      if (!(transaction.createdAt instanceof Date) || isNaN(transaction.createdAt.getTime())) {
        console.log(`Transaction ${transaction._id} still has invalid createdAt: ${transaction.createdAt}`);
        dateIssues++;
      }
    }

    if (dateIssues === 0) {
      console.log('✅ All transactions have valid createdAt dates');
    } else {
      console.log(`❌ ${dateIssues} transactions still have invalid dates`);
    }

    console.log('\n✅ Transaction fix completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
    process.exit(1);
  }
}

fixCorruptedTransactions();
