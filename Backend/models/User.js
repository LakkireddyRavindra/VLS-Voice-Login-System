const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
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
    voiceProfileId: {
        type: String,
        select: false,
    },
    voiceEmbedding: {
        type: [Number],
        select: false,
    },
    enrolledPhrase: {
        type: String,
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

// 🔐 Password Hashing Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ✅ Compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// 🎙️ Voice status check
userSchema.methods.isVoiceEnrolled = function () {
    return this.voiceEnrolled;
};

module.exports = mongoose.model('User', userSchema);
