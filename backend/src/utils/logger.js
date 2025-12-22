const fs = require('fs');
const path = require('path');

// Simple production-ready logger
// Replaces console.log with structured logging

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
    error: (message, meta = {}) => {
        if (currentLevel >= LOG_LEVELS.ERROR) {
            console.error(formatMessage('ERROR', message, meta));
        }
    },

    warn: (message, meta = {}) => {
        if (currentLevel >= LOG_LEVELS.WARN) {
            console.warn(formatMessage('WARN', message, meta));
        }
    },

    info: (message, meta = {}) => {
        if (currentLevel >= LOG_LEVELS.INFO) {
            console.log(formatMessage('INFO', message, meta));
        }
    },

    debug: (message, meta = {}) => {
        if (currentLevel >= LOG_LEVELS.DEBUG) {
            console.log(formatMessage('DEBUG', message, meta));
        }
    },

    // Log HTTP requests
    request: (req) => {
        if (currentLevel >= LOG_LEVELS.DEBUG) {
            console.log(formatMessage('DEBUG', `${req.method} ${req.originalUrl}`, {
                ip: req.ip,
                userAgent: req.get('user-agent')?.substring(0, 50)
            }));
        }
    }
};

module.exports = logger;
