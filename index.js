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
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    isConnected = false;
    console.log('⚡ تم توليد QR Code جديد للربط.');
});

client.on('ready', () => {
    isConnected = true;
    qrCodeData = '';
    console.log('✅ تم ربط واتساب الموظف بنجاح!');
});

// API لإرجاع حالة الـ QR لموقعك أو للمتابعة
app.get('/qr-status', (req, res) => {
    res.json({ connected: isConnected, qr: qrCodeData });
});

// الاستقبال التلقائي لرسائل أصحاب العقارات وتحويلها لـ Hostinger (Gemini AI)
client.on('message', async (msg) => {
    if (msg.fromMe || msg.from.includes('@g.us')) return;

    const senderPhone = msg.from.replace('@c.us', '');
    
    try {
        const response = await axios.post('https://muk-tech.com/aqar_store/ai_chat_assistant.php', {
            is_automated_webhook: true,
            owner_phone: senderPhone,
            owner_message: msg.body
        });

        if (response.data && response.data.pitch_reply) {
            await client.sendMessage(msg.from, response.data.pitch_reply);
            console.log(`🚀 تم الرد الآلي على (${senderPhone})`);
        }
    } catch (e) {
        console.error('❌ خطأ في التزامن مع Hostinger:', e.message);
    }
});

client.initialize();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 خادم الواتساب الوسيط يعمل على المنفذ ${PORT}`));