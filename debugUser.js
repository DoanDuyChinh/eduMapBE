const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Payment = require('./src/models/Payment');

const debugUser = async () => {
    // START: EDIT THIS EMAIL
    const targetEmail = 'tungonlytop2@gmail.com';
    // END: EDIT THIS EMAIL

    if (targetEmail === 'student@example.com') {
        console.log('⚠️ Please edit the script to set the correct `targetEmail`.');
        // We will try to find the last updated user if email is default, purely as a guess? No, unsafe.
    }

    try {
        await mongoose.connect(process.env.DATABASE_MG_URL);
        console.log('Connected to DB');

        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.log(`❌ User ${targetEmail} not found!`);
            process.exit(0);
        }

        console.log(`\n👤 User: ${user.username} (${user.email})`);
        console.log(`   Subscription:`, user.subscription);
        console.log(`   Language:`, user.language);
        console.log(`   Role: ${user.role}`);

        const payments = await Payment.find({ userId: user._id }).sort({ createdAt: -1 });
        console.log(`\n💳 Payment History (${payments.length} records):`);

        if (payments.length === 0) {
            console.log('   No payments found. Email will NOT be triggered.');
        }

        payments.forEach(p => {
            console.log(`   - [${p.status}] ${p.amount} VND | Type: ${p.orderType} | Date: ${p.createdAt}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugUser();
