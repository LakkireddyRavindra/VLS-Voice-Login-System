const { body } = require('express-validator');

exports.validateAudio = [
    body('userId').isMongoId(),
    (req, res, next) => {
        if (!req.files?.voice) {
            return res.status(400).json({ error: 'Voice sample required' });
        }
        next();
    }
];