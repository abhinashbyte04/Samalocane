const { query } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  try {
    const { taluka } = req.query;
    const result = await query('SELECT * FROM phc_facilities');
    let facilities = result.rows;

    if (taluka) {
      facilities = facilities.filter(f => f.taluka.toLowerCase().includes(taluka.toLowerCase()));
    }

    return res.status(200).json({
      facilities,
      disclaimer: 'Emergency contact buttons invoke native cellular voice calls (GSM/CDMA). Internet connectivity is not required for telephone calls. In severe emergency, dial 108 immediately.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'DatabaseError', message: err.message });
  }
}

