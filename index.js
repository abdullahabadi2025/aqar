const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let clientQR = null;
let isClientConnected = false;

// إعداد عميل الواتساب مع خيارات خفيفة جداً لتسريع الإقلاع على السحابة
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
            '--single-process', // مفيد جداً لخوادم Render لتقليل استهلاك الذاكرة
            '--disable-gpu'
        ],
        executablePath: process.env.CHROME_PATH || undefined
    }
});

client.on('qr', (qr) => {
    console.log('⚡ QR RECEIVED SUCCESSFULLY');
    clientQR = qr;
    isClientConnected = false;
});

client.on('ready', () => {
    console.log('✅ WhatsApp is ready and connected!');
    isClientConnected = true;
    clientQR = null;
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Authenticated Successfully!');
    isClientConnected = true;
    clientQR = null;
});

client.on('auth_failure', (msg) => {
    console.error('❌ AUTHENTICATION FAILURE:', msg);
    isClientConnected = false;
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client was disconnected, restarting...', reason);
    isClientConnected = false;
    clientQR = null;
    setTimeout(() => {
        client.initialize().catch(err => console.error('Re-init error:', err));
    }, 5000);
});

// مسار فحص حالة الواتساب والـ QR Code الفوري
app.get('/qr-status', (req, res) => {
    res.json({
        connected: isClientConnected,
        qr: clientQR
    });
});

// مسار استقبال طلبات إرسال الرسائل
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', message: 'Missing phone or message' });
        }

        //فك ترميز النص إذا تم إرساله مشفرامسبقاً
        try {
            message = decodeURIComponent(message);
        } catch (e) {
            // إذا لم يكن مشفرأ يُترك كما هو
        }

        let formattedPhone = phone.includes('@c.us') ? phone : `${phone.replace(/[^0-9]/g, '')}@c.us`;
        
        await client.sendMessage(formattedPhone, message);
        res.json({ status: 'success', message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// مسار ترحيبي رئيسي للاختبار
app.get('/', (req, res) => {
    res.send('Aqar WhatsApp Bridge is running securely and fast.');
});

// بدء التشغيل
console.log('🚀 Initializing WhatsApp Client...');
client.initialize().catch(err => {
    console.error('Failed to initialize client:', err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🌐 خادم الواتساب الوسيط يعمل بكفاءة على المنفذ ${PORT}`);
});
