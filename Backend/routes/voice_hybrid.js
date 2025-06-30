const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cosine = require('compute-cosine-similarity');
const FormData = require('form-data');
const fs = require('fs');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 🎙️ VOICE ENROLLMENT (NO manual passphrase)
router.post('/voice-enroll', upload.single('voice'), async (req, res) => {
  const userId = req.body?.userId;

  if (!userId || !req.file) {
    return res.status(400).json({ error: 'Missing userId or voice file' });
  }

  if (!req.file.originalname.toLowerCase().endsWith('.wav')) {
    return res.status(400).json({ error: 'Only .wav files are supported' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    // 🔄 Transcribe speech
    console.log('🧠 STT: Transcribing...');
    const form1 = new FormData();
    form1.append('voice', fs.createReadStream(req.file.path));

    const sttResponse = await axios.post('http://127.0.0.1:5001/stt', form1, {
      headers: form1.getHeaders(),
      timeout: 15000
    });
    const sttText = sttResponse.data.text?.trim().toLowerCase();
    console.log('📝 Transcribed Text:', sttText);

    // 🔄 Voiceprint embedding
    console.log('🎯 Extracting voice embedding...');
    const form2 = new FormData();
    form2.append('voice', fs.createReadStream(req.file.path));

    const vpResponse = await axios.post('http://127.0.0.1:5002/voiceprint', form2, {
      headers: form2.getHeaders(),
      timeout: 120000
    });
    const embedding = vpResponse.data.embedding;

    // Save to DB
    user.enrolledPhrase = sttText;
    user.voiceEmbedding = embedding;
    user.voiceEnrolled = true;
    await user.save();

    res.json({
      status: 'success',
      message: '✅ Voice enrolled successfully',
      phrase: sttText
    });

  } catch (err) {
    console.error('❌ Enrollment error:', err.message);
    res.status(500).json({ status: 'error', message: 'Voice enrollment failed. Check logs.' });
  } finally {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

// 🔐 VOICE LOGIN
router.post('/voice-login', upload.single('voice'), async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId).select('+voiceEmbedding');
  if (!user || !req.file || !user.voiceEmbedding) {
    return res.status(400).json({ status: 'error', message: 'Invalid user or missing voice data' });
  }

  try {
    console.log('🎯 Matching voice embedding...');
    const form = new FormData();
    form.append('voice', fs.createReadStream(req.file.path));

    const vpResponse = await axios.post('http://127.0.0.1:5002/voiceprint', form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    const similarity = cosine(user.voiceEmbedding, vpResponse.data.embedding);
    console.log(`✅ Similarity score: ${similarity.toFixed(4)}`);

    const isVerified = similarity >= 0.75;
    res.json({
      status: isVerified ? 'success' : 'failure',
      similarity: similarity.toFixed(4),
      message: isVerified
        ? '🎉 Voice login successful!'
        : '❌ Voiceprint did not match. Try again with clearer audio.'
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ status: 'error', message: 'Voice login failed. Check logs.' });
  } finally {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

module.exports = router;
