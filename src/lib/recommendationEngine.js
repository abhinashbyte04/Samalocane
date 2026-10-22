/**
 * Samālōcane Non-Diagnostic Rule-Based Specialty Routing Engine
 * Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas
 *
 * STRICT GOVERNANCE & ETHICAL BOUNDARIES:
 * 1. This engine does NOT diagnose medical conditions or diseases.
 * 2. It matches self-reported symptom keywords to appropriate physician specialties.
 * 3. It provides an immediate urgent-safety pathway for acute emergency symptoms.
 * 4. It strictly queries verified doctors (is_verified = true) and never invents ratings.
 */

const { query } = require('./db');

// Clinically reviewed Urgent Emergency Symptom Triggers
const URGENT_EMERGENCY_RULES = [
  {
    category: 'Cardiovascular / Heart Attack',
    triggers: [
      'acute chest pain',
      'chest pain radiating',
      'chest pain radiating to arm',
      'chest pain radiating to left arm',
      'chest pain radiating to jaw',
      'severe crushing chest pain',
      'crushing chest pain',
      'chest tightness with sweating',
      'crushing pressure on chest',
      'chest pain and left arm numbness'
    ],
    guidance: 'CRITICAL EMERGENCY: Symptoms suggest potential acute cardiac event or heart attack. Immediately call 108 or 112, or proceed to the nearest Taluka Hospital Casualty.'
  },
  {
    category: 'Acute Respiratory Distress',
    triggers: [
      'cannot breathe',
      'unable to breathe',
      'gasping for air',
      'severe breathing difficulty',
      'lips turning blue',
      'fingernails turning blue',
      'choking',
      'severe stridor'
    ],
    guidance: 'CRITICAL EMERGENCY: Severe respiratory distress detected. Seek immediate in-person emergency care at your nearest Community Health Centre or dial 108.'
  },
  {
    category: 'Neurological / Stroke (FAST Signs)',
    triggers: [
      'sudden facial drooping',
      'face drooping',
      'facial drooping',
      'sudden arm weakness',
      'arm weakness',
      'slurred speech',
      'sudden paralysis on one side',
      'loss of consciousness',
      'sudden severe confusion',
      'unresponsive',
      'fainted and not waking up'
    ],
    guidance: 'CRITICAL EMERGENCY: Potential acute stroke or neurological emergency detected (FAST signs). Every minute is vital. Transport immediately to a hospital with emergency trauma/CT facilities or dial 108.'
  },
  {
    category: 'Severe Trauma & Hemorrhage',
    triggers: [
      'severe uncontrolled bleeding',
      'spurting blood',
      'head injury with vomiting',
      'coughing large amounts of blood',
      'deep open wound'
    ],
    guidance: 'CRITICAL EMERGENCY: Severe bleeding or major trauma requires immediate surgical or emergency stabilization. Dial 108 or proceed to the nearest emergency ward.'
  },
  {
    category: 'Anaphylaxis / Severe Allergy',
    triggers: [
      'anaphylaxis',
      'swelling of tongue and difficulty breathing',
      'swelling of throat and wheezing',
      'lip swelling and unable to breathe',
      'severe allergic reaction',
      'throat closing up'
    ],
    guidance: 'CRITICAL EMERGENCY: Signs of severe acute allergic reaction (Anaphylaxis). Requires urgent adrenaline/epinephrine treatment. Contact local emergency medical services or 108 immediately.'
  }
];

// Documented Keyword-to-Specialty Mapping
const SPECIALTY_KEYWORD_RULES = [
  {
    specialtyName: 'Dermatology',
    keywords: [
      'rash', 'rashes', 'skin rash', 'itching', 'itchy skin', 'fungal infection',
      'ringworm', 'eczema', 'skin redness', 'boils', 'allergy rash', 'blisters',
      'scabies', 'hives', 'psoriasis', 'scaling skin', 'dermatitis', 'dry itchy skin',
      'skin peel', 'patches on skin', 'acne', 'pimples', 'skin fungal'
    ],
    matchExplanation: 'Stated concerns relate to cutaneous, dermal, or fungal skin presentations.'
  },
  {
    specialtyName: 'Pulmonology / Respiratory',
    keywords: [
      'chronic cough', 'wheezing', 'asthma', 'breathlessness', 'chest congestion',
      'phlegm', 'difficulty breathing', 'bronchitis', 'persistent cough', 'cough for weeks',
      'shallow breathing', 'whistling breath', 'chest heaviness', 'morning phlegm'
    ],
    matchExplanation: 'Stated concerns relate to the bronchial, airway, or respiratory system.'
  },
  {
    specialtyName: 'Pediatrics',
    keywords: [
      'child fever', 'infant rash', 'child vomiting', 'baby crying', 'immunization',
      'toddler cough', 'child appetite', 'colic', 'newborn', 'infant', 'toddler',
      'child diarrhea', 'vaccination advice', 'baby not feeding', 'pediatric'
    ],
    matchExplanation: 'Stated concerns relate to infants, children, or developmental pediatric health.'
  },
  {
    specialtyName: 'Orthopedics',
    keywords: [
      'joint pain', 'knee pain', 'back pain', 'sprain', 'fracture', 'swelling in joints',
      'shoulder pain', 'neck stiffness', 'arthritis', 'muscle strain', 'ankle twist',
      'hip pain', 'bone pain', 'ligament', 'backache', 'knee swelling'
    ],
    matchExplanation: 'Stated concerns relate to the musculoskeletal, joint, or bone structures.'
  },
  {
    specialtyName: 'Gynecology & Obstetrics',
    keywords: [
      'pregnancy advice', 'menstrual cramps', 'irregular periods', 'pelvic pain',
      'nausea in pregnancy', 'prenatal care', 'maternal', 'vaginal discharge',
      'heavy bleeding period', 'missed period', 'breast tenderness', 'postpartum'
    ],
    matchExplanation: 'Stated concerns relate to reproductive, obstetric, or gynecological health.'
  },
  {
    specialtyName: 'ENT / Otolaryngology',
    keywords: [
      'ear pain', 'ear discharge', 'hearing loss', 'sore throat', 'sinusitis',
      'nasal blockage', 'throat pain', 'hoarseness', 'ear ringing', 'vertigo',
      'ear itching', 'tonsils', 'blocked nose', 'nasal drip'
    ],
    matchExplanation: 'Stated concerns relate to ear, nose, throat, or auditory structures.'
  },
  {
    specialtyName: 'General Medicine',
    keywords: [
      'fever', 'headache', 'body ache', 'weakness', 'fatigue', 'cough', 'cold',
      'vomiting', 'diarrhea', 'infection', 'chills', 'flu', 'stomach ache',
      'nausea', 'mild dizziness', 'low energy', 'indigestion', 'acidity', 'constipation'
    ],
    matchExplanation: 'Stated concerns are systemic or primary care symptoms suited for initial physician triage.'
  }
];

/**
 * Normalizes user text: lowercase, trims whitespace, standardizes separators
 */
function normalizeSymptomText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks for urgent red-flag symptoms
 */
function checkUrgentSafetyPathway(normalizedText) {
  for (const rule of URGENT_EMERGENCY_RULES) {
    for (const trigger of rule.triggers) {
      if (normalizedText.includes(trigger)) {
        return {
          isUrgent: true,
          category: rule.category,
          matchedTrigger: trigger,
          guidance: rule.guidance
        };
      }
    }
  }
  return { isUrgent: false };
}

/**
 * Scores and matches symptoms to relevant specialties
 */
function matchSpecialties(normalizedText) {
  const matches = [];

  for (const rule of SPECIALTY_KEYWORD_RULES) {
    let score = 0;
    const matchedKeywords = [];

    for (const keyword of rule.keywords) {
      // Word boundary match preferred
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(normalizedText)) {
        score += 3;
        matchedKeywords.push(keyword);
      } else if (normalizedText.includes(keyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    if (score > 0) {
      matches.push({
        specialtyName: rule.specialtyName,
        score,
        matchedKeywords: Array.from(new Set(matchedKeywords)),
        explanation: rule.matchExplanation
      });
    }
  }

  // Sort by highest keyword matching score
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Main Service: recommendDoctors
 * Returns ranked suggestions with explanation and verified eligible doctors
 */
async function recommendDoctors(symptomsText, options = {}) {
  const normalizedText = normalizeSymptomText(symptomsText);

  if (!normalizedText) {
    return {
      success: false,
      isUrgent: false,
      message: 'Please provide a description of the symptoms or health concerns you are experiencing.',
      suggestions: [],
      eligibleDoctors: [],
      disclaimer: 'This service is an informational specialty-routing aid, NOT a clinical diagnosis.'
    };
  }

  // 1. URGENT SAFETY PATHWAY (Prioritized over any matching)
  const urgentCheck = checkUrgentSafetyPathway(normalizedText);
  if (urgentCheck.isUrgent) {
    const notice = {
      category: urgentCheck.category,
      triggerPhrase: urgentCheck.matchedTrigger,
      guidance: urgentCheck.guidance,
      emergencyHotlines: [
        { name: 'National Emergency Ambulance', number: '108' },
        { name: 'National Emergency Service', number: '112' }
      ]
    };

    return {
      success: true,
      isUrgent: true,
      emergencyNotice: notice,
      urgentDetails: notice,
      message: 'POTENTIAL EMERGENCY DETECTED: Symptoms described warrant immediate in-person emergency care.',
      suggestions: [],
      eligibleDoctors: [],
      disclaimer: 'URGENT MEDICAL NOTICE: This automated screening identified potential emergency indicators. Telemedicine cannot replace in-person resuscitation or acute stabilization.'
    };
  }

  // 2. Specialty Matching
  const matches = matchSpecialties(normalizedText);

  // 3. Fallback Handling for Ambiguous or Unmatched Symptoms
  let primaryMatch = null;
  let secondaryMatches = [];
  let isFallback = false;

  if (matches.length === 0) {
    isFallback = true;
    primaryMatch = {
      specialtyName: 'General Medicine',
      score: 0,
      matchedKeywords: [],
      explanation: 'No specific specialty keywords detected. Routed to General Medicine for comprehensive initial primary care triage.'
    };
  } else {
    primaryMatch = matches[0];
    secondaryMatches = matches.slice(1, 3);
  }

  // 4. Retrieve Eligible Verified Doctors from Database
  // Enforces server-side is_verified = TRUE check strictly!
  let doctorQuery = `
    SELECT 
      u.id AS doctor_user_id,
      u.full_name,
      u.email,
      u.avatar_url,
      dp.id AS profile_id,
      dp.qualification,
      dp.specialty_name,
      dp.council_registration_number,
      dp.council_name,
      dp.experience_years,
      dp.bio,
      dp.consultation_fee,
      dp.languages_spoken,
      dp.is_available,
      dp.consultation_modes,
      dp.is_verified
    FROM users u
    JOIN doctor_profiles dp ON u.id = dp.user_id
    WHERE dp.is_verified = TRUE
  `;
  const params = [];

  // Filter to primary suggested specialty if not ambiguous
  if (!isFallback) {
    params.push(`%${primaryMatch.specialtyName}%`);
    doctorQuery += ` AND dp.specialty_name ILIKE $${params.length}`;
  }

  // Filter consultation mode preference if requested
  if (options.consultationMode) {
    params.push(options.consultationMode);
    doctorQuery += ` AND $${params.length} = ANY(dp.consultation_modes)`;
  }

  // Order by actual availability (Online first), then clinical experience
  doctorQuery += ` ORDER BY dp.is_available DESC, dp.experience_years DESC LIMIT 10`;

  let eligibleDoctors = [];
  try {
    const docRes = await query(doctorQuery, params);
    eligibleDoctors = docRes.rows;
  } catch (err) {
    console.error('[Recommendation Engine DB Error]', err);
  }

  return {
    success: true,
    isUrgent: false,
    inputSymptoms: symptomsText,
    normalizedText,
    isFallback,
    primarySpecialty: {
      name: primaryMatch.specialtyName,
      explanation: primaryMatch.explanation,
      matchedKeywords: primaryMatch.matchedKeywords
    },
    secondarySpecialties: secondaryMatches.map(m => ({
      name: m.specialtyName,
      explanation: m.explanation,
      matchedKeywords: m.matchedKeywords
    })),
    eligibleDoctors,
    disclaimer: 'DISCLAIMER: Suggestions are informational specialty-routing recommendations based on your reported keywords. They do NOT constitute an automated medical or disease diagnosis. You may browse all verified doctors in the full directory.'
  };
}

module.exports = {
  recommendDoctors,
  normalizeSymptomText,
  checkUrgentSafetyPathway,
  matchSpecialties,
  URGENT_EMERGENCY_RULES,
  SPECIALTY_KEYWORD_RULES
};
