// Setup direct deposit for Gustavo Maldonadoi
import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

async function setupDirectDeposit() {
  console.log('🚀 Setting up direct deposit for Gustavo Maldonadoi...\n');

  try {
    // Step 1: Create a Stripe Express account for the employee
    console.log('Step 1: Creating Stripe Connect account...');
    const account = await stripe.accounts.create({
      type: 'express',
      email: 'gustavo.maldonadoi@example.com',
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        employee_id: 'EMP-004',
        employee_name: 'GUSTAVO O MALDONADO TTEE',
      },
    });
    console.log(`✅ Created account: ${account.id}`);

    // Step 2: Create a bank account for the account
    console.log('\nStep 2: Adding bank account...');
    // Note: In production, you'd collect real bank details via Stripe's OAuth or micro-deposits
    // For demo, we'll create a test bank account
    const bankAccount = await stripe.accounts.createBankAccount(
      account.id,
      {
        account_number: '111111111', // Test routing/account numbers
        routing_number: '121000358',
        account_type: 'checking',
      }
    );
    console.log(`✅ Added bank account: ${bankAccount.id}`);

    // Step 3: Create the direct deposit payout
    console.log('\nStep 3: Creating direct deposit payout...');
    const payout = await stripe.payouts.create({
      amount: 2083, // $2,083.33 (monthly from $100k annual)
      currency: 'usd',
      method: 'standard',
      description: 'Monthly Salary - Gustavo Maldonadoi (EMP-004)',
      metadata: {
        employee_id: 'EMP-004',
        pay_period: '2026-04-01 to 2026-04-30',
        pay_date: '2026-05-04',
      },
    }, {
      stripeAccount: account.id,
    });
    console.log(`✅ Created payout: ${payout.id}`);
    console.log(`   Status: ${payout.status}`);
    console.log(`   Estimated arrival: ${new Date(payout.arrival_date * 1000).toISOString()}`);

    console.log('\n🎉 Direct deposit setup complete!');
    console.log(`\nAccount ID: ${account.id}`);
    console.log(`Payout ID: ${payout.id}`);
    console.log(`\nEmployee: GUSTAVO O MALDONADO TTEE (EMP-004)`);
    console.log(`Amount: $2,083.33 (monthly salary)`);
    console.log(`Status: ${payout.status}`);

    return {
      accountId: account.id,
      payoutId: payout.id,
      status: payout.status,
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

setupDirectDeposit();
