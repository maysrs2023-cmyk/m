import { SHIPPING } from './shipping_rates.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL; // ✅ nur einmal hier

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4242;
app.get('/api/test', (_req, res) => {
  res.json({ success: true, message: 'Backend funktioniert!' });
});


// ----------------------------------------------------------
//  STRIPE WEBHOOK (MUSS VOR express.json KOMMEN)
// ----------------------------------------------------------
// ⚠️ Stripe benötigt den rohen Body für die Signaturprüfung – KEIN express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Fehler bei Webhook-Verifizierung:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Erfolgreiche Zahlung
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Zahlung abgeschlossen für Session:', session.id);
  }

  res.status(200).send('Webhook empfangen');
});

// ----------------------------------------------------------
//  Middleware für normale API (nach webhook!)
// ----------------------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function readProducts() {
  const file = path.join(__dirname, 'public', 'products.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);

    const total = Array.isArray(data) ? data.length : 0;
    const checkoutReady = Array.isArray(data)
      ? data.filter(p => p.available !== false && Array.isArray(p.images) && p.images.length > 0).length
      : 0;

    console.log(`✅ products.json geladen – ${checkoutReady} Checkout-fähige Produkte, ${total} insgesamt`);
    return data;
  } catch (err) {
    console.error('❌ Fehler beim Laden von products.json:', err.message);
    return [];
  }
}

app.get('/api/products', async (_req, res) => {
  const products = await readProducts();
  res.json(products);
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT)
  .on('listening', () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} ist belegt. Entweder anderes Fenster schließen oder PORT in .env ändern.`);
      console.error(`Tipp: In PowerShell:  Get-Process node | Stop-Process -Force`);
    } else {
      console.error('❌ Server-Fehler:', err);
    }
  });

// ----------------------------------------------------------
//  CHECKOUT SESSION (SAUBER)
// ----------------------------------------------------------
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, pickup } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keine Artikel im Warenkorb' });
    }

    const allProducts = await readProducts();

    // 1) pickup-only automatisch aus products.json lesen
    const pickupOnlyIds = new Set();
    for (const p of allProducts) {
      if (p.pickup_only) {
        pickupOnlyIds.add(p.id);
        (p.variants || []).forEach(v => pickupOnlyIds.add(v.id));
      }
    }

    // 2) Wenn Versand gewählt: pickup-only Artikel rausfiltern
    const filteredItems = pickup
      ? items
      : items.filter(i => !pickupOnlyIds.has(i.id));

    // Wenn nach Filter nix übrig bleibt -> Versand nicht erlaubt (nur Abholung)
    const shippingAllowed = !pickup && filteredItems.length > 0;

    // 3) Stripe line_items bauen
    const line_items = filteredItems.map(({ id, qty }) => {
      const product = allProducts.find(p => p.id === id || p.variants?.some(v => v.id === id));
      if (!product) return null;

      const variant = product.variants?.find(v => v.id === id);
      const priceId = variant?.stripe_price_id || product.stripe_price_id;
      if (!priceId) return null;

      return { price: priceId, quantity: Number(qty) || 1 };
    }).filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Stripe-Preise gefunden' });
    }

    // 4) Subtotal (Cent) für Gratis Versand ab 60€
    const subtotal = filteredItems.reduce((sum, { id, qty }) => {
      const product = allProducts.find(p => p.id === id || p.variants?.some(v => v.id === id));
      const variant = product?.variants?.find(v => v.id === id);
      const price = variant?.price ?? product?.price ?? 0;
      return sum + price * (Number(qty) || 1);
    }, 0);

    // 5) Gewicht aus ID raten (z.B. 500g / 1kg)
    function guessWeightG(id) {
      const kg = id.match(/(\d+)kg/i);
      if (kg) return Number(kg[1]) * 1000;
      const g = id.match(/(\d+)g/i);
      if (g) return Number(g[1]);
      return 0;
    }

    const totalWeightG = filteredItems.reduce((sum, { id, qty }) => {
      return sum + guessWeightG(id) * (Number(qty) || 1);
    }, 0);

    let tier = '2kg';
    if (totalWeightG <= 2000) tier = '2kg';
    else if (totalWeightG <= 5000) tier = '5kg';
    else tier = '10kg';

    // 6) baseSession bauen
    const baseSession = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      allow_promotion_codes: true,
      success_url: `${FRONTEND_URL}/success.html`,
      cancel_url: `${FRONTEND_URL}/cancel.html`,
    };

    // 7) Versand / Abholung setzen
    if (shippingAllowed) {
      baseSession.shipping_address_collection = {
        allowed_countries: [
          'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
          'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
          'PL','PT','RO','SK','SI','ES','SE',
        ],
      };

      // Versandrate wählen (du nutzt die SHR-IDs aus Stripe!)
      const rateId = (subtotal >= 6000)
        ? SHIPPING.FREE_AB60
        : SHIPPING.EU[tier];

      baseSession.shipping_options = [{ shipping_rate: rateId }];
    } else {
      baseSession.shipping_options = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Nur Abholung im Store',
        },
      }];
    }

    const session = await stripe.checkout.sessions.create(baseSession);
    res.json({ url: session.url });

  } catch (err) {
    console.error('❌ Stripe Fehler:', err.message);
    res.status(500).json({ error: 'Fehler beim Erstellen der Checkout-Session' });
  }
});
