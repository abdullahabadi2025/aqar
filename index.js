// أضف هذا المسار في ملف index.js على Railway
app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', error: 'Missing phone or message' });
        }

        // تنظيف وتنسيق الرقم ليصبح متوافقاً مع واتساب دولياً (مثلاً الأردن 962)
        phone = phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '962' + phone.substring(1); // تعديل رمز الدولة حسب دولتك إذا لزم الأمر
        }
        if (!phone.endsWith('@c.us')) {
            phone = phone + '@c.us';
        }

        await client.sendMessage(phone, message);
        console.log(`📤 تم إرسال رسالة الواتساب بنجاح إلى: ${phone}`);
        res.json({ status: 'success', sent_to: phone });
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة الواتساب:', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
});
