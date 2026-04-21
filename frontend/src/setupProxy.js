const { createProxyMiddleware } = require('http-proxy-middleware');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  || 'http://localhost:8081';

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_BASE_URL,
      changeOrigin: true,
    })
  );
};
