import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

// حل مشكلة __dirname في ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// المسار إلى مجلد api
const apiFolder = path.join(__dirname, 'api');

// قراءة جميع الملفات داخل مجلد api
const files = fs.readdirSync(apiFolder).filter(f => f.endsWith('.js'));

// تسجيل كل ملف كـ Endpoint تلقائي
for (const file of files) {
  const routeName = file.replace('.js', '');
  const routePath = `/api/${routeName}`;
  const { default: router } = await import(path.join(apiFolder, file));

  if (router) {
    app.use(routePath, router);
    console.log(`✅ تم تحميل ${routePath}`);
  } else {
    console.warn(`⚠️ الملف ${file} لا يحتوي على export default router`);
  }
}

// مسار افتراضي للصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    status: true,
    message: '🚀 السيرفر يعمل بنجاح!',
    routes: files.map(f => `/api/${f.replace('.js', '')}`)
  });
});

// تشغيل السيرفر (محليًا أو على Vercel)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 السيرفر يعمل على http://localhost:${PORT}`));

export default app; // ضروري لـ Vercel