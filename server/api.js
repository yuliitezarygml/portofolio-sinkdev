const express = require('express');
const cors = require('cors');
const { getSystemStats } = require('./system-stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Request logs storage - shared between all servers
let requestLogs = [];

// Comprehensive request logging middleware - captures ALL requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Get real IP address
  const getRealIP = (req) => {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           'unknown';
  };

  const logEntry = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    method: req.method || 'UNKNOWN',
    url: req.originalUrl || req.url || '',
    ip: getRealIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || req.headers['referrer'] || '',
    host: req.headers['host'] || '',
    contentType: req.headers['content-type'] || '',
    contentLength: req.headers['content-length'] || 0,
    accept: req.headers['accept'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    connection: req.headers['connection'] || '',
    upgradeInsecureRequests: req.headers['upgrade-insecure-requests'] || '',
    secFetchSite: req.headers['sec-fetch-site'] || '',
    secFetchMode: req.headers['sec-fetch-mode'] || '',
    secFetchDest: req.headers['sec-fetch-dest'] || '',
    protocol: req.protocol || 'unknown',
    secure: req.secure,
    xhr: req.xhr,
    query: JSON.stringify(req.query || {}),
    params: JSON.stringify(req.params || {}),
    startTime: startTime
  };

  // Store the original end and json functions
  const originalEnd = res.end;
  const originalJson = res.json;

  // Override res.end to capture final status and response time
  res.end = function(chunk, encoding) {
    logEntry.status = res.statusCode;
    logEntry.responseTime = Date.now() - startTime;
    logEntry.responseSize = chunk ? chunk.length : 0;
    
    // Add to logs array (keep only last 200 entries for comprehensive logging)
    requestLogs.unshift(logEntry);
    if (requestLogs.length > 200) {
      requestLogs = requestLogs.slice(0, 200);
    }
    
    // Log to console for debugging
    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.status} - ${logEntry.responseTime}ms - ${logEntry.ip}`);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  // Override res.json to capture JSON responses
  res.json = function(body) {
    logEntry.responseType = 'json';
    logEntry.responseBody = typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500);
    originalJson.call(this, body);
  };

  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logs endpoint - provides comprehensive logging data
app.get('/api/request-logs', (req, res) => {
  try {
    res.json(requestLogs);
  } catch (error) {
    console.error('Request logs error:', error);
    res.status(500).json({ error: 'Failed to get request logs' });
  }
});

// System stats endpoint
app.get('/api/system-stats', (req, res) => {
  try {
    const stats = getSystemStats();
    if (stats) {
      res.json(stats);
    } else {
      res.status(500).json({ error: 'Failed to get system stats' });
    }
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;