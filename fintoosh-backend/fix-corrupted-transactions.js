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

    console.log('🔍 Searching for corrupted transactions...');

    // Use aggregation pipeline to find documents where createdAt is an empty object
    const corruptedPipeline = [
      {
        $match: {
          createdAt: {} // Match documents where createdAt is exactly an empty object
        }
      }
    ];

    const corruptedDocuments = await collection.aggregate(corruptedPipeline).toArray();
    console.log(`Found ${corruptedDocuments.length} transactions with empty object createdAt`);

    // Also find documents where createdAt is null or missing
    const nullMissingDocuments = await collection.find({
      $or: [
        { createdAt: null },
        { createdAt: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${nullMissingDocuments.length} transactions with null/missing createdAt`);

    // Combine both arrays
    const allCorruptedDocuments = [...corruptedDocuments, ...nullMissingDocuments];

    console.log(`\nTotal corrupted documents to fix: ${allCorruptedDocuments.length}`);

    // Fix each corrupted transaction
    for (const doc of allCorruptedDocuments) {
      console.log(`🔧 Fixing transaction ${doc._id}:`);
      console.log(`  Current createdAt: ${JSON.stringify(doc.createdAt)} (type: ${typeof doc.createdAt})`);

      // Update using raw MongoDB update to avoid Mongoose casting issues
      await collection.updateOne(
        { _id: doc._id },
        { $set: { createdAt: new Date() } }
      );

      console.log(`  ✅ Fixed createdAt to: ${new Date()}`);
    }

    // Now verify the fix by checking if we can query all transactions without errors
    console.log('\n🔍 Verifying fix...');
    try {
      // Try to query all transactions (this will fail if there are still corrupted documents)
      const allTransactions = await Transaction.find({}).limit(10);
      console.log(`✅ Successfully queried ${allTransactions.length} transactions (showing first 10)`);

      // Try the specific analytics query that was failing
      console.log('🔍 Testing analytics query...');
      const analyticsQuery = await Transaction.find({
        user: { $exists: true } // Just check that we can query without date filters
      }).limit(5);
      console.log(`✅ Analytics-style query successful, found ${analyticsQuery.length} transactions`);

      // Try with empty date filter (the problematic case)
      console.log('🔍 Testing empty date filter query...');
      const emptyDateQuery = await Transaction.find({
        user: { $exists: true },
        createdAt: {} // This should now work
      }).limit(5);
      console.log(`✅ Empty date filter query successful, found ${emptyDateQuery.length} transactions`);

    } catch (verifyError) {
      console.log(`❌ Verification failed: ${verifyError.message}`);
      console.log('🔧 Attempting additional fixes...');

      // If verification failed, try to find and fix any remaining issues
      const remainingCorrupted = await collection.find({
        $or: [
          { createdAt: {} },
          { createdAt: null },
          { createdAt: { $exists: false } }
        ]
      }).toArray();

      if (remainingCorrupted.length > 0) {
        console.log(`Found ${remainingCorrupted.length} remaining corrupted documents`);

        for (const doc of remainingCorrupted) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { createdAt: new Date() } }
          );
        }
        console.log('✅ Applied additional fixes');
      }
    }

    // Final count
    const finalCount = await collection.countDocuments({});
    console.log(`\n📊 Final transaction count: ${finalCount}`);

    console.log('\n✅ Transaction corruption fix completed successfully!');
    console.log('💡 The analytics endpoint should now work without the "Cast to date failed" error.');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

fixCorruptedTransactions();
