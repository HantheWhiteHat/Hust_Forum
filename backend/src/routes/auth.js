const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const { registerValidation, loginValidation } = require('../middlewares/validation');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);

module.exports = router;
