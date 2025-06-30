const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { validateRegister, validateLogin } = require('../middleware/validate');
// Already imported: validateRegister, validateLogin


// 🆕 POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
    try {
        const { email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const user = new User({ email, password });
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            userId: user._id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔐 POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password +refreshToken');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ accessToken, refreshToken, userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔁 POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ error: 'Refresh token expired or invalid' });
    }
});

// 🚪 POST /api/auth/logout
router.post('/logout', async (req, res) => {
    const { userId } = req.body;
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    res.status(200).json({ message: 'Logged out' });
});

module.exports = router;
