import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧩 تحميل جميع ملفات api (بما فيهم المجلدات الفرعية)
const loadApiRoutes = async (folderPath, baseRoute = "") => {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await loadApiRoutes(filePath, `${baseRoute}/${file}`);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    const routeName = `${baseRoute}/${file.replace(".js", "")}`;

    try {
      const module = await import(`file://${filePath}`);
      const handler = module.default;

      if (!handler) {
        console.warn(`⚠️ ${file} لا يحتوي على export default`);
        continue;
      }

      // 🧠 التحقق من نوع الـ export
      if (typeof handler === "function") {
        // نمط دالة (GET/POST)
        app.get(routeName, (req, res) => handler(req, res, "GET"));
        app.post(routeName, (req, res) => handler(req, res, "POST"));
        app.put(routeName, (req, res) => handler(req, res, "PUT"));
        app.delete(routeName, (req, res) => handler(req, res, "DELETE"));
        console.log(`✅ Function endpoint loaded: ${routeName}`);
      } else if (typeof handler === "object" && handler.stack && typeof handler.handle === "function") {
        // نمط Router Express
        app.use(routeName, handler);
        console.log(`🧭 Router endpoint loaded: ${routeName}`);
      } else {
        console.warn(`⚠️ ${file} تم تجاهله: export default غير صالح`);
      }
    } catch (err) {
      console.error(`❌ فشل تحميل ${file}:`, err.message);
    }
  }
};

// 🚀 تحميل جميع ملفات api
const apiRoot = path.join(__dirname, "api");
if (fs.existsSync(apiRoot)) {
  loadApiRoutes(apiRoot);
} else {
  console.warn("⚠️ مجلد api غير موجود!");
}

// صفحة افتراضية
app.get("/", (req, res) => res.send("🚀 dark API is running..."));

// 🔥 تشغيل السيرفر
app.listen(PORT, () => console.log(`🟢 Server started on http://localhost:${PORT}`));