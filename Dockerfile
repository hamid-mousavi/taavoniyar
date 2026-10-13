# =========================================================================
# Dockerfile برای ساخت و اجرای سامانه مسکن‌یار
# Node.js 22 LTS Alpine Base
# =========================================================================

FROM node:22-alpine AS runner

WORKDIR /app

# نصب ابزارهای ساخت در صورت نیاز
RUN apk add --no-cache libc6-compat

# کپی فایلهای وابستگی
COPY package*.json ./

# نصب پکیج‌ها با سازگاری peer dependencies
RUN npm install --legacy-peer-deps

# کپی کل سورس کد
COPY . .

# کامپایل و ساخت فرانت‌اند
RUN npm run build

# پورت اجرایی برنامه
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# اجرای سرور فول‌استک Express + Vite
CMD ["npm", "run", "start"]
