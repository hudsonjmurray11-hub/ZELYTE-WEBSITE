const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { priceId, quantity } = req.body;

    const validPrices = ['price_1TajD9EQRyWAWeKLLvN64RCS'];
    if (!validPrices.includes(priceId)) {
        return res.status(400).json({ error: 'Invalid price' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [{ price: priceId, quantity: quantity || 1 }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/crispy-mint.html`,
        });
        res.status(200).json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
