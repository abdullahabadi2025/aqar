const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let clientQR = null;
let isClientConnected = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: process.env.CHROME_PATH || undefined
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    clientQR = qr;
    isClientConnected = false;
});

client.on('ready', () => {
    console.log('WhatsApp is ready!');
    isClientConnected = true;
    clientQR = null;
});

client.on('authenticated', () => {
    console.log('WhatsApp Authenticated!');
    isClientConnected = true;
    clientQR = null;
});

client.on('auth_failure', (msg) => {
    console.error('AUTHENTICATION FAILURE', msg);
    isClientConnected = false;
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
    isClientConnected = false;
    clientQR = null;
    client.initialize();
});

// مسار فحص حالة الواتساب والـ QR Code المطلوب من صفحة الـ PHP
app.get('/qr-status', (req, res) => {
    res.json({
        connected: isClientConnected,
        qr: clientQR
    });
});

// مسار استقبال طلبات إرسال الرسائل من PHP
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        message = decodeURIComponent(message);
        
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', message: 'Missing phone or message' });
        }

        // تنسيق رقم الهاتف ليكون ملائماً للواتساب (تأكد من إضافة الرمز الدولي إذا لزم الأمر، مثل 962 للأردن)
        let formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        
        await client.sendMessage(formattedPhone, message);
        res.json({ status: 'success', message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// مسار ترحيبي رئيسي
app.get('/', (req, res) => {
    res.send('Aqar WhatsApp Bridge is running successfully.');
});

client.initialize();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 خادم الواتساب الوسيط يعمل على المنفذ ${PORT}`);
});
