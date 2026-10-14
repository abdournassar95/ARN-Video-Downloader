# دليل البدء السريع - Quick Start Guide

## الخطوات السريعة للبدء

### 1️⃣ تثبيت الاعتماديات

```bash
cd my-video-downloader
npm install
```

### 2️⃣ إعداد yt-dlp و ffmpeg

**الخيار الأسهل - استخدام النسخ المثبتة على النظام:**

```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install yt-dlp ffmpeg

# macOS
brew install yt-dlp ffmpeg

# Windows
# قم بتحميل الملفات من:
# yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
# ffmpeg: https://ffmpeg.org/download.html
```

**أو ضع الملفات في:** `resources/bin/`

### 3️⃣ تشغيل التطبيق

```bash
npm run dev
```

### 4️⃣ بناء للتوزيع

```bash
# بناء لجميع المنصات
npm run dist

# أو لمنصة محددة
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## 🎯 الاستخدام الأساسي

1. **ابحث**: اكتب كلمات بحث أو الصق رابط فيديو
2. **اختر**: انقر على الفيديو من نتائج البحث
3. **اضبط**: اختر الجودة ومسار الحفظ
4. **نزّل**: اضغط زر "تنزيل"

## ⚠️ ملاحظات مهمة

- تأكد من تثبيت yt-dlp و ffmpeg
- التطبيق يدعم اللغة العربية بشكل كامل
- يمكنك تنزيل عدة فيديوهات في نفس الوقت
- جميع التنزيلات تُحفظ في المجلد المحدد

## 🔗 روابط مفيدة

- [README الكامل](./README.md)
- [yt-dlp Releases](https://github.com/yt-dlp/yt-dlp/releases)
- [ffmpeg Downloads](https://ffmpeg.org/download.html)

## 🐛 مشاكل شائعة

**المشكلة**: yt-dlp لا يعمل
**الحل**: تأكد من تثبيته أو وضعه في `resources/bin/`

**المشكلة**: ffmpeg غير موجود
**الحل**: قم بتثبيته أو ضعه في `resources/bin/`

**المشكلة**: التنزيل بطيء
**الحل**: تحقق من الإنترنت أو جرب جودة أقل

---

استمتع بتنزيل الفيديوهات! 🎬
