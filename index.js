// مسار استقبال طلبات إرسال الرسائل مع معالجة خطأ getChat
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', message: 'Missing parameters' });
        }

        try {
            message = decodeURIComponent(message);
        } catch (e) {}

        // تنظيف الرقم وتنسيقه ليكون بصيغة واتساب الصحيحة
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        let formattedPhone = cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`;
        
        // التحقق من أن العميل جاهز تماماً قبل الإرسال
        if (!isClientConnected) {
            return res.status(500).json({ status: 'error', message: 'WhatsApp client is not fully connected yet.' });
        }

        // استخدام طريقتين للإرسال لضمان عدم حدوث خطأ getChat
        let chatId = formattedPhone;
        let chat = await client.getChatById(chatId).catch(() => null);
        
        if (chat) {
            await chat.sendMessage(message);
        } else {
            await client.sendMessage(chatId, message);
        }

        res.json({ status: 'success', message: 'Sent successfully' });
    } catch (error) {
        console.error('Send error details:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
