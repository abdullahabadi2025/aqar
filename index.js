const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let qrCodeData = '';
let isConnected = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        protocolTimeout: 120000, // رفع المهلة إلى دقيقتين لضمان عدم حدوث أي Timeout
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ] 
    }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    isConnected = false;
    console.log('⚡ تم توليد QR Code جديد للربط:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isConnected = true;
    qrCodeData = '';
    console.log('✅ تم ربط واتساب الموظف بنجاح!');
});

app.get('/qr-status', (req, res) => {
    res.json({ connected: isConnected, qr: qrCodeData });
});

// مسار إرسال الرسائل الفوري والسريع بدون أي انتظار أو تعقيد
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', error: 'Missing phone or message' });
        }

        // فك ترميز النص العربي لضمان وضوحه
        try {
            message = decodeURIComponent(message);
        } catch (e) {}

        // تنظيف الرقم ومعالجة الأرقام الأردنية دولياً
        phone = phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '962' + phone.substring(1);
        } else if (phone.startsWith('7') && phone.length === 9) {
            phone = '962' + phone;
        }

        const chatId = phone + '@c.us';

        // الإرسال الفوري المباشر دون استخدام getNumberId لتجنب الـ Timeout
        await client.sendMessage(chatId, message);
        console.log(`📤 تم إرسال رسالة الواتساب فوراً بنجاح إلى: ${chatId}`);
        res.json({ status: 'success', sent_to: chatId });
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة الواتساب:', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

client.on('message', async (msg) => {
    if (msg.fromMe || msg.from.includes('@g.us')) return;

    const senderPhone = msg.from.replace('@c.us', '');
    
    try {
        const response = await axios.post('https://muk-tech.com/aqar/ai_chat_assistant.php', {
            is_automated_webhook: true,
            owner_phone: senderPhone,
            owner_message: msg.body
        });

        if (response.data && response.data.pitch_reply) {
            await client.sendMessage(msg.from, response.data.pitch_reply);
        }
    } catch (e) {
        console.error('❌ خطأ في التزامن مع Hostinger:', e.message);
    }
});

client.initialize();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 خادم الواتساب الوسيط يعمل على المنفذ ${PORT}`));
