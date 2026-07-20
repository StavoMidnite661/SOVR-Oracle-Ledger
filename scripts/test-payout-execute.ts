import axios from 'axios';

async function testPayoutEndpoint() {
    console.log("🚀 Testing Local Stripe Payout Endpoint...");
    
    // Check if the service is running
    try {
        await axios.get('http://localhost:3005/health');
    } catch (e: any) {
        console.error("❌ Gateway is offline. Ensure `npm run dev` is running in ORACLE-LEDGER first.");
        return;
    }

    try {
        // Simulated Payload from the Dashboard UI
        const payload = {
            amountCents: 1000, // $10.00
            currency: 'usd',
            recipientId: 'acct_1OuXXXX', // This should be a real connected account ID in production
            messageType: 'ACH', // Will resolve to achPaymentService
            purpose: 'Test Live Payout',
            reference: `REF-TEST-${Date.now()}`
        };

        console.log(`📡 Sending test payload to localhost:3005/api/stripe/payouts/execute`);
        console.log(JSON.stringify(payload, null, 2));

        const response = await axios.post('http://localhost:3005/api/stripe/payouts/execute', payload, {
            headers: {
                'X-User-ID': 'system-test',
                'X-User-Email': 'test@sovr.local'
            }
        });

        console.log("\n✅ ENDPOINT EXECUTED SUCCESSFULLY:");
        console.log("--------------------------------------------------");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        console.log("\n📝 The Stripe backend parsed the payload correctly.");

    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.response?.data || error.message);
    }
}

testPayoutEndpoint();
