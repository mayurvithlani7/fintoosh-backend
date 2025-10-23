const mongoose = require('mongoose');
const ChoreTemplate = require('../models/ChoreTemplate');
const Chore = require('../models/Chore');

// Utility functions for date calculations
function calculatePeriod(frequency, currentDate) {
  const start = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { periodStart: start, periodEnd: end };

    case 'weekly':
      // Start of week (Monday)
      const dayOfWeek = start.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
      start.setDate(start.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);

      const weekEnd = new Date(start);
      weekEnd.setDate(start.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { periodStart: start, periodEnd: weekEnd };

    case 'monthly':
      // Start of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      return { periodStart: start, periodEnd: monthEnd };

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

function calculateNextDueDate(frequency, currentDate) {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7);
      // Ensure it's Monday
      const dayOfWeek = next.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      next.setDate(next.getDate() + diffToMonday);
      next.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      break;

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return next;
}

async function createNextInstance(template, currentDate) {
  try {
    // Calculate period dates based on frequency
    const { periodStart, periodEnd } = calculatePeriod(template.frequency, currentDate);

    // Create new chore instance
    const newChore = new Chore({
      parent: template.parent,
      user: template.user,
      name: template.name,
      description: template.description,
      points: template.points,
      frequency: template.frequency,
      category: template.category,

      // Recurring instance fields
      isTemplate: false,
      templateId: template._id.toString(),
      instanceDate: currentDate,
      periodStart,
      periodEnd,
      gracePeriodDays: template.gracePeriodDays,
      allowCarryOver: template.allowCarryOver,
      maxOverdueInstances: template.maxOverdueInstances,

      // Point split settings
      useDefaultSplit: template.useDefaultSplit,
      customSplit: template.customSplit,

      status: 'active',
      completed: false,
      approved: false
    });

    await newChore.save();
    console.log(`Created recurring chore instance: ${template.name} for period ${periodStart.toDateString()} - ${periodEnd.toDateString()}`);

    // Update template's next due date
    template.nextInstanceDue = calculateNextDueDate(template.frequency, currentDate);
    template.lastInstanceCreated = currentDate;
    await template.save();

    return newChore;
  } catch (error) {
    console.error('Error creating next instance:', error);
    throw error;
  }
}

// Main job function - runs daily at midnight
async function processRecurringTasks() {
  try {
    console.log('Starting recurring tasks job at', new Date().toISOString());

    const now = new Date();

    // Find all active templates that need new instances
    const dueTemplates = await ChoreTemplate.find({
      isActive: true,
      nextInstanceDue: { $lte: now }
    });

    console.log(`Found ${dueTemplates.length} templates that need new instances`);

    const results = [];
    for (const template of dueTemplates) {
      try {
        const newInstance = await createNextInstance(template, now);
        results.push({
          templateId: template._id,
          templateName: template.name,
          newInstanceId: newInstance._id,
          period: `${newInstance.periodStart.toDateString()} - ${newInstance.periodEnd.toDateString()}`
        });
      } catch (error) {
        console.error(`Failed to create instance for template ${template._id}:`, error);
        results.push({
          templateId: template._id,
          templateName: template.name,
          error: error.message
        });
      }
    }

    console.log(`Recurring tasks job completed. Created ${results.filter(r => r.newInstanceId).length} new instances`);
    return results;

  } catch (error) {
    console.error('Recurring tasks job failed:', error);
    throw error;
  }
}

// Function to manually trigger the job (for testing)
async function runRecurringTasksJob() {
  try {
    const results = await processRecurringTasks();
    console.log('Manual recurring tasks job results:', results);
    return results;
  } catch (error) {
    console.error('Manual recurring tasks job failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  processRecurringTasks,
  runRecurringTasksJob,
  calculatePeriod,
  calculateNextDueDate,
  createNextInstance
};

// For testing - run if called directly
if (require.main === module) {
  // Connect to database and run job
  const connectDB = require('../config/database');

  connectDB().then(() => {
    console.log('Connected to database, running recurring tasks job...');
    runRecurringTasksJob()
      .then((results) => {
        console.log('Job completed successfully:', results);
        process.exit(0);
      })
      .catch((error) => {
        console.error('Job failed:', error);
        process.exit(1);
      });
  }).catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
}
