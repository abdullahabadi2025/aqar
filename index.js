const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let clientQR = null;
let isClientConnected = false;

// إعداد العميل بأعلى خفة لتناسب الذاكرة المحدودة (512MB)
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_sessions' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions'
        ],
        executablePath: process.env.CHROME_PATH || undefined
    }
});

client.on('qr', (qr) => {
    console.log('⚡ QR RECEIVED');
    clientQR = qr;
    isClientConnected = false;
});

client.on('ready', () => {
    console.log('✅ WhatsApp Connected & Ready!');
    isClientConnected = true;
    clientQR = null;
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Authenticated!');
    isClientConnected = true;
    clientQR = null;
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth Failure:', msg);
    isClientConnected = false;
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Disconnected:', reason);
    isClientConnected = false;
    clientQR = null;
    setTimeout(() => client.initialize(), 5000);
});

// المسار لجلب الـ QR أو حالة الاتصال
app.get('/qr-status', (req, res) => {
    res.json({
        connected: isClientConnected,
        qr: clientQR
    });
});

// المسار لإرسال الرسائل بسرعة
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', message: 'Missing parameters' });
        }

        try {
            message = decodeURIComponent(message);
        } catch (e) {}

        let formattedPhone = phone.includes('@c.us') ? phone : `${phone.replace(/[^0-9]/g, '')}@c.us`;
        
        await client.sendMessage(formattedPhone, message);
        res.json({ status: 'success', message: 'Sent successfully' });
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Aqar WhatsApp Bridge is running smoothly.');
});

client.initialize().catch(err => console.error('Init error:', err));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
