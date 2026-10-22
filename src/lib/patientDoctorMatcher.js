/**
 * Deterministic Rule-Based Patient-to-Doctor Recommendation Matcher
 * Non-diagnostic clinical discovery aid for rural telemedicine.
 * ALL MATCHING RULES ARE TRANSPARENT, EXPLAINABLE, AND DETERMINISTIC.
 */

const { INITIAL_DEMO_DOCTORS } = require('../data/dummyDoctors');

// Clinically reviewed Urgent Emergency Symptom Triggers
const URGENT_EMERGENCY_TRIGGERS = [
  {
    category: 'Acute Cardiovascular / Heart Attack',
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
    guidance: 'CRITICAL EMERGENCY: Symptoms suggest potential acute cardiac event or heart attack. Immediately call 108 or 112, or proceed to the nearest Emergency PHC or Taluka Hospital Casualty.'
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
    category: 'Acute Stroke / Neurological Crisis (FAST Signs)',
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
    guidance: 'CRITICAL EMERGENCY: Potential acute stroke or neurological crisis detected. Every minute is vital. Transport immediately to an emergency hospital with CT facilities or dial 108.'
  },
  {
    category: 'Severe Trauma & Uncontrolled Bleeding',
    triggers: [
      'severe uncontrolled bleeding',
      'spurting blood',
      'head injury with vomiting',
      'coughing large amounts of blood',
      'deep open wound with severe bleeding'
    ],
    guidance: 'CRITICAL EMERGENCY: Severe hemorrhage or major trauma requires immediate surgical or casualty stabilization. Dial 108 or proceed to the nearest emergency ward.'
  },
  {
    category: 'Severe Anaphylaxis / Airway Compromise',
    triggers: [
      'anaphylaxis',
      'swelling of tongue and difficulty breathing',
      'swelling of throat and wheezing',
      'lip swelling and unable to breathe',
      'throat closing up'
    ],
    guidance: 'CRITICAL EMERGENCY: Signs of severe acute allergic reaction (Anaphylaxis). Requires urgent adrenaline treatment. Contact local emergency medical services or 108 immediately.'
  }
];

// Specialty keyword routing rules
const SPECIALTY_RULES = [
  {
    specialtyName: 'Dermatology',
    keywords: [
      'rash', 'rashes', 'skin rash', 'itching', 'itchy skin', 'fungal infection',
      'ringworm', 'eczema', 'skin redness', 'boils', 'blisters', 'scabies',
      'hives', 'psoriasis', 'scaling skin', 'dermatitis', 'dry itchy skin',
      'skin peel', 'patches on skin', 'acne', 'pimples', 'contact dermatitis',
      'cutaneous', 'urticaria'
    ],
    explanation: 'Specializes in cutaneous, dermal, and high-humidity fungal skin conditions.'
  },
  {
    specialtyName: 'Pulmonology / Respiratory',
    keywords: [
      'chronic cough', 'wheezing', 'asthma', 'breathlessness', 'chest congestion',
      'phlegm', 'bronchitis', 'persistent cough', 'cough for weeks', 'shallow breathing',
      'whistling breath', 'chest heaviness', 'morning phlegm', 'respiratory'
    ],
    explanation: 'Specializes in bronchial asthma, COPD, and airway respiratory disorders.'
  },
  {
    specialtyName: 'Pediatrics',
    keywords: [
      'child fever', 'infant rash', 'child vomiting', 'baby crying', 'immunization',
      'toddler cough', 'child appetite', 'colic', 'newborn', 'infant', 'toddler',
      'child diarrhea', 'vaccination advice', 'baby not feeding', 'pediatric',
      'tonsillitis', 'childhood fever'
    ],
    explanation: 'Specializes in neonatal care, infant development, and childhood illnesses.'
  },
  {
    specialtyName: 'Orthopedics',
    keywords: [
      'joint pain', 'knee pain', 'back pain', 'sprain', 'fracture', 'swelling in joints',
      'shoulder pain', 'neck stiffness', 'arthritis', 'osteoarthritis', 'muscle strain',
      'ankle twist', 'hip pain', 'bone pain', 'ligament', 'backache', 'knee swelling',
      'spondylosis', 'radiculopathy', 'sciatica', 'trail injury'
    ],
    explanation: 'Specializes in musculoskeletal conditions, joint degeneration, and spine care.'
  },
  {
    specialtyName: 'Cardiology',
    keywords: [
      'hypertension', 'high blood pressure', 'blood pressure', 'palpitations',
      'heart disease', 'irregular heartbeat', 'angina', 'cardiac', 'cholesterol',
      'post-angioplasty', 'ecg review', 'heart check'
    ],
    explanation: 'Specializes in cardiovascular wellness, hypertension, and cardiac tele-monitoring.'
  },
  {
    specialtyName: 'Neurology',
    keywords: [
      'headache', 'migraine', 'aura', 'seizure', 'epilepsy', 'dizziness',
      'numbness', 'tingling in fingers', 'tremors', 'neuropathy', 'facial pain',
      'nerve pain', 'chronic headache', 'throbbing head'
    ],
    explanation: 'Specializes in headache disorders, seizure management, and peripheral neuropathies.'
  },
  {
    specialtyName: 'Gynecology & Obstetrics',
    keywords: [
      'pregnancy advice', 'menstrual cramps', 'irregular periods', 'pelvic pain',
      'nausea in pregnancy', 'prenatal care', 'maternal', 'vaginal discharge',
      'heavy bleeding period', 'missed period', 'breast tenderness', 'pcos',
      'menopause', 'antenatal'
    ],
    explanation: 'Specializes in obstetric care, high-risk maternal health, and gynecological wellness.'
  },
  {
    specialtyName: 'Psychiatry & Mental Health',
    keywords: [
      'stress', 'anxiety', 'depression', 'sleep problem', 'insomnia', 'counseling',
      'low mood', 'panic attack', 'substance', 'alcohol de-addiction', 'mental health',
      'nervousness', 'grief', 'restless sleep'
    ],
    explanation: 'Specializes in behavioral healthcare, anxiety/depression, and confidential tele-counseling.'
  },
  {
    specialtyName: 'General Surgery',
    keywords: [
      'wound', 'suture', 'hernia', 'surgical', 'ulcer', 'diabetic foot',
      'abscess', 'post-operative', 'dressing', 'wound infection', 'swelling groin'
    ],
    explanation: 'Specializes in surgical wound surveillance, suture care, and diabetic foot management.'
  },
  {
    specialtyName: 'General Medicine',
    keywords: [
      'fever', 'headache', 'body ache', 'weakness', 'fatigue', 'cough', 'cold',
      'vomiting', 'diarrhea', 'infection', 'chills', 'flu', 'stomach ache',
      'nausea', 'mild dizziness', 'low energy', 'indigestion', 'acidity',
      'constipation', 'diabetes', 'glucose', 'sugar', 'viral fever', 'seasonal illness'
    ],
    explanation: 'Specializes in comprehensive primary care triage and systemic adult medicine.'
  }
];

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks for acute emergency red-flags
 */
function checkEmergencySafety(normalizedText) {
  for (const rule of URGENT_EMERGENCY_TRIGGERS) {
    for (const trigger of rule.triggers) {
      if (normalizedText.includes(trigger)) {
        return {
          isUrgent: true,
          category: rule.category,
          triggerPhrase: trigger,
          guidance: rule.guidance
        };
      }
    }
  }
  return { isUrgent: false };
}

/**
 * Matches medical keywords against specialty rules
 */
function scoreSpecialties(normalizedText) {
  const matches = [];

  for (const rule of SPECIALTY_RULES) {
    let score = 0;
    const matchedKeywords = [];

    for (const keyword of rule.keywords) {
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
        explanation: rule.explanation
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Main Deterministic Matching Algorithm
 * @param {Object} patient - Patient data { age, gender, primaryCondition, allergies, notes, etc. }
 * @param {Object} options - { preferredLanguage, preferredMode, doctorsList }
 */
function matchPatientToDoctors(patient, options = {}) {
  const doctorsPool = options.doctorsList || INITIAL_DEMO_DOCTORS;
  
  // Combine clinical concern and relevant medical history for matching
  const rawMedicalText = [
    patient.primaryCondition || '',
    patient.currentSymptoms || '',
    patient.notes || ''
  ].join(' ');

  const normalizedMedical = normalizeText(rawMedicalText);

  // 1. EMERGENCY SAFETY SCREENING (Requirement D)
  const emergencyCheck = checkEmergencySafety(normalizedMedical);
  if (emergencyCheck.isUrgent) {
    return {
      isUrgent: true,
      category: emergencyCheck.category,
      triggerPhrase: emergencyCheck.triggerPhrase,
      guidance: emergencyCheck.guidance,
      emergencyHotlines: [
        { name: 'National Emergency Ambulance', number: '108' },
        { name: 'National Emergency Helpline', number: '112' }
      ],
      recommendedSpecialty: null,
      recommendations: [],
      matchExplanation: 'Potential critical medical emergency identified. Directing to in-person emergency facilities.'
    };
  }

  // 2. CHECK FOR INSUFFICIENT OR VAGUE INFORMATION (Requirement B)
  if (!normalizedMedical || normalizedMedical.length < 3) {
    // Return General Medicine options with clarification request
    const generalPhysicians = doctorsPool
      .filter(d => d.specialty_name === 'General Medicine' && d.verification_status === 'Verified')
      .slice(0, 3)
      .map(doc => ({
        doctor: doc,
        matchScore: 30,
        matchReasons: [
          'Comprehensive Primary Triage: Recommended for general physician evaluation due to non-specific health concern description.',
          `Available Modes: ${doc.consultation_modes.join(', ')}.`
        ]
      }));

    return {
      isUrgent: false,
      isInsufficientInfo: true,
      clarificationNotice: 'The entered medical concern is brief or non-specific. We suggest general physicians who can conduct a thorough baseline clinical interview.',
      recommendedSpecialty: 'General Medicine',
      recommendations: generalPhysicians,
      matchExplanation: 'Routed to General Medicine for broad initial health evaluation.'
    };
  }

  // 3. SPECIALTY KEYWORD MATCHING
  const specialtyMatches = scoreSpecialties(normalizedMedical);
  let targetSpecialty = 'General Medicine';
  let matchRationale = 'General Physician primary care evaluation.';
  let isFallback = false;

  // Age-related pediatric routing: if patient is a child (<= 14), prioritize Pediatrics unless specific specialty
  const isPediatricAge = typeof patient.age === 'number' && patient.age <= 14;

  if (isPediatricAge && (specialtyMatches.length === 0 || specialtyMatches[0].specialtyName === 'General Medicine')) {
    targetSpecialty = 'Pediatrics';
    matchRationale = `Age-Appropriate Care: Child patient (${patient.age} years) routed to pediatric specialist for specialized age-appropriate evaluation.`;
  } else if (specialtyMatches.length > 0) {
    targetSpecialty = specialtyMatches[0].specialtyName;
    matchRationale = `Targeted Specialty Match: Concern matches ${targetSpecialty} keywords (${specialtyMatches[0].matchedKeywords.join(', ')}).`;
  } else {
    isFallback = true;
    targetSpecialty = 'General Medicine';
    matchRationale = 'Broad / General Concern: Routed to General Medicine for preliminary clinical evaluation.';
  }

  // 4. SCORE AND RANK ALL ACCREDITED DOCTORS
  const scoredDoctors = doctorsPool.map(doc => {
    let score = 0;
    const reasons = [];

    // Specialty matching
    if (doc.specialty_name === targetSpecialty) {
      score += 60;
      reasons.push(`Direct Specialty Match: Specializes in ${doc.specialty_name}, matching patient concern.`);
    } else if (doc.specialty_name === 'General Medicine') {
      score += 30;
      reasons.push('General Physician: Can provide comprehensive primary care triage and specialist coordination.');
    } else {
      score += 5;
    }

    // Pediatric consideration
    if (isPediatricAge && doc.specialty_name === 'Pediatrics') {
      score += 25;
      reasons.push(`Child Health Specialist: Certified for patients age 0–14 years.`);
    }

    // Language preference matching (Requirement B)
    if (options.preferredLanguage && options.preferredLanguage !== 'all' && options.preferredLanguage !== 'Any') {
      const prefLang = options.preferredLanguage.toLowerCase().trim();
      if (doc.languages_spoken && doc.languages_spoken.some(l => l.toLowerCase() === prefLang)) {
        score += 15;
        reasons.push(`Language Match: Fluent in patient's preferred language (${options.preferredLanguage}).`);
      }
    }

    // Consultation mode matching
    if (options.preferredMode && options.preferredMode !== 'all' && options.preferredMode !== 'Any') {
      const prefMode = options.preferredMode.toLowerCase().trim();
      if (doc.consultation_modes && doc.consultation_modes.some(m => m.toLowerCase() === prefMode)) {
        score += 15;
        reasons.push(`Mode Supported: Available for ${options.preferredMode} consultation.`);
      }
    }

    // Availability bonus (Requirement B)
    if (doc.is_available) {
      score += 15;
      reasons.push('Live Availability: Currently online and accepting tele-triage consultations.');
    }

    // Experience bonus
    score += Math.min(15, Math.floor(doc.experience_years / 2));

    // Verification status distinction
    if (doc.verification_status === 'Verified') {
      score += 10;
    } else if (doc.verification_status === 'Pending Verification') {
      score -= 20;
      reasons.push('Note: Credentials currently under administrative verification review.');
    } else {
      score -= 50;
    }

    return {
      doctor: doc,
      matchScore: score,
      matchReasons: reasons
    };
  });

  // Sort by match score descending
  scoredDoctors.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 4-6 suggestions
  const topRecommendations = scoredDoctors.slice(0, 4);

  return {
    isUrgent: false,
    isFallback,
    isInsufficientInfo: false,
    recommendedSpecialty: targetSpecialty,
    matchExplanation: matchRationale,
    recommendations: topRecommendations,
    totalEvaluated: doctorsPool.length
  };
}

module.exports = {
  matchPatientToDoctors,
  checkEmergencySafety,
  scoreSpecialties,
  URGENT_EMERGENCY_TRIGGERS,
  SPECIALTY_RULES
};
