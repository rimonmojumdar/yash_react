# 🎬 VidSnap Pro - Video Downloader

TikTok, Instagram, Facebook, YouTube থেকে watermark-free HD ভিডিও ডাউনলোড করুন।
✅ Windows | ✅ Mac | ✅ Linux — সব এ চলবে।

---

## চালানোর নিয়ম (সব OS এ একই)

### Step 1 — Node.js install আছে কিনা চেক করো
```
node -v
```
না থাকলে → https://nodejs.org থেকে install করো (LTS version)

---

### Step 2 — এই folder এ ঢুকো
```
cd vidsnap-pro
```

---

### Step 3 — Packages install করো (একবারই করতে হবে)
```
npm install
```

---

### Step 4 — চালাও
```
npm run dev
```

---

### Step 5 — Browser এ যাও
```
http://localhost:3000
```

🎉 তোমার website live!

---

## কেন সব OS এ চলবে?

| Feature | কিভাবে Cross-Platform |
|---|---|
| `yt-dlp-exec` | Windows/Mac/Linux এর জন্য আলাদা binary auto-download করে |
| `@ffmpeg-installer/ffmpeg` | ffmpeg Windows/Mac/Linux সব এ automatically install হয় |
| `Node.js` + `Express` | সব OS এ native চলে |

---

## Income এর জন্য (Google AdSense)

`public/index.html` ফাইলে `[Ad Space ...]` লেখা জায়গাগুলো replace করো:
```html

<div class="ad-inner">[Ad Space — 728×90 Leaderboard]</div>


<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXX"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## Production Deploy করতে (VPS/Server)
```
npm start
```
