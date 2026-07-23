const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Amounts in cents
const PRICES = {
    subscribe: { '3': 3000, '5': 4500 },
    onetime:   { '3': 3300, '5': 5000 }
};

// Fixed product id so the recurring price can reference it without any
// dashboard setup. Created on first use, reused afterwards.
const PRODUCT_ID = 'zelyte-crispy-mint-tin';

async function ensureProduct() {
    try {
        return await stripe.products.retrieve(PRODUCT_ID);
    } catch (err) {
        if (err.code !== 'resource_missing') throw err;
        return await stripe.products.create({
            id: PRODUCT_ID,
            name: 'ZELYTE Crispy Mint — Tin (15 pouches)'
        });
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pack, mode, qty, email, name, shipping } = req.body;

    if (!PRICES[mode] || !PRICES[mode][pack]) {
        return res.status(400).json({ error: 'Invalid pack or mode' });
    }

    const parsedQty = parseInt(qty, 10);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 10) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!name || !shipping || !shipping.line1 || !shipping.city || !shipping.postal_code || !shipping.country) {
        return res.status(400).json({ error: 'Name and shipping address are required' });
    }

    const address = {
        line1: shipping.line1,
        line2: shipping.line2 || undefined,
        city: shipping.city,
        state: shipping.state || undefined,
        postal_code: shipping.postal_code,
        country: shipping.country
    };
    const amount = PRICES[mode][pack] * parsedQty;
    const metadata = { pack, mode, qty: String(parsedQty) };

    try {
        if (mode === 'subscribe') {
            await ensureProduct();

            const customer = await stripe.customers.create({
                email,
                name,
                shipping: { name, address }
            });

            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{
                    price_data: {
                        currency: 'usd',
                        product: PRODUCT_ID,
                        recurring: { interval: 'month' },
                        unit_amount: PRICES.subscribe[pack]
                    },
                    quantity: parsedQty
                }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.confirmation_secret'],
                metadata
            });

            const clientSecret = subscription.latest_invoice.confirmation_secret.client_secret;
            return res.status(200).json({ clientSecret, amount });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            receipt_email: email,
            shipping: { name, address },
            metadata
        });
        return res.status(200).json({ clientSecret: paymentIntent.client_secret, amount });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
