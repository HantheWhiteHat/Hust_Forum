const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attach user to request if Authorization header exists; do not block anonymous users
const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
  next();
};

module.exports = optionalAuth;
