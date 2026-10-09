app.post('/send-message', async (req, res) => {
    try {
        let { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ status: 'error', error: 'Missing phone or message' });
        }

        // تنظيف الرقم الحاصل من الإدخال
        phone = phone.replace(/\D/g, '');

        // المعالجة الخاصة بالأرقام الأردنية (إذا بدأت بـ 07 تتحول إلى 9627)
        if (phone.startsWith('0')) {
            phone = '962' + phone.substring(1);
        } else if (phone.startsWith('7') && phone.length === 9) {
            // احتیاطاً إذا أدخل الرقم بدون الصفر (مثل 79xxxxxxx)
            phone = '962' + phone;
        }

        if (!phone.endsWith('@c.us')) {
            phone = phone + '@c.us';
        }

        await client.sendMessage(phone, message);
        console.log(`📤 تم إرسال رسالة الواتساب بنجاح إلى الرقم الأردني: ${phone}`);
        res.json({ status: 'success', sent_to: phone });
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة الواتساب:', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
});
