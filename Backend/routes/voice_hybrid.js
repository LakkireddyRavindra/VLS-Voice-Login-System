const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cosine = require('compute-cosine-similarity');
const FormData = require('form-data');
const fs = require('fs');
const { User, VoiceProfile } = require('../models/User');
const jwt = require('jsonwebtoken');
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

  const user = await User.findOne({ email: userId });
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

    // 🔄 Upsert VoiceProfile
    await VoiceProfile.findOneAndUpdate(
      { userId: user._id },
      { embedding, enrolledPhrase: sttText },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(user._id, { voiceEnrolled: true });
    console.log('✅ Voice profile updated for user:', user._id);

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
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Missing voice file' });
  }

  try {
    // 🔍 Extract embedding from voice using voiceprint service
    const form = new FormData();
    form.append('voice', fs.createReadStream(req.file.path));
    const vpResponse = await axios.post('http://127.0.0.1:5002/voiceprint', form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    const inputEmbedding = vpResponse.data.embedding;

    // 🧠 Compare against all stored voice profiles
    const allProfiles = await VoiceProfile.find({});
    const matches = [];

    allProfiles.forEach(profile => {
      const sim = cosine(profile.embedding, inputEmbedding);
      if (sim >= 0.93) {
        matches.push({ userId: profile.userId, similarity: sim });
      }
    });

    // 🧾 No matches at all
    if (matches.length === 0) {
      return res.status(401).json({ status: 'error', message: 'No matching voice found' });
    }

    // ✅ SINGLE MATCH — Direct Login
    if (matches.length === 1) {
      const user = await User.findById(matches[0].userId);
      const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      user.refreshToken = refreshToken;
      await user.save();

      return res.json({
        status: 'success',
        accessToken,
        refreshToken,
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        similarity: matches[0].similarity
      });
    }

    // ❓ MULTIPLE MATCHES
    const providedEmail = req.body.userId?.toLowerCase();

    if (providedEmail) {
      // 🔍 Check if provided email matches any of the candidates
      const candidateUserIds = matches.map(m => m.userId.toString());
      const user = await User.findOne({
        _id: { $in: candidateUserIds },
        email: providedEmail
      });

      if (!user) {
        // 🚫 Email didn't match any of the multiple candidates
        return res.status(403).json({
          status: 'error',
          message: 'Email did not match any of the matched voice profiles.'
        });
      }

      // ✅ Match confirmed — proceed with login
      const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      user.refreshToken = refreshToken;
      await user.save();

      return res.json({
        status: 'success',
        accessToken,
        refreshToken,
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        similarity: 0.91 // or actual similarity from matched list
      });
    }

    // 🟡 Email not provided yet — prompt frontend
    return res.status(206).json({
      status: 'multiple_matches',
      message: 'Multiple voice matches found. Please provide your email to confirm identity.',
      candidates: matches.map(m => m.userId)
    });

  } catch (err) {
    console.error('❌ Voice login error:', err);
    res.status(500).json({ status: 'error', message: 'Voice login failed. Check logs.' });
  } finally {
    // 🧹 Clean up temporary voice file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});


module.exports = router;
