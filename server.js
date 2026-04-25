const express = require('express');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

// FFmpeg পাথ সেটআপ
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
process.env.FFMPEG_PATH = ffmpeg.path;

const app = express();
app.use(cors());
app.use(express.json());

// index.html যদি রুট ফোল্ডারে থাকে তবে path.join(__dirname) ব্যবহার করা নিরাপদ
app.use(express.static(__dirname)); 

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
fs.ensureDirSync(DOWNLOAD_DIR);

// প্রতি ৫ মিনিট পর পর ডাউনলোড ফোল্ডার পরিষ্কার করা
setInterval(() => {
  fs.emptyDir(DOWNLOAD_DIR, err => {
    if (!err) console.log('🧹 Downloads folder cleared');
  });
}, 1000 * 60 * 5);

function detectPlatform(url) {
  const lowUrl = url.toLowerCase();
  if (lowUrl.includes('tiktok.com')) return 'TikTok';
  if (lowUrl.includes('instagram.com')) return 'Instagram';
  if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.watch')) return 'Facebook';
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) return 'YouTube';
  if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com')) return 'Twitter/X';
  return 'Unknown';
}

app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL দাও' });

  const platform = detectPlatform(url);
  if (platform === 'Unknown') {
    return res.status(400).json({
      error: 'এই platform সাপোর্ট করে না। TikTok, Instagram, Facebook বা YouTube URL দাও।'
    });
  }

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      ffmpegLocation: ffmpeg.path,
      // User-Agent আপডেট করা হয়েছে যাতে ব্লক না করে
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
    });

    res.json({
      title: info.title || 'Video',
      thumbnail: info.thumbnail || null,
      duration: info.duration_string || null,
      platform,
      author: info.uploader || info.channel || '@user',
      formats: [
        { quality: 'HD 1080p', format: 'mp4', size: 'High' },
        { quality: 'HD 720p', format: 'mp4', size: 'Medium' },
        { quality: 'SD 480p', format: 'mp4', size: 'Small' },
        { quality: 'Audio MP3', format: 'mp3', size: 'Audio' }
      ]
    });
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: 'ভিডিও তথ্য পাওয়া যায়নি। লিঙ্কটি চেক করুন।' });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, quality } = req.query;
  if (!url) return res.status(400).send('URL দাও');

  const isAudio = quality === 'Audio MP3';
  const ext = isAudio ? 'mp3' : 'mp4';
  const fileName = `vidsnap-${Date.now()}.${ext}`;
  const filePath = path.join(DOWNLOAD_DIR, fileName);

  let formatStr = 'best';
  if (quality === 'HD 1080p') formatStr = 'bestvideo[height<=1080]+bestaudio/best';
  else if (quality === 'HD 720p') formatStr = 'bestvideo[height<=720]+bestaudio/best';
  else if (quality === 'SD 480p') formatStr = 'bestvideo[height<=480]+bestaudio/best';

  try {
    const dlOptions = {
      output: filePath,
      format: formatStr,
      noCheckCertificates: true,
      ffmpegLocation: ffmpeg.path,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
    };

    if (isAudio) {
      dlOptions.extractAudio = true;
      dlOptions.audioFormat = 'mp3';
    } else {
      dlOptions.mergeOutputFormat = 'mp4';
    }

    await youtubedl(url, dlOptions);

    if (fs.existsSync(filePath)) {
      res.download(filePath, fileName, (err) => {
        if (!err) {
          // ফাইল পাঠানোর ১০ সেকেন্ড পর ডিলিট করে দিবে যাতে স্পেস না ভরে যায়
          setTimeout(() => fs.remove(filePath).catch(e => console.log(e)), 10000);
        }
      });
    } else {
      res.status(500).send('ফাইল তৈরি হয়নি।');
    }
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).send('❌ ডাউনলোড ব্যর্থ। আবার চেষ্টা করুন।');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 VidSnap Pro running on port ${PORT}`);
});