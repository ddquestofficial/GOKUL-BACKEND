const express = require('express');
const admin   = require('firebase-admin');

// ── Service account loaded from Render environment variable (never from a file)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('GOKUL FCM Backend running ✅');
});

// ── POST /notify ──────────────────────────────────────────────────────────────
// Body: { token, title, body, orderId }
app.post('/notify', async (req, res) => {
  const { token, title, body, orderId } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: token, title, body' });
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: {
      orderId: orderId || '',
      type:    'new_order',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'gokul_orders',
        sound:     'default',
        priority:  'high',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[FCM] Sent to token ...${token.slice(-8)}: ${response}`);
    res.json({ success: true, messageId: response });
  } catch (err) {
    console.error('[FCM] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GOKUL FCM Backend listening on port ${PORT}`);
});