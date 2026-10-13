# راهنمای استقرار سامانه با داکر (Docker & Docker Compose Deployment)
## استقرار PostgreSQL و سامانه مسکن‌یار روی سرور اختصاصی (VPS)

---

### ۱. پیش‌نیازها
- سیستم‌عامل لینوکس (Ubuntu 22.04 / 24.04 یا Debian 12)
- نصب بودن داکر و پلاگین Docker Compose:
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
  ```

---

### ۲. فایل‌های پیکربندی داکر
این پروژه شامل فایل‌های آماده زیر است:
- `docker-compose.yml`: تعریف کانتینر پایگاه داده PostgreSQL 16 Alpine، پنل مدیریتی گرافیکی pgAdmin 4 و وب‌اپلیکیشن مسکن‌یار
- `Dockerfile`: فایل ساخت تصویر بهینه‌سازی‌شده برای اجرای سرور Node.js/Express و فرانت‌اند React Vite
- `.dockerignore`: فیلتر کردن فایل‌های غیرضروری در مرحله build

---

### ۳. روش‌های استقرار

#### روش اول: اجرای پایگاه داده PostgreSQL به‌تنهایی با داکر (برای سرور یا محیط توسعه)
اگر می‌خواهید کانتینر PostgreSQL روی پورت 5432 فعال شود و برنامه را با Node/Vite به آن متصل کنید:
```bash
# راه‌اندازی دیتابیس در پس‌زمینه
docker compose up -d postgres pgadmin

# بررسی وضعیت سلامت کانتینر
docker compose ps
```

مشخصات دسترسی به دیتابیس:
- **پورت:** `5432`
- **نام کاربری:** `postgres`
- **کلمه عبور:** `maskanyar_secret_password`
- **نام دیتابیس:** `maskanyar`
- **کانکشن استرینگ استاندارد:**
  ```text
  postgresql://postgres:maskanyar_secret_password@localhost:5432/maskanyar
  ```
- **پنل مدیریت pgAdmin:** در پورت 5050 قابل دسترسی است (`http://YOUR_SERVER_IP:5050`)
  - ایمیل: `admin@maskanyar.ir`
  - کلمه عبور: `admin123`

---

#### روش دوم: اجرای کل بسته نرم‌افزاری (Full-Stack Containerization)
برای اجرای هم‌زمان پایگاه داده PostgreSQL و سامانه مسکن‌یار در داکر:
```bash
# ساخت ایمیج برنامه و اجرای تمام سرویس‌ها
docker compose up --build -d

# مشاهده لاگ‌ها
docker compose logs -f app
```
پس از اجرا، سامانه روی پورت 3000 در دسترس خواهد بود: `http://YOUR_SERVER_IP:3000`

---

### ۴. متغیرهای محیطی در فایل .env
در ریشه پروژه فایلی با نام `.env` بسازید و مقادیر زیر را در آن تنظیم کنید:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:maskanyar_secret_password@postgres:5432/maskanyar
GROQ_API_KEY=gsk_your_groq_api_key_here
```
