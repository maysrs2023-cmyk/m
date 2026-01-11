const express = require('express');
const app = express();
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ⚠️ WICHTIG: KEIN express.json() oder body-parser hier oben verwenden!

app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Fehler bei Signatur: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Reagiere auf checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Zahlung abgeschlossen für Session:', session.id);
  }

  response.status(200).send('Webhook empfangen!');
});

// ✅ Server starten
app.listen(process.env.PORT || 3000, () =>
  console.log(`✅ Webhook-Server läuft auf Port ${process.env.PORT || 3000}`)
);
