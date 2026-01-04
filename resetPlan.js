const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const resetPlan = async () => {
    // Replace with the email of the USER account you are testing with
    const targetEmail = 'tungonlytop2@gmail.com';

    try {
        await mongoose.connect(process.env.DATABASE_MG_URL);
        console.log('Connected to DB');

        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.log(`❌ User ${targetEmail} not found!`);
            process.exit(0);
        }

        console.log('Current Plan for', user.username, ':', user.subscription);

        // Reset to FREE
        user.subscription = {
            plan: 'free',
            expiresAt: null
        };
        // // Force set Language to English for testing
        // user.language = 'en';

        await user.save();

        console.log('✅ User plan reset to FREE successfully.');
        console.log('👉 Now go to the VIP Packages page to trigger the Sync and Email.');

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

resetPlan();
