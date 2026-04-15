const express = require('express');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');


const ffmpeg = require('@ffmpeg-installer/ffmpeg');
process.env.FFMPEG_PATH = ffmpeg.path;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
fs.ensureDirSync(DOWNLOAD_DIR);


setInterval(() => {
  fs.emptyDir(DOWNLOAD_DIR, err => {
    if (!err) console.log('🧹 Downloads folder cleared');
  });
}, 1000 * 60 * 5);
 
function detectPlatform(url) {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
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
      addHeader: ['referer:facebook.com', 'user-agent:Mozilla/5.0']
    });

    const duration = info.duration
      ? `${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2, '0')}`
      : null;

    res.json({
      title: info.title || 'Video',
      thumbnail: info.thumbnail || null,
      duration,
      platform,
      author: info.uploader || info.channel || '@user',
      formats: [
        { quality: 'HD 1080p', format: 'mp4', size: '~50MB' },
        { quality: 'HD 720p', format: 'mp4', size: '~25MB' },
        { quality: 'SD 480p', format: 'mp4', size: '~12MB' },
        { quality: 'Audio MP3', format: 'mp3', size: '~3MB' }
      ]
    });
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: 'ভিডিও info আনতে ব্যর্থ। URL টি চেক করুন।' });
  }
});


app.get('/api/download', async (req, res) => {
  const { url, quality } = req.query;
  if (!url) return res.status(400).send('URL দাও');

  const isAudio = quality === 'Audio MP3';
  const ext = isAudio ? 'mp3' : 'mp4';
  const fileName = `vidsnap-${Date.now()}.${ext}`;
  const filePath = path.join(DOWNLOAD_DIR, fileName);


  let formatStr = 'best[ext=mp4]/best';
  if (quality === 'HD 1080p') formatStr = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
  else if (quality === 'HD 720p') formatStr = 'bestvideo[height<=720]+bestaudio/best[height<=720]/best';
  else if (quality === 'SD 480p') formatStr = 'bestvideo[height<=480]+bestaudio/best[height<=480]/best';
  else if (isAudio) formatStr = 'bestaudio/best';

  try {
    await youtubedl(url, {
      output: filePath,
      format: formatStr,
      noCheckCertificates: true,
      ffmpegLocation: ffmpeg.path,
      mergeOutputFormat: isAudio ? undefined : 'mp4',
      extractAudio: isAudio || undefined,
      audioFormat: isAudio ? 'mp3' : undefined,
      addHeader: ['referer:facebook.com', 'user-agent:Mozilla/5.0']
    });


    res.download(filePath, fileName, () => {
      setTimeout(() => fs.remove(filePath), 10000);
    });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).send('❌ ডাউনলোড ব্যর্থ। আবার চেষ্টা করুন।');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 VidSnap Pro চলছে!`);
  console.log(`👉 Browser এ যাও → http://localhost:${PORT}\n`);
});
