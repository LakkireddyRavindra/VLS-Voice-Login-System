const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ==========================
// 1. User Schema
// ==========================
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  voiceEnrolled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  refreshToken: {
    type: String,
    select: false,
  },
});

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Voice enrolled check
userSchema.methods.isVoiceEnrolled = function () {
  return this.voiceEnrolled;
};

// ==========================
// 2. Voice Profile Schema
// ==========================
const voiceProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  enrolledPhrase: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ==========================
// 3. Export Models
// ==========================
const User = mongoose.model('User', userSchema);
const VoiceProfile = mongoose.model('VoiceProfile', voiceProfileSchema);

module.exports = { User, VoiceProfile };
