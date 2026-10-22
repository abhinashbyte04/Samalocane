const { recommendDoctors } = require('../../../lib/recommendationEngine');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'MethodNotAllowed' });
  }

  try {
    const { symptoms, consultationMode, taluka } = req.body || {};

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Please provide a description of the symptoms or health concerns.'
      });
    }

    const recommendation = await recommendDoctors(symptoms, {
      consultationMode,
      taluka
    });

    return res.status(200).json(recommendation);
  } catch (err) {
    console.error('[Recommendation API Error]', err);
    return res.status(500).json({
      error: 'ProcessingError',
      message: 'Failed to process symptom recommendation.'
    });
  }
}

