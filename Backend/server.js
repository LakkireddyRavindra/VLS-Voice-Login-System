require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice_hybrid');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

// 🔐 Global Error Handling
process.on('unhandledRejection', err => {
  console.error('💥 Unhandled Rejection:', err);
});
process.on('uncaughtException', err => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', voiceRoutes);

// 🔊 Dummy Voice Login Stub (If still used)
app.post('/api/voice-login', upload.single('voice'), async (req, res) => {
  try {
    const userId = req.body?.userId;
    if (!userId || !req.file) {
      return res.status(400).json({ error: 'Missing userId or voice file' });
    }

    const audioBuffer = fs.readFileSync(req.file.path);
    // NOTE: voiceProcessor.verifyVoice must be defined or removed
    const result = await voiceProcessor.verifyVoice(userId, audioBuffer);

    if (result.isVerified) {
      return res.status(200).json({ message: 'Voice verified', confidence: result.confidence });
    } else {
      return res.status(401).json({ message: 'Voice not recognized', confidence: result.confidence });
    }

  } catch (err) {
    console.error('🎤 Voice login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
