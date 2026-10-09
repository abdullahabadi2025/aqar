# استخدام صورة Puppeteer الرسمية المجهزة بالكامل ومتصفح كروم
FROM ghcr.io/puppeteer/puppeteer:22.15.0

# تعيين مجلد العمل داخل الحاوية
WORKDIR /usr/src/app

# نسخ ملفات الاعتماديات وتثبيتها
COPY package*.json ./
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# تعيين المنفذ وتشغيل الخادم
EXPOSE 10000
CMD ["node", "index.js"]
