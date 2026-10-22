/**
 * Fictional Demo Doctors & Medical Credentials Dataset
 * Prototype dataset representing accredited medical practitioners for coastal and hill talukas.
 * ALL DOCTORS AND CERTIFICATES IN THIS FILE ARE FICTIONAL DEMO DATA FOR PROTOTYPE DEMONSTRATION.
 * No real practitioner credentials or authentic certificates are represented.
 */

export const INITIAL_DEMO_DOCTORS = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    doctor_user_id: '22222222-2222-2222-2222-222222222201',
    full_name: 'Dr. Ramesh Rao',
    title: 'Senior Consultant Physician & Taluka Clinical Mentor',
    gender: 'Male',
    avatar_color: 'teal',
    avatar_initials: 'RR',
    specialty_name: 'General Medicine',
    qualification: 'MBBS, MD (General Medicine)',
    education: [
      { degree: 'Doctor of Medicine (MD) - General Medicine', institution: 'Mysore Medical College and Research Institute', year: 2012 },
      { degree: 'Bachelor of Medicine & Bachelor of Surgery (MBBS)', institution: 'Bangalore Medical College & Research Institute (BMCRI)', year: 2008 }
    ],
    clinical_interests: [
      'Tropical & Monsoon Fevers',
      'Hypertension & Type 2 Diabetes Management',
      'Rural Community Tele-Triage',
      'Cardiometabolic Risk Reduction'
    ],
    experience_years: 12,
    languages_spoken: ['Kannada', 'English', 'Hindi', 'Konkani'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 0, // Free subsidized public healthcare
    is_available: true,
    schedule: [
      { days: 'Monday – Friday', timing: '09:00 AM – 01:00 PM', type: 'Morning Clinical OPD (Audio & Video)' },
      { days: 'Monday – Thursday', timing: '04:00 PM – 06:30 PM', type: 'Evening Tele-Clinic (Video Call)' },
      { days: 'Saturday', timing: '09:00 AM – 12:00 PM', type: 'Chronic Disease Review' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-48291 (Fictional Demo)',
    registration_year: 2012,
    hospital_affiliation: 'Karwar District Hospital & Rural Telemedicine Hub',
    bio: 'Senior Consultant Physician with over 12 years of clinical experience in community healthcare, coastal tropical infections, chronic lifestyle disorders, and rural telemedicine coordination across Uttara Kannada.',
    consultation_approach: 'Comprehensive patient-centered history taking, low-bandwidth audio-first priority for remote hill patients, and clear, practical health guidance delivered in regional languages.',
    rating: 4.9,
    review_count: 184,
    is_demo: true,
    certificates: [
      {
        id: 'cert-rr-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-48291 (Fictional Demo)',
        date_issued: '2012-07-15',
        valid_until: '2027-07-14',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      },
      {
        id: 'cert-rr-02',
        title: 'Doctor of Medicine (MD) Degree Certificate',
        authority: 'Rajiv Gandhi University of Health Sciences, Karnataka',
        reg_number: 'RGUHS-MD-88412 (Fictional Demo)',
        date_issued: '2012-05-20',
        valid_until: 'Lifetime Credential',
        status: 'Verified',
        is_demo: true,
        document_type: 'Postgraduate Degree',
        issuer_signature: 'Vice-Chancellor, RGUHS'
      },
      {
        id: 'cert-rr-03',
        title: 'Primary Medical Qualification (MBBS)',
        authority: 'Bangalore Medical College & Research Institute',
        reg_number: 'BMC-MBBS-34211 (Fictional Demo)',
        date_issued: '2008-03-10',
        valid_until: 'Lifetime Credential',
        status: 'Verified',
        is_demo: true,
        document_type: 'Basic Medical Degree',
        issuer_signature: 'Dean, BMCRI'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    doctor_user_id: '22222222-2222-2222-2222-222222222202',
    full_name: 'Dr. Rajeshwari Patil',
    title: 'Consultant Dermatologist & Venereologist',
    gender: 'Female',
    avatar_color: 'purple',
    avatar_initials: 'RP',
    specialty_name: 'Dermatology',
    qualification: 'MBBS, DVD, MD (Dermatology)',
    education: [
      { degree: 'MD (Dermatology, Venereology & Leprosy)', institution: 'Karnataka Institute of Medical Sciences (KIMS) Hubballi', year: 2017 },
      { degree: 'Diploma in Venereology and Dermatology (DVD)', institution: 'KIMS Hubballi', year: 2015 },
      { degree: 'MBBS', institution: 'JJM Medical College, Davangere', year: 2012 }
    ],
    clinical_interests: [
      'High-Humidity Coastal Fungal Dermatoses',
      'Allergic Contact Dermatitis & Plant Dermatitis',
      'Chronic Eczema & Psoriasis Management',
      'Pediatric Skin Rashes'
    ],
    experience_years: 7,
    languages_spoken: ['Kannada', 'English', 'Tulu'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 100,
    is_available: true,
    schedule: [
      { days: 'Monday, Wednesday, Friday', timing: '10:00 AM – 02:00 PM', type: 'Dermatology Video Clinic' },
      { days: 'Tuesday, Thursday', timing: '03:00 PM – 06:00 PM', type: 'Skin Image Review & Follow-up' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-61402 (Fictional Demo)',
    registration_year: 2017,
    hospital_affiliation: 'Kumta Taluka General Hospital',
    bio: 'Dermatologist with focused experience in fungal dermatoses, allergic eczema, and occupational skin irritations common among plantation and coastal fisheries workers in Karnataka.',
    consultation_approach: 'High-resolution image tele-review paired with real-time video examination, clear topical medication guidance, and preventive hygiene education.',
    rating: 4.8,
    review_count: 96,
    is_demo: true,
    certificates: [
      {
        id: 'cert-rp-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-61402 (Fictional Demo)',
        date_issued: '2017-08-10',
        valid_until: '2027-08-09',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      },
      {
        id: 'cert-rp-02',
        title: 'Doctor of Medicine (MD) in Dermatology',
        authority: 'Rajiv Gandhi University of Health Sciences, Karnataka',
        reg_number: 'RGUHS-MD-99120 (Fictional Demo)',
        date_issued: '2017-06-18',
        valid_until: 'Lifetime Credential',
        status: 'Verified',
        is_demo: true,
        document_type: 'Postgraduate Degree',
        issuer_signature: 'Vice-Chancellor, RGUHS'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    doctor_user_id: '22222222-2222-2222-2222-222222222203',
    full_name: 'Dr. Suresh Hegde',
    title: 'Senior Pulmonologist & Respiratory Specialist',
    gender: 'Male',
    avatar_color: 'blue',
    avatar_initials: 'SH',
    specialty_name: 'Pulmonology / Respiratory',
    qualification: 'MBBS, DTCD (Pulmonary Medicine)',
    education: [
      { degree: 'Diploma in Tuberculosis & Chest Diseases (DTCD)', institution: 'Kasturba Medical College (KMC) Manipal', year: 2008 },
      { degree: 'MBBS', institution: 'Kasturba Medical College (KMC) Mangalore', year: 2004 }
    ],
    clinical_interests: [
      'Chronic Obstructive Pulmonary Disease (COPD)',
      'Bronchial Asthma & Allergen Desensitization',
      'Post-Tubercular Pulmonary Care',
      'Occupational Dust Inhalation Disorders'
    ],
    experience_years: 16,
    languages_spoken: ['Kannada', 'English', 'Hindi', 'Konkani'],
    consultation_modes: ['audio', 'text'],
    consultation_fee: 150,
    is_available: false, // Currently Offline
    schedule: [
      { days: 'Monday – Thursday', timing: '08:30 AM – 12:30 PM', type: 'Pulmonary Tele-Clinic (Audio Call)' },
      { days: 'Saturday', timing: '02:00 PM – 05:00 PM', type: 'Asthma Inhaler Technique Review' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-39184 (Fictional Demo)',
    registration_year: 2008,
    hospital_affiliation: 'Karwar District Hospital',
    bio: 'Senior Chest Physician with 16 years of expertise managing bronchial asthma, COPD, and agricultural occupational lung conditions across the Western Ghats and coastal belt.',
    consultation_approach: 'Audio-based acoustic symptom evaluation, inhaler technique coaching, and personalized peak-flow management action plans tailored for rural households.',
    rating: 4.9,
    review_count: 210,
    is_demo: true,
    certificates: [
      {
        id: 'cert-sh-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-39184 (Fictional Demo)',
        date_issued: '2008-09-12',
        valid_until: '2028-09-11',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    doctor_user_id: '22222222-2222-2222-2222-222222222204',
    full_name: 'Dr. Sneha V. Kulkarni',
    title: 'Consultant Pediatrician & Neonatologist',
    gender: 'Female',
    avatar_color: 'emerald',
    avatar_initials: 'SK',
    specialty_name: 'Pediatrics',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    education: [
      { degree: 'Diplomate of National Board (DNB) - Pediatrics', institution: 'National Board of Examinations (NBE) New Delhi', year: 2015 },
      { degree: 'Diploma in Child Health (DCH)', institution: 'JSS Medical College, Mysuru', year: 2013 },
      { degree: 'MBBS', institution: 'Belagavi Institute of Medical Sciences', year: 2010 }
    ],
    clinical_interests: [
      'Neonatal Health & Low-Birth-Weight Care',
      'Childhood Infectious Illnesses & Fevers',
      'Nutritional Rehabilitation in Rural Talukas',
      'Universal Immunization Tracking'
    ],
    experience_years: 9,
    languages_spoken: ['Kannada', 'English', 'Konkani', 'Marathi'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 0,
    is_available: true,
    schedule: [
      { days: 'Monday – Saturday', timing: '09:00 AM – 01:00 PM', type: 'Child Health Tele-Clinic (Video Call)' },
      { days: 'Tuesday & Friday', timing: '04:00 PM – 06:00 PM', type: 'Parental Nutrition Counseling' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-73891 (Fictional Demo)',
    registration_year: 2015,
    hospital_affiliation: 'Kumta Taluka General Hospital',
    bio: 'Dedicated Pediatrician passionate about rural maternal-child health, neonatal care, growth milestone tracking, and childhood fever management in remote primary care talukas.',
    consultation_approach: 'Gentle, reassuring family tele-visits with parental empowerment, weight-based pediatric dosing calculations, and clear red-flag alert criteria for emergency escalation.',
    rating: 4.9,
    review_count: 142,
    is_demo: true,
    certificates: [
      {
        id: 'cert-sk-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-73891 (Fictional Demo)',
        date_issued: '2015-04-18',
        valid_until: '2030-04-17',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      },
      {
        id: 'cert-sk-02',
        title: 'National Board of Examinations (DNB Pediatrics)',
        authority: 'National Board of Examinations in Medical Sciences',
        reg_number: 'NBE-DNB-55219 (Fictional Demo)',
        date_issued: '2015-02-10',
        valid_until: 'Lifetime Credential',
        status: 'Verified',
        is_demo: true,
        document_type: 'National Board Degree',
        issuer_signature: 'Executive Director, NBE'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    doctor_user_id: '22222222-2222-2222-2222-222222222205',
    full_name: 'Dr. Manjunath Bhat',
    title: 'Senior Interventional Cardiologist',
    gender: 'Male',
    avatar_color: 'rose',
    avatar_initials: 'MB',
    specialty_name: 'Cardiology',
    qualification: 'MBBS, MD, DM (Cardiology)',
    education: [
      { degree: 'Doctorate of Medicine (DM) - Cardiology', institution: 'Sri Jayadeva Institute of Cardiovascular Sciences, Bengaluru', year: 2011 },
      { degree: 'MD (Internal Medicine)', institution: 'Kasturba Medical College, Mangalore', year: 2007 },
      { degree: 'MBBS', institution: 'BMCRI Bengaluru', year: 2003 }
    ],
    clinical_interests: [
      'Coronary Artery Disease Tele-Triage',
      'Hypertensive Heart Disease & Heart Failure',
      'Post-Angioplasty Monitoring',
      'Electrocardiogram (ECG) Rural Tele-Interpretation'
    ],
    experience_years: 15,
    languages_spoken: ['Kannada', 'English', 'Tulu', 'Hindi'],
    consultation_modes: ['video', 'audio'],
    consultation_fee: 250,
    is_available: true,
    schedule: [
      { days: 'Monday, Wednesday, Friday', timing: '02:00 PM – 06:00 PM', type: 'Cardiology Tele-Clinic (Video)' },
      { days: 'Tuesday & Thursday', timing: '09:00 AM – 11:30 AM', type: 'ECG Remote Interpretation & Triage' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-52194 (Fictional Demo)',
    registration_year: 2011,
    hospital_affiliation: 'Mangalore Coastal Heart Institute',
    bio: 'Interventional Cardiologist with 15 years of experience in ischemic heart disease, heart failure rehabilitation, and emergency ECG tele-triage for rural primary health centres.',
    consultation_approach: 'Fast-track cardiac risk stratification, medication optimization, and rapid emergency escalation pathways via National 108 ambulance shortcuts.',
    rating: 4.9,
    review_count: 318,
    is_demo: true,
    certificates: [
      {
        id: 'cert-mb-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-52194 (Fictional Demo)',
        date_issued: '2011-06-25',
        valid_until: '2026-06-24',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      },
      {
        id: 'cert-mb-02',
        title: 'Doctorate of Medicine (DM Cardiology)',
        authority: 'Rajiv Gandhi University of Health Sciences, Karnataka',
        reg_number: 'RGUHS-DM-41908 (Fictional Demo)',
        date_issued: '2011-05-30',
        valid_until: 'Lifetime Credential',
        status: 'Verified',
        is_demo: true,
        document_type: 'Super-Specialty Degree',
        issuer_signature: 'Vice-Chancellor, RGUHS'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222206',
    doctor_user_id: '22222222-2222-2222-2222-222222222206',
    full_name: 'Dr. Vikramaditya Patil',
    title: 'Consultant Neurologist',
    gender: 'Male',
    avatar_color: 'indigo',
    avatar_initials: 'VP',
    specialty_name: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    education: [
      { degree: 'DM (Neurology)', institution: 'National Institute of Mental Health & Neurosciences (NIMHANS), Bengaluru', year: 2013 },
      { degree: 'MD (General Medicine)', institution: 'KIMS Hubballi', year: 2009 },
      { degree: 'MBBS', institution: 'KIMS Hubballi', year: 2005 }
    ],
    clinical_interests: [
      'Migraine & Refractory Headache Disorders',
      'Rural Epilepsy Management & Anticonvulsant TDM',
      'Diabetic Peripheral Neuropathy',
      'Stroke Rehabilitation Guidance'
    ],
    experience_years: 11,
    languages_spoken: ['Kannada', 'English', 'Marathi', 'Hindi'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 200,
    is_available: true,
    schedule: [
      { days: 'Tuesday & Thursday', timing: '10:00 AM – 02:00 PM', type: 'Neuro Tele-Clinic (Video Call)' },
      { days: 'Saturday', timing: '03:00 PM – 06:30 PM', type: 'Headache & Epilepsy Review' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-58431 (Fictional Demo)',
    registration_year: 2013,
    hospital_affiliation: 'Hubballi Neurosciences Centre',
    bio: 'Consultant Neurologist dedicated to bringing specialist neurologic consultations, headache clinics, and seizure management to underserved hill talukas.',
    consultation_approach: 'Detailed neurologic history inquiry, trigger identification analysis, prophylactic medication stabilization, and patient empowerment regarding warning signs.',
    rating: 4.8,
    review_count: 175,
    is_demo: true,
    certificates: [
      {
        id: 'cert-vp-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-58431 (Fictional Demo)',
        date_issued: '2013-08-14',
        valid_until: '2028-08-13',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222207',
    doctor_user_id: '22222222-2222-2222-2222-222222222207',
    full_name: 'Dr. Ananya Hegde',
    title: 'Consultant Orthopedic Surgeon',
    gender: 'Female',
    avatar_color: 'amber',
    avatar_initials: 'AH',
    specialty_name: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics), DNB',
    education: [
      { degree: 'Master of Surgery (MS) - Orthopedics', institution: 'Kasturba Medical College, Mangalore', year: 2010 },
      { degree: 'DNB Orthopedic Surgery', institution: 'National Board of Examinations New Delhi', year: 2011 },
      { degree: 'MBBS', institution: 'Fr. Muller Medical College, Mangalore', year: 2006 }
    ],
    clinical_interests: [
      'Osteoarthritis of the Knee & Hip',
      'Agricultural Sprain & Hill Trail Injuries',
      'Low Back Pain & Ergonomic Guidance',
      'Post-Fracture Home Physiotherapy'
    ],
    experience_years: 14,
    languages_spoken: ['Kannada', 'English', 'Tulu', 'Kodava'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 150,
    is_available: true,
    schedule: [
      { days: 'Monday, Wednesday, Friday', timing: '09:30 AM – 01:30 PM', type: 'Joint & Spine Tele-Clinic' },
      { days: 'Thursday', timing: '03:00 PM – 05:30 PM', type: 'Rehab Exercise Follow-up' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-44912 (Fictional Demo)',
    registration_year: 2010,
    hospital_affiliation: 'Madikeri District Hospital',
    bio: 'Orthopedic surgeon with extensive clinical focus on joint preservation, hill agricultural work sprains, knee osteoarthritis, and rural physical rehabilitation in Kodagu talukas.',
    consultation_approach: 'Active motion video assessment, guided range-of-motion testing, conservative pharmacotherapy, and customized home exercise regimens.',
    rating: 4.8,
    review_count: 162,
    is_demo: true,
    certificates: [
      {
        id: 'cert-ah-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-44912 (Fictional Demo)',
        date_issued: '2010-09-08',
        valid_until: '2025-09-07',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222208',
    doctor_user_id: '22222222-2222-2222-2222-222222222208',
    full_name: 'Dr. Priya Nayak',
    title: 'Senior Consultant Obstetrician & Gynecologist',
    gender: 'Female',
    avatar_color: 'pink',
    avatar_initials: 'PN',
    specialty_name: 'Gynecology & Obstetrics',
    qualification: 'MBBS, MS (OBG), DGO',
    education: [
      { degree: 'Master of Surgery (MS) - Obstetrics & Gynecology', institution: 'Father Muller Medical College, Mangalore', year: 2014 },
      { degree: 'Diploma in Gynecology & Obstetrics (DGO)', institution: 'Fr. Muller Medical College', year: 2012 },
      { degree: 'MBBS', institution: 'Yenepoya Medical College, Mangalore', year: 2008 }
    ],
    clinical_interests: [
      'Antenatal Care & High-Risk Pregnancy Monitoring',
      'PCOS, Thyroid & Menstrual Regularity',
      'Perimenopause & Osteoporosis Prevention',
      'Anemia Management in Adolescent Women'
    ],
    experience_years: 10,
    languages_spoken: ['Kannada', 'English', 'Konkani', 'Tulu'],
    consultation_modes: ['video', 'audio', 'text'],
    consultation_fee: 150,
    is_available: true,
    schedule: [
      { days: 'Monday – Friday', timing: '10:00 AM – 02:00 PM', type: 'Women Health Tele-Clinic (Video)' },
      { days: 'Wednesday & Saturday', timing: '04:00 PM – 06:00 PM', type: 'Antenatal Nutrition Counseling' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-67319 (Fictional Demo)',
    registration_year: 2014,
    hospital_affiliation: 'Sakleshpur Community Health Centre',
    bio: 'Obstetrician and Gynecologist advocating for comprehensive maternal tele-monitoring, adolescent reproductive health, and nutritional anemia control in remote hill talukas.',
    consultation_approach: 'Warm, confidential tele-environment, clear guidance on ultrasound and lab report interpretation, and maternal danger-sign vigilance.',
    rating: 4.9,
    review_count: 230,
    is_demo: true,
    certificates: [
      {
        id: 'cert-pn-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-67319 (Fictional Demo)',
        date_issued: '2014-04-12',
        valid_until: '2029-04-11',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222209',
    doctor_user_id: '22222222-2222-2222-2222-222222222209',
    full_name: 'Dr. Harish Chandra Rao',
    title: 'Consultant Psychiatrist & Behavioral Health Specialist',
    gender: 'Male',
    avatar_color: 'cyan',
    avatar_initials: 'HR',
    specialty_name: 'Psychiatry & Mental Health',
    qualification: 'MBBS, MD (Psychiatry)',
    education: [
      { degree: 'MD (Psychiatry)', institution: 'NIMHANS Bengaluru', year: 2006 },
      { degree: 'MBBS', institution: 'Mysore Medical College', year: 2001 }
    ],
    clinical_interests: [
      'Rural Stress, Anxiety & Depression Disorders',
      'Confidential Audio Tele-Counseling',
      'Alcohol & Substance De-Addiction Guidance',
      'Geriatric Cognitive & Sleep Wellness'
    ],
    experience_years: 18,
    languages_spoken: ['Kannada', 'English', 'Hindi', 'Konkani'],
    consultation_modes: ['audio', 'video', 'text'],
    consultation_fee: 200,
    is_available: true,
    schedule: [
      { days: 'Monday – Thursday', timing: '03:00 PM – 07:00 PM', type: 'Confidential Mental Health Tele-Session' },
      { days: 'Saturday', timing: '10:00 AM – 01:00 PM', type: 'Family Counseling' }
    ],
    verification_status: 'Verified',
    council_name: 'Karnataka Medical Council (Fictional Demo Authority)',
    council_registration_number: 'KMC-41285 (Fictional Demo)',
    registration_year: 2006,
    hospital_affiliation: 'Coastal Mind Wellness Clinic',
    bio: 'Consultant Psychiatrist providing confidential audio and video behavioral health consultations, depression counseling, and stress relief for rural residents facing geographical isolation.',
    consultation_approach: 'Safe, empathetic active listening without stigma, evidence-based cognitive behavioral techniques, and non-judgmental guidance.',
    rating: 4.8,
    review_count: 115,
    is_demo: true,
    certificates: [
      {
        id: 'cert-hr-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Simulation)',
        reg_number: 'KMC-41285 (Fictional Demo)',
        date_issued: '2006-03-22',
        valid_until: '2026-03-21',
        status: 'Verified',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Registrar, Karnataka Medical Council'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222213',
    doctor_user_id: '22222222-2222-2222-2222-222222222213',
    full_name: 'Dr. Nitesh Gowda',
    title: 'Surgical Registrar (General Surgery)',
    gender: 'Male',
    avatar_color: 'slate',
    avatar_initials: 'NG',
    specialty_name: 'General Surgery',
    qualification: 'MBBS, MS (General Surgery)',
    education: [
      { degree: 'Master of Surgery (MS) - General Surgery', institution: 'Bangalore Medical College & Research Institute', year: 2021 },
      { degree: 'MBBS', institution: 'Mandya Institute of Medical Sciences', year: 2016 }
    ],
    clinical_interests: [
      'Post-Operative Wound Tele-Monitoring',
      'Abdominal Wall Hernias & Suture Review',
      'Diabetic Foot Ulcer Dressing Guidance',
      'Minor Surgical Tele-Triage'
    ],
    experience_years: 5,
    languages_spoken: ['Kannada', 'English'],
    consultation_modes: ['audio', 'video'],
    consultation_fee: 100,
    is_available: false,
    schedule: [
      { days: 'Monday & Thursday', timing: '02:00 PM – 05:00 PM', type: 'Surgical Wound Review (Pending Verification)' }
    ],
    verification_status: 'Pending Verification',
    council_name: 'Karnataka Medical Council (Application Under Review)',
    council_registration_number: 'KMC-82143 (Pending Verification)',
    registration_year: 2021,
    hospital_affiliation: 'Sakleshpur Community Health Centre',
    bio: 'Surgical registrar applying for telemedicine panel accreditation. Special interest in post-discharge surgical wound evaluation and diabetic foot care.',
    consultation_approach: 'Systematic wound photographic inspection, infection risk surveillance, and coordination with taluka nursing staff.',
    rating: 4.5,
    review_count: 12,
    is_demo: true,
    certificates: [
      {
        id: 'cert-ng-01',
        title: 'State Medical Council Registration Certificate',
        authority: 'Karnataka Medical Council (Demo Submission)',
        reg_number: 'KMC-82143 (Pending Review)',
        date_issued: '2021-11-04',
        valid_until: 'Verification In Progress',
        status: 'Pending Verification',
        is_demo: true,
        document_type: 'Council Registration',
        issuer_signature: 'Under Administrative Review'
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222299',
    doctor_user_id: '22222222-2222-2222-2222-222222222299',
    full_name: 'Dr. Test Unverified',
    title: 'Clinical Practitioner (Unverified Demo Profile)',
    gender: 'Male',
    avatar_color: 'zinc',
    avatar_initials: 'TU',
    specialty_name: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    education: [
      { degree: 'MS Orthopedics', institution: 'Demo Medical College (Fictional)', year: 2022 },
      { degree: 'MBBS', institution: 'Demo Health Institute (Fictional)', year: 2017 }
    ],
    clinical_interests: [
      'Demo Clinical Testing',
      'Exclusion Verification Workflow'
    ],
    experience_years: 4,
    languages_spoken: ['English'],
    consultation_modes: ['text'],
    consultation_fee: 150,
    is_available: true,
    schedule: [
      { days: 'Sample Test Slot', timing: 'Unconfirmed Schedule', type: 'Unverified Panel' }
    ],
    verification_status: 'Not Verified',
    council_name: 'Karnataka Medical Council (Not Verified)',
    council_registration_number: 'KMC-99999 (Unverified Demo Number)',
    registration_year: 2022,
    hospital_affiliation: 'Demo Test Clinic',
    bio: 'Unverified test physician profile used strictly for automated exclusion and security verification in the telemedicine prototype.',
    consultation_approach: 'Profile unverified. Clinical consultations are restricted pending administrative credential review.',
    rating: 4.0,
    review_count: 5,
    is_demo: true,
    certificates: [
      {
        id: 'cert-tu-01',
        title: 'Sample Unverified Certificate',
        authority: 'Fictional Testing Body',
        reg_number: 'KMC-99999 (Demo Placeholder)',
        date_issued: '2022-01-01',
        valid_until: 'Unverified',
        status: 'Not Verified',
        is_demo: true,
        document_type: 'Unverified Sample',
        issuer_signature: 'Not Authenticated'
      }
    ]
  }
];

export const DEMO_SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Dermatology',
  'Pulmonology / Respiratory',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Gynecology & Obstetrics',
  'Psychiatry & Mental Health',
  'General Surgery'
];

export const DEMO_LANGUAGES = [
  'Kannada',
  'English',
  'Hindi',
  'Konkani',
  'Tulu',
  'Marathi'
];

