require('dotenv').config();

const config = {
    // Server configuration
    PORT: process.env.PORT || 8080,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Session configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'smartprep-default-secret-change-in-production',
    
    // API Keys
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    
    // Database configuration
    DB_PATH: process.env.DB_PATH || './smartprep.db',
    
    // Security settings
    COOKIE_SECURE: process.env.NODE_ENV === 'production',
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
};

module.exports = config;
