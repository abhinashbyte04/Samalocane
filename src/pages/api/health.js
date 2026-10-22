const { isPostgresConnected } = require('../../lib/db');

export default function handler(req, res) {
  res.status(200).json({
    status: 'UP',
    platform: 'Samālōcane Telemedicine System',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: 'PostgreSQL',
      isLiveConnected: isPostgresConnected(),
      mode: isPostgresConnected() ? 'Live Pool' : 'Safe In-Memory Dev Store'
    },
    version: '1.0.0-phase1-foundation'
  });
}

