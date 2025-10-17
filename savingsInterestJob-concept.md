# Automated Savings Interest/Bonus Mechanism: Backend Concept

## Overview
A scheduled backend job (cron or service) must periodically process all user accounts with a parent-defined interest rule, calculating and crediting interest payouts for children's savings.

## Steps

1. **Identify Eligible Users:**
   - Query all child users whose profiles/settings include an active interest rule object (interestRule: {rate, frequency, jar}).

2. **Determine Payout Schedule:**
   - For each interestRule, check if the next payout is due (based on frequency [weekly/monthly] and last payout date).
   - Only process if the scheduled date has arrived.

3. **Calculate Interest:**
   - For target jar (typically "save"):
     - Get the current points/balance (e.g., savePoints).
     - Compute interest:  
       `interestAmount = Math.floor((balance * rate / 100))`
         - `rate` is a percent (e.g., 5 for 5%)
     - Only payout if interestAmount > 0.

4. **Apply Payout:**
   - Create a new transaction:
     ```
     {
       user: childId,
       type: "interest-payout",
       amount: interestAmount,
       description: "Savings Interest Earned",
       jar: "save",
       fromJar: null,
       toJar: "save",
       date: payoutTimestamp
     }
     ```
   - Increment the child's savePoints by interestAmount.

5. **Update Records:**
   - Store/update lastInterestPayoutDate on the user for future scheduling.
   - Save the updated user (with new balance) and transaction.

6. **Repeat for all children/families with rules.**


## Pseudocode (JS)

```js
// Pseudocode (to be run by cron, e.g., every night):
const now = new Date();
const eligibleKids = await User.find({ "interestRule.rate": { $gt: 0 } });

for (const kid of eligibleKids) {
  const { interestRule, savePoints, lastInterestPayoutDate } = kid;
  if (!interestRule) continue;

  // Calculate if payout is due
  const freqDays = interestRule.frequency === "monthly" ? 30 : 7;
  const lastPayout = lastInterestPayoutDate ? new Date(lastInterestPayoutDate) : kid.createdAt;
  const nextPayout = new Date(lastPayout.getTime() + freqDays * 86400000);
  if (now < nextPayout) continue;

  const balance = savePoints || 0;
  const intAmt = Math.floor(balance * interestRule.rate / 100);
  if (intAmt < 1) continue;  // Skip zero interest

  // Add transaction
  await Transaction.create({
    user: kid._id,
    type: "interest-payout",
    amount: intAmt,
    description: "Savings Interest Earned",
    fromJar: null,
    toJar: "save",
    jar: "save",
    date: now
  });

  kid.savePoints += intAmt;
  kid.lastInterestPayoutDate = now;
  await kid.save();
}
```

**Note:** Adjust schema field names as required. The above logic assumes:
- User schema has: interestRule, savePoints, lastInterestPayoutDate
- Transaction schema supports type, fromJar, toJar, description, etc.

## API/DB Changes
- Update User schema to include:
  - `interestRule` object
  - `lastInterestPayoutDate` datetime
- Transaction type "interest-payout" must be recognized in queries/filters.

## Testing & Resilience
- Ensure idempotency (do not credit multiple times per interval).
- Handle cases where balance is low (do not issue 0-point payouts).
- Consider locking if many users processed concurrently.

---
