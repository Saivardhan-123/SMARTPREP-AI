const config = {
    development: {
        baseURL: 'http://localhost:3000',
        httpReferer: 'http://localhost:3000'
    },
    production: {
        baseURL: 'https://smartprep-ai-work.onrender.com',
        httpReferer: 'https://smartprep-ai-work.onrender.com'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
