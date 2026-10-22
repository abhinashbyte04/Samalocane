const { withRoleAuth } = require('../../../lib/rbac');
const { query } = require('../../../lib/db');

// Valid inclusive gender options
const VALID_GENDERS = ['Female', 'Male', 'Non-binary', 'Transgender', 'Other', 'Prefer not to say'];
const VALID_SEVERITIES = ['Mild', 'Moderate', 'Severe'];

async function handler(req, res) {
  const userId = req.user.id;

  // 1. GET Patient Profile
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM patient_profiles WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(200).json({
          profile: null,
          isFirstTime: true,
          message: 'No health profile found. Please complete your initial health background.'
        });
      }

      const profile = result.rows[0];

      // Calculate age dynamically from DOB to avoid stale/inconsistent age data
      let calculatedAge = null;
      if (profile.dob) {
        const birthDate = new Date(profile.dob);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      return res.status(200).json({
        profile: {
          ...profile,
          calculated_age: calculatedAge
        },
        isFirstTime: false
      });
    } catch (err) {
      console.error('[Patient Profile GET Error]', err);
      return res.status(500).json({ error: 'DatabaseError', message: 'Failed to retrieve health record.' });
    }
  }

  // 2. PUT / Update Patient Profile
  if (req.method === 'PUT') {
    try {
      const {
        dob,
        gender,
        phoneNumber,
        taluka,
        district,
        currentSymptoms,
        symptomDuration,
        symptomSeverity,
        previousMedicalHistory,
        chronicConditions,
        currentMedications,
        allergies,
        emergencyContactName,
        emergencyContactPhone
      } = req.body || {};

      // Server-Side Input Validation
      if (!taluka || typeof taluka !== 'string' || !taluka.trim()) {
        return res.status(400).json({ error: 'ValidationError', message: 'Taluka is required for regional healthcare routing.' });
      }

      if (!district || typeof district !== 'string' || !district.trim()) {
        return res.status(400).json({ error: 'ValidationError', message: 'District is required.' });
      }

      // DOB validation
      if (dob) {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({ error: 'ValidationError', message: 'Invalid Date of Birth format.' });
        }
        if (birthDate > new Date()) {
          return res.status(400).json({ error: 'ValidationError', message: 'Date of Birth cannot be in the future.' });
        }
      }

      // Gender validation
      if (gender && !VALID_GENDERS.includes(gender)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Gender must be one of: ${VALID_GENDERS.join(', ')}`
        });
      }

      // Severity validation
      if (symptomSeverity && !VALID_SEVERITIES.includes(symptomSeverity)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Symptom severity must be one of: ${VALID_SEVERITIES.join(', ')}`
        });
      }

      // Phone format validation (if provided)
      if (phoneNumber && phoneNumber.trim()) {
        const phoneRegex = /^[+]?[\d\s-]{8,15}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
          return res.status(400).json({ error: 'ValidationError', message: 'Invalid mobile phone number format.' });
        }
      }

      // Upsert into database
      const upsertSql = `
        INSERT INTO patient_profiles (
          user_id, dob, gender, phone_number, taluka, district,
          current_symptoms, symptom_duration, symptom_severity,
          previous_medical_history, chronic_conditions, current_medications,
          allergies, emergency_contact_name, emergency_contact_phone, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          dob = EXCLUDED.dob,
          gender = EXCLUDED.gender,
          phone_number = EXCLUDED.phone_number,
          taluka = EXCLUDED.taluka,
          district = EXCLUDED.district,
          current_symptoms = EXCLUDED.current_symptoms,
          symptom_duration = EXCLUDED.symptom_duration,
          symptom_severity = EXCLUDED.symptom_severity,
          previous_medical_history = EXCLUDED.previous_medical_history,
          chronic_conditions = EXCLUDED.chronic_conditions,
          current_medications = EXCLUDED.current_medications,
          allergies = EXCLUDED.allergies,
          emergency_contact_name = EXCLUDED.emergency_contact_name,
          emergency_contact_phone = EXCLUDED.emergency_contact_phone,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const conditionsArray = Array.isArray(chronicConditions) ? chronicConditions : [];

      const result = await query(upsertSql, [
        userId,
        dob || null,
        gender || 'Female',
        phoneNumber ? phoneNumber.trim() : '',
        taluka.trim(),
        district.trim(),
        currentSymptoms ? currentSymptoms.trim() : '',
        symptomDuration ? symptomDuration.trim() : '',
        symptomSeverity || 'Moderate',
        previousMedicalHistory ? previousMedicalHistory.trim() : '',
        conditionsArray,
        currentMedications ? currentMedications.trim() : '',
        allergies ? allergies.trim() : '',
        emergencyContactName ? emergencyContactName.trim() : '',
        emergencyContactPhone ? emergencyContactPhone.trim() : ''
      ]);

      const saved = result.rows[0];

      return res.status(200).json({
        message: 'Patient health profile saved successfully.',
        profile: saved
      });
    } catch (err) {
      console.error('[Patient Profile PUT Error]', err);
      return res.status(500).json({ error: 'SaveFailed', message: 'Failed to update health record.' });
    }
  }

  return res.status(405).json({ error: 'MethodNotAllowed' });
}

export default withRoleAuth(['patient', 'admin'], handler);
