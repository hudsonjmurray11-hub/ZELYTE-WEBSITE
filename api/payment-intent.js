const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Amounts in cents
const PRICES = {
    subscribe: { '3': 2700, '5': 4500 },
    onetime:   { '3': 3000, '5': 5000 }
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pack, mode, qty } = req.body;

    if (!PRICES[mode] || !PRICES[mode][pack]) {
        return res.status(400).json({ error: 'Invalid pack or mode' });
    }

    const parsedQty = parseInt(qty, 10);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 10) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    const amount = PRICES[mode][pack] * parsedQty;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
        });
        res.status(200).json({ clientSecret: paymentIntent.client_secret, amount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
