const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const authenticateToken = require('../middleware/auth');

router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('firstName lastName email voiceEnrolled');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            voiceEnrolled: user.voiceEnrolled
        });
    } catch (err) {
        console.error('❌ Dashboard Fetch Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
