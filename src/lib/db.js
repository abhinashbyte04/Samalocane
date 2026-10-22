const crypto = require('crypto');
let Pool = null;
try {
  Pool = require('pg').Pool;
} catch (e) {
  // pg will be available once npm install is run
}

let pool = null;
let isRealPostgres = false;

// Centralized In-Memory mock store for offline, development & demonstration verification
const mockStore = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@samalocane.in',
      full_name: 'District Health Officer (Admin)',
      role: 'admin',
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    // 12 Verified Doctors + 2 Unverified
    {
      id: '22222222-2222-2222-2222-222222222201',
      email: 'dr.ramesh.rao@samalocane.in',
      full_name: 'Dr. Ramesh Rao',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-01-10T09:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222202',
      email: 'dr.ananya.hegde@samalocane.in',
      full_name: 'Dr. Ananya Hegde',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-01-12T10:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222203',
      email: 'dr.manjunath.bhat@samalocane.in',
      full_name: 'Dr. Manjunath Bhat',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-01-15T11:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222204',
      email: 'dr.priya.nayak@samalocane.in',
      full_name: 'Dr. Priya Nayak',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-01-20T09:30:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222205',
      email: 'dr.rajeshwar.sharma@samalocane.in',
      full_name: 'Dr. Rajeshwar Sharma',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-01T10:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222206',
      email: 'dr.sneha.kulkarni@samalocane.in',
      full_name: 'Dr. Sneha V. Kulkarni',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-05T14:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222207',
      email: 'dr.vikramaditya.patil@samalocane.in',
      full_name: 'Dr. Vikramaditya Patil',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-10T12:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222208',
      email: 'dr.shweta.alva@samalocane.in',
      full_name: 'Dr. Shweta B. Alva',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-15T15:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222209',
      email: 'dr.harish.rao@samalocane.in',
      full_name: 'Dr. Harish Chandra Rao',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-20T11:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222210',
      email: 'dr.arvind.deshpande@samalocane.in',
      full_name: 'Dr. Arvind K. Deshpande',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-02-25T16:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222211',
      email: 'dr.kavita.shenoy@samalocane.in',
      full_name: 'Dr. Kavita M. Shenoy',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-03-01T10:30:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222212',
      email: 'dr.sunil.naik@samalocane.in',
      full_name: 'Dr. Sunil G. Naik',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-03-05T09:00:00Z').toISOString()
    },
    // Unverified / Pending Doctors
    {
      id: '22222222-2222-2222-2222-222222222213',
      email: 'dr.nitesh.gowda@samalocane.in',
      full_name: 'Dr. Nitesh Gowda',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-03-10T11:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222299',
      email: 'dr.unverified.test@samalocane.in',
      full_name: 'Dr. Test Unverified',
      role: 'doctor',
      is_active: true,
      created_at: new Date('2026-01-01T00:00:00Z').toISOString()
    },
    // Fictional Patients
    {
      id: '33333333-3333-3333-3333-333333333301',
      email: 'patient.demo@samalocane.in',
      full_name: 'Smt. Parvathi',
      role: 'patient',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333302',
      email: 'ravi.kumar@samalocane.in',
      full_name: 'Shri Ravi Kumar',
      role: 'patient',
      is_active: true,
      created_at: new Date('2026-01-15T09:00:00Z').toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333303',
      email: 'lakshmi.devi@samalocane.in',
      full_name: 'Smt. Lakshmi Devi',
      role: 'patient',
      is_active: true,
      created_at: new Date('2026-02-01T10:00:00Z').toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333304',
      email: 'mohammed.arif@samalocane.in',
      full_name: 'Shri Mohammed Arif',
      role: 'patient',
      is_active: true,
      created_at: new Date('2026-02-10T11:00:00Z').toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333305',
      email: 'deepa.naik@samalocane.in',
      full_name: 'Kum. Deepa Naik',
      role: 'patient',
      is_active: true,
      created_at: new Date('2026-02-20T12:00:00Z').toISOString()
    }
  ],
  patient_profiles: [
    {
      id: 'p-profile-01',
      user_id: '33333333-3333-3333-3333-333333333301',
      dob: '1984-06-15',
      gender: 'Female',
      phone_number: '+91 98450 12345',
      taluka: 'Kumta',
      district: 'Uttara Kannada',
      current_symptoms: 'Persistent dry cough with mild evening fever and body aches',
      symptom_duration: '4 days',
      symptom_severity: 'Moderate',
      previous_medical_history: 'History of recurrent seasonal bronchitis during coastal monsoon.',
      chronic_conditions: ['Hypertension'],
      current_medications: 'Amlodipine 5mg once daily morning',
      allergies: 'Penicillin (Causes severe urticaria and hives)',
      emergency_contact_name: 'Ganesh (Son)',
      emergency_contact_phone: '+91 98450 67890',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-profile-02',
      user_id: '33333333-3333-3333-3333-333333333302',
      dob: '1992-11-20',
      gender: 'Male',
      phone_number: '+91 98450 99887',
      taluka: 'Madikeri',
      district: 'Kodagu',
      current_symptoms: 'Right knee pain and swelling after slip on hill coffee estate trail',
      symptom_duration: '2 days',
      symptom_severity: 'Severe',
      previous_medical_history: 'Mild allergic asthma during cold winter months.',
      chronic_conditions: ['None'],
      current_medications: 'None',
      allergies: 'None reported',
      emergency_contact_name: 'Kavitha (Spouse)',
      emergency_contact_phone: '+91 98450 55443',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-profile-03',
      user_id: '33333333-3333-3333-3333-333333333303',
      dob: '1968-04-10',
      gender: 'Female',
      phone_number: '+91 98452 44331',
      taluka: 'Sakleshpur',
      district: 'Hassan',
      current_symptoms: 'Morning fatigue, mild dizziness, and blood glucose fluctuations',
      symptom_duration: '1 week',
      symptom_severity: 'Mild',
      previous_medical_history: 'Type 2 Diabetes mellitus for 10 years and hypothyroidism.',
      chronic_conditions: ['Diabetes Type 2', 'Thyroid Disorder'],
      current_medications: 'Metformin 500mg BD, Thyroxine 50mcg OD',
      allergies: 'Sulphonamides / Sulfa drugs (Causes facial swelling)',
      emergency_contact_name: 'Prasad (Son)',
      emergency_contact_phone: '+91 98452 88990',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-profile-04',
      user_id: '33333333-3333-3333-3333-333333333304',
      dob: '1997-09-03',
      gender: 'Male',
      phone_number: '+91 98453 66778',
      taluka: 'Bhatkal',
      district: 'Uttara Kannada',
      current_symptoms: 'Persistent morning sneezing, watery eyes, and clear nasal discharge',
      symptom_duration: '2 weeks',
      symptom_severity: 'Moderate',
      previous_medical_history: 'Perennial allergic rhinitis aggravated by coastal humidity.',
      chronic_conditions: ['Asthma / Bronchitis'],
      current_medications: 'Levocetirizine 5mg PRN',
      allergies: 'None reported',
      emergency_contact_name: 'Zubair (Brother)',
      emergency_contact_phone: '+91 98453 11223',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-profile-05',
      user_id: '33333333-3333-3333-3333-333333333305',
      dob: '2002-02-18',
      gender: 'Female',
      phone_number: '+91 98455 77889',
      taluka: 'Karwar',
      district: 'Uttara Kannada',
      current_symptoms: 'Scaling red patch on neck and elbows with mild pruritus',
      symptom_duration: '5 days',
      symptom_severity: 'Mild',
      previous_medical_history: 'Atopic dermatitis during childhood.',
      chronic_conditions: ['None'],
      current_medications: 'Moisturizing emollient cream',
      allergies: 'Aspirin (Causes stomach upset and mild wheeze)',
      emergency_contact_name: 'Nagesh (Father)',
      emergency_contact_phone: '+91 98455 33445',
      updated_at: new Date().toISOString()
    }
  ],
  doctor_profiles: [
    {
      id: 'd-profile-01',
      user_id: '22222222-2222-2222-2222-222222222201',
      council_registration_number: 'KMC-48291',
      council_name: 'Karnataka Medical Council',
      registration_year: 2012,
      qualification: 'MBBS, MD (General Medicine)',
      specialty_name: 'General Medicine',
      experience_years: 12,
      bio: 'Consultant Physician with extensive experience in rural community health, tropical infections, hypertension, and diabetes management in coastal Karnataka.',
      hospital_affiliation: 'Karwar District Hospital',
      consultation_fee: 0,
      languages_spoken: ['Kannada', 'Konkani', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'text', 'video'],
      rating: 4.9,
      review_count: 184,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-02',
      user_id: '22222222-2222-2222-2222-222222222202',
      council_registration_number: 'KMC-61402',
      council_name: 'Karnataka Medical Council',
      registration_year: 2017,
      qualification: 'MBBS, DVD, MD (Dermatology)',
      specialty_name: 'Dermatology',
      experience_years: 7,
      bio: 'Dermatologist specializing in fungal infections, allergic contact dermatitis, eczema, and skin conditions exacerbated by high humidity in coastal talukas.',
      hospital_affiliation: 'Kumta Taluka General Hospital',
      consultation_fee: 100,
      languages_spoken: ['Kannada', 'Tulu', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'text', 'video'],
      rating: 4.8,
      review_count: 96,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-03',
      user_id: '22222222-2222-2222-2222-222222222203',
      council_registration_number: 'KMC-39184',
      council_name: 'Karnataka Medical Council',
      registration_year: 2008,
      qualification: 'MBBS, DTCD (Pulmonary Medicine)',
      specialty_name: 'Pulmonology / Respiratory',
      experience_years: 16,
      bio: 'Pulmonologist with deep expertise in rural bronchial asthma, chronic obstructive pulmonary disease (COPD), and occupational lung disorders.',
      hospital_affiliation: 'Karwar District Hospital',
      consultation_fee: 150,
      languages_spoken: ['Kannada', 'Konkani', 'Hindi', 'English'],
      is_verified: true,
      is_available: false,
      consultation_modes: ['audio', 'text'],
      rating: 4.9,
      review_count: 210,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-04',
      user_id: '22222222-2222-2222-2222-222222222204',
      council_registration_number: 'KMC-73891',
      council_name: 'Karnataka Medical Council',
      registration_year: 2015,
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      specialty_name: 'Pediatrics',
      experience_years: 9,
      bio: 'Pediatrician focused on neonatal care, childhood infections, nutritional advice, immunization scheduling, and growth tracking for coastal families.',
      hospital_affiliation: 'Kumta Taluka General Hospital',
      consultation_fee: 0,
      languages_spoken: ['Kannada', 'Konkani', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'text', 'video'],
      rating: 4.9,
      review_count: 142,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-05',
      user_id: '22222222-2222-2222-2222-222222222205',
      council_registration_number: 'KMC-52194',
      council_name: 'Karnataka Medical Council',
      registration_year: 2011,
      qualification: 'MBBS, MD, DM (Cardiology)',
      specialty_name: 'Cardiology',
      experience_years: 15,
      bio: 'Senior Cardiologist specializing in preventive cardiology, post-infarct rehabilitation, arrhythmias, and telemedicine triage for remote rural talukas.',
      hospital_affiliation: 'Mangalore Coastal Heart Institute',
      consultation_fee: 250,
      languages_spoken: ['Kannada', 'Tulu', 'Hindi', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video'],
      rating: 4.9,
      review_count: 318,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-06',
      user_id: '22222222-2222-2222-2222-222222222206',
      council_registration_number: 'KMC-58431',
      council_name: 'Karnataka Medical Council',
      registration_year: 2013,
      qualification: 'MBBS, MD, DM (Neurology)',
      specialty_name: 'Neurology',
      experience_years: 11,
      bio: 'Consultant Neurologist specializing in headache disorders, epilepsy management, peripheral neuropathy, and neurological rehabilitation tele-triage.',
      hospital_affiliation: 'Hubballi Neurosciences Centre',
      consultation_fee: 200,
      languages_spoken: ['Kannada', 'Marathi', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video', 'text'],
      rating: 4.8,
      review_count: 175,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-07',
      user_id: '22222222-2222-2222-2222-222222222207',
      council_registration_number: 'KMC-44912',
      council_name: 'Karnataka Medical Council',
      registration_year: 2010,
      qualification: 'MBBS, MS (Orthopedics), DNB',
      specialty_name: 'Orthopedics',
      experience_years: 14,
      bio: 'Orthopedic specialist in joint preservation, musculoskeletal pain, osteoarthritis, and spine care serving hill communities across Kodagu and Hassan.',
      hospital_affiliation: 'Madikeri District Hospital',
      consultation_fee: 150,
      languages_spoken: ['Kannada', 'Kodava', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video', 'text'],
      rating: 4.8,
      review_count: 162,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-08',
      user_id: '22222222-2222-2222-2222-222222222208',
      council_registration_number: 'KMC-67319',
      council_name: 'Karnataka Medical Council',
      registration_year: 2014,
      qualification: 'MBBS, MS (OBG), DGO',
      specialty_name: 'Gynecology & Obstetrics',
      experience_years: 10,
      bio: 'Gynecologist dedicated to maternal healthcare, high-risk pregnancy tele-monitoring, PCOS, and menstrual disorders in underserved hill talukas.',
      hospital_affiliation: 'Sakleshpur Community Health Centre',
      consultation_fee: 150,
      languages_spoken: ['Kannada', 'Tulu', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video', 'text'],
      rating: 4.9,
      review_count: 230,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-09',
      user_id: '22222222-2222-2222-2222-222222222209',
      council_registration_number: 'KMC-41285',
      council_name: 'Karnataka Medical Council',
      registration_year: 2006,
      qualification: 'MBBS, MD (Psychiatry)',
      specialty_name: 'Psychiatry & Mental Health',
      experience_years: 18,
      bio: 'Psychiatrist offering confidential counseling, anxiety/depression management, stress disorders, and de-addiction consultation via low-bandwidth audio tele-clinics.',
      hospital_affiliation: 'Coastal Mind Wellness Clinic',
      consultation_fee: 200,
      languages_spoken: ['Kannada', 'English', 'Hindi'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video', 'text'],
      rating: 4.8,
      review_count: 115,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-10',
      user_id: '22222222-2222-2222-2222-222222222210',
      council_registration_number: 'KMC-49823',
      council_name: 'Karnataka Medical Council',
      registration_year: 2011,
      qualification: 'MBBS, MS (ENT)',
      specialty_name: 'ENT / Otolaryngology',
      experience_years: 13,
      bio: 'ENT Surgeon managing chronic otitis media, fungal ear infections, allergic rhinitis, vertigo, and sinus conditions common in coastal regions.',
      hospital_affiliation: 'Karwar District Hospital',
      consultation_fee: 100,
      languages_spoken: ['Kannada', 'Konkani', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video', 'text'],
      rating: 4.7,
      review_count: 128,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-11',
      user_id: '22222222-2222-2222-2222-222222222211',
      council_registration_number: 'KMC-63102',
      council_name: 'Karnataka Medical Council',
      registration_year: 2016,
      qualification: 'MBBS, MS (Ophthalmology)',
      specialty_name: 'Ophthalmology',
      experience_years: 8,
      bio: 'Ophthalmologist offering primary eye care tele-triage, diabetic retinopathy screening guidance, allergic conjunctivitis, and post-cataract recovery checks.',
      hospital_affiliation: 'Bhatkal Taluka Hospital',
      consultation_fee: 100,
      languages_spoken: ['Kannada', 'Konkani', 'Urdu', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video'],
      rating: 4.8,
      review_count: 89,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-12',
      user_id: '22222222-2222-2222-2222-222222222212',
      council_registration_number: 'KMC-71954',
      council_name: 'Karnataka Medical Council',
      registration_year: 2018,
      qualification: 'MBBS, MEM (Emergency Medicine)',
      specialty_name: 'Emergency Medicine',
      experience_years: 6,
      bio: 'Casualty Medical Officer trained in acute trauma stabilization, snakebite protocols, and emergency tele-triage for taluka healthcare workers.',
      hospital_affiliation: 'Kumta Taluka General Hospital',
      consultation_fee: 0,
      languages_spoken: ['Kannada', 'English'],
      is_verified: true,
      is_available: true,
      consultation_modes: ['audio', 'video'],
      rating: 4.9,
      review_count: 204,
      updated_at: new Date().toISOString()
    },
    // Unverified Physicians Awaiting Verification Desk Approval
    {
      id: 'd-profile-13',
      user_id: '22222222-2222-2222-2222-222222222213',
      council_registration_number: 'KMC-82143',
      council_name: 'Karnataka Medical Council',
      registration_year: 2021,
      qualification: 'MBBS, MS (General Surgery)',
      specialty_name: 'General Surgery',
      experience_years: 5,
      bio: 'Surgical registrar applying for regional telemedicine panel accreditation to assist with post-operative wound tele-monitoring.',
      hospital_affiliation: 'Sakleshpur Community Health Centre',
      consultation_fee: 100,
      languages_spoken: ['Kannada', 'English'],
      is_verified: false,
      is_available: false,
      consultation_modes: ['audio', 'video'],
      rating: 4.5,
      review_count: 12,
      updated_at: new Date().toISOString()
    },
    {
      id: 'd-profile-99',
      user_id: '22222222-2222-2222-2222-222222222299',
      council_registration_number: 'KMC-99999',
      council_name: 'Karnataka Medical Council',
      registration_year: 2022,
      qualification: 'MBBS, MS (Orthopedics)',
      specialty_name: 'Orthopedics',
      experience_years: 4,
      bio: 'Unverified test physician profile used strictly for automated exclusion verification.',
      hospital_affiliation: 'Demo Test Clinic',
      consultation_fee: 150,
      languages_spoken: ['English'],
      is_verified: false,
      is_available: true,
      consultation_modes: ['text'],
      rating: 4.0,
      review_count: 5,
      updated_at: new Date().toISOString()
    }
  ],
  doctor_availability_slots: [
    {
      id: 'slot-01',
      doctor_id: '22222222-2222-2222-2222-222222222201',
      slot_date: '2026-10-21',
      start_time: '10:00:00',
      end_time: '10:30:00',
      is_booked: true
    },
    {
      id: 'slot-02',
      doctor_id: '22222222-2222-2222-2222-222222222201',
      slot_date: '2026-10-21',
      start_time: '10:30:00',
      end_time: '11:00:00',
      is_booked: false
    },
    {
      id: 'slot-03',
      doctor_id: '22222222-2222-2222-2222-222222222201',
      slot_date: '2026-10-21',
      start_time: '11:00:00',
      end_time: '11:30:00',
      is_booked: false
    },
    {
      id: 'slot-04',
      doctor_id: '22222222-2222-2222-2222-222222222202',
      slot_date: '2026-10-21',
      start_time: '14:00:00',
      end_time: '14:30:00',
      is_booked: true
    },
    {
      id: 'slot-05',
      doctor_id: '22222222-2222-2222-2222-222222222202',
      slot_date: '2026-10-21',
      start_time: '14:30:00',
      end_time: '15:00:00',
      is_booked: false
    },
    {
      id: 'slot-06',
      doctor_id: '22222222-2222-2222-2222-222222222205',
      slot_date: '2026-10-22',
      start_time: '09:30:00',
      end_time: '10:00:00',
      is_booked: false
    },
    {
      id: 'slot-07',
      doctor_id: '22222222-2222-2222-2222-222222222207',
      slot_date: '2026-10-22',
      start_time: '11:00:00',
      end_time: '11:30:00',
      is_booked: false
    }
  ],
  consultations: [
    {
      id: 'consult-01',
      reference_number: 'SAM-2026-X8F2Q',
      patient_id: '33333333-3333-3333-3333-333333333301',
      doctor_id: '22222222-2222-2222-2222-222222222201',
      status: 'submitted',
      requested_mode: 'audio',
      actual_mode_used: 'audio',
      chief_complaint: 'Persistent fever and dry cough for 4 days',
      symptoms: 'Mild fever, dry cough, body aches, no breathlessness',
      scheduled_at: '2026-10-21T10:00:00Z',
      slot_id: 'slot-01',
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'consult-02',
      reference_number: 'SAM-2026-B3K9P',
      patient_id: '33333333-3333-3333-3333-333333333301',
      doctor_id: '22222222-2222-2222-2222-222222222202',
      status: 'waiting',
      requested_mode: 'video',
      actual_mode_used: 'video',
      chief_complaint: 'Itchy red rash on forearms and neck for 3 days',
      symptoms: 'Pruritic erythematous rash with scaling, mild burning sensation',
      scheduled_at: '2026-10-21T14:00:00Z',
      slot_id: 'slot-04',
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'consult-03',
      reference_number: 'SAM-2026-M7T1L',
      patient_id: '33333333-3333-3333-3333-333333333302',
      doctor_id: '22222222-2222-2222-2222-222222222203',
      status: 'in_progress',
      requested_mode: 'audio',
      actual_mode_used: 'audio',
      chief_complaint: 'Nocturnal wheezing and breathlessness after hill trail trek',
      symptoms: 'Tightness in chest, dry coughing at night, audible wheeze',
      scheduled_at: null,
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'consult-04',
      reference_number: 'SAM-2026-D4R8Y',
      patient_id: '33333333-3333-3333-3333-333333333302',
      doctor_id: '22222222-2222-2222-2222-222222222201',
      status: 'completed',
      requested_mode: 'audio',
      actual_mode_used: 'audio',
      chief_complaint: 'Follow-up consultation for seasonal viral illness',
      symptoms: 'Fever subsided, mild residual throat irritation, appetite restored',
      scheduled_at: '2026-10-18T11:00:00Z',
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 171000000).toISOString()
    },
    {
      id: 'consult-05',
      reference_number: 'SAM-2026-L9W2E',
      patient_id: '33333333-3333-3333-3333-333333333303',
      doctor_id: '22222222-2222-2222-2222-222222222205',
      status: 'completed',
      requested_mode: 'video',
      actual_mode_used: 'audio', // degraded due to rural cellular network!
      chief_complaint: 'Hypertension medication review and occasional mild palpitations',
      symptoms: 'BP log 140/90, occasional dizziness, no chest pain or arm radiation',
      scheduled_at: '2026-10-19T10:00:00Z',
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 84600000).toISOString()
    },
    {
      id: 'consult-06',
      reference_number: 'SAM-2026-A1N5S',
      patient_id: '33333333-3333-3333-3333-333333333304',
      doctor_id: '22222222-2222-2222-2222-222222222210',
      status: 'completed',
      requested_mode: 'text',
      actual_mode_used: 'text',
      chief_complaint: 'Chronic sinus headache and morning nasal blockage',
      symptoms: 'Post-nasal drip, bilateral sinus heaviness, clear discharge',
      scheduled_at: '2026-10-19T15:00:00Z',
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 64800000).toISOString(),
      updated_at: new Date(Date.now() - 63000000).toISOString()
    },
    {
      id: 'consult-07',
      reference_number: 'SAM-2026-P6K3T',
      patient_id: '33333333-3333-3333-3333-333333333305',
      doctor_id: '22222222-2222-2222-2222-222222222204',
      status: 'pending_doctor_review',
      requested_mode: 'audio',
      actual_mode_used: 'audio',
      chief_complaint: 'High fever in 3-year-old child with mild shivering',
      symptoms: 'Temp 101F, active when fever drops, taking oral fluids well',
      scheduled_at: null,
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'consult-08',
      reference_number: 'SAM-2026-R8J2Z',
      patient_id: '33333333-3333-3333-3333-333333333304',
      doctor_id: '22222222-2222-2222-2222-222222222207',
      status: 'rejected',
      requested_mode: 'audio',
      actual_mode_used: null,
      chief_complaint: 'Suspected acute wrist fracture after falling from motorcycle',
      symptoms: 'Severe wrist deformity, intense swelling, acute pain on movement',
      scheduled_at: null,
      slot_id: null,
      cancellation_reason: null,
      rejection_reason: 'Acute bony deformity requires emergency physical splinting, X-ray imaging, and orthopedic cast at nearest Taluka Hospital Casualty. Telemedicine cannot provide emergency fracture reduction.',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 42000000).toISOString()
    },
    {
      id: 'consult-09',
      reference_number: 'SAM-2026-C5Y7X',
      patient_id: '33333333-3333-3333-3333-333333333303',
      doctor_id: '22222222-2222-2222-2222-222222222208',
      status: 'cancelled',
      requested_mode: 'audio',
      actual_mode_used: null,
      chief_complaint: 'Post-menopausal routine consultation inquiry',
      symptoms: 'Mild hot flashes, seeking dietary and calcium advice',
      scheduled_at: null,
      slot_id: null,
      cancellation_reason: 'Patient rescheduled due to personal travel to taluka clinic.',
      rejection_reason: null,
      created_at: new Date(Date.now() - 54000000).toISOString(),
      updated_at: new Date(Date.now() - 53000000).toISOString()
    }
  ],
  consultation_status_history: [
    {
      id: 'hist-01',
      consultation_id: 'consult-01',
      from_status: 'draft',
      to_status: 'submitted',
      actor_id: '33333333-3333-3333-3333-333333333301',
      actor_role: 'patient',
      reason: 'Initial consultation request submitted by patient.',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'hist-02',
      consultation_id: 'consult-02',
      from_status: 'draft',
      to_status: 'submitted',
      actor_id: '33333333-3333-3333-3333-333333333301',
      actor_role: 'patient',
      reason: 'Initial consultation request submitted.',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'hist-03',
      consultation_id: 'consult-02',
      from_status: 'submitted',
      to_status: 'accepted',
      actor_id: '22222222-2222-2222-2222-222222222202',
      actor_role: 'doctor',
      reason: 'Doctor reviewed rash complaint and scheduled waiting room slot.',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'hist-04',
      consultation_id: 'consult-02',
      from_status: 'accepted',
      to_status: 'waiting',
      actor_id: '33333333-3333-3333-3333-333333333301',
      actor_role: 'patient',
      reason: 'Patient entered virtual waiting room.',
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  phc_facilities: [
    {
      id: 'kumta-th-01',
      name: 'Kumta Taluka General Hospital',
      facility_type: 'Taluka Hospital',
      taluka: 'Kumta',
      district: 'Uttara Kannada',
      address: 'Main Road, near Court Complex, Kumta, Karnataka 581343',
      emergency_phone: '+918386222045',
      operating_hours: '24/7 Casualty & Emergency',
      ambulance_available: true
    },
    {
      id: 'baad-phc-02',
      name: 'Baad Primary Health Centre',
      facility_type: 'PHC',
      taluka: 'Kumta',
      district: 'Uttara Kannada',
      address: 'Near Gram Panchayat, Baad Village, Kumta, Karnataka 581351',
      emergency_phone: '+918386241210',
      operating_hours: '09:00 AM - 04:30 PM',
      ambulance_available: false
    },
    {
      id: 'karwar-dh-01',
      name: 'Karwar District Hospital',
      facility_type: 'Taluka Hospital',
      taluka: 'Karwar',
      district: 'Uttara Kannada',
      address: 'MG Road, Karwar, Karnataka 581301',
      emergency_phone: '+918382226250',
      operating_hours: '24/7 Critical Care & Blood Bank',
      ambulance_available: true
    },
    {
      id: 'madikeri-dh-01',
      name: 'Madikeri District Hospital',
      facility_type: 'Taluka Hospital',
      taluka: 'Madikeri',
      district: 'Kodagu',
      address: 'Hospital Road, Stuart Hill, Madikeri, Karnataka 571201',
      emergency_phone: '+918272228345',
      operating_hours: '24/7 Trauma Care & Emergency',
      ambulance_available: true
    },
    {
      id: 'bhagamandala-phc-02',
      name: 'Bhagamandala Primary Health Centre',
      facility_type: 'PHC',
      taluka: 'Madikeri',
      district: 'Kodagu',
      address: 'Triveni Sangama Road, Bhagamandala, Karnataka 571247',
      emergency_phone: '+918272243220',
      operating_hours: '09:00 AM - 04:30 PM',
      ambulance_available: true
    },
    {
      id: 'sakleshpur-chc-01',
      name: 'Sakleshpur Community Health Centre',
      facility_type: 'CHC',
      taluka: 'Sakleshpur',
      district: 'Hassan',
      address: 'BM Road, Sakleshpur, Karnataka 573134',
      emergency_phone: '+918173244033',
      operating_hours: '24/7 Casualty Available',
      ambulance_available: true
    },
    {
      id: 'bhatkal-th-01',
      name: 'Bhatkal Taluka Hospital',
      facility_type: 'Taluka Hospital',
      taluka: 'Bhatkal',
      district: 'Uttara Kannada',
      address: 'Near Bus Stand, Bhatkal, Karnataka 581320',
      emergency_phone: '+918385226312',
      operating_hours: '24/7 Emergency Care',
      ambulance_available: true
    }
  ],
  audit_logs: [
    {
      id: 'audit-001',
      actor_id: '00000000-0000-0000-0000-000000000001',
      action: 'DOCTOR_VERIFIED_BY_ADMIN',
      target_resource: 'doctor_profiles',
      target_id: 'd-profile-01',
      metadata: { notes: 'Karnataka Medical Council registry credentials verified (KMC-48291)' },
      created_at: new Date('2026-01-10T11:00:00Z').toISOString()
    },
    {
      id: 'audit-002',
      actor_id: '00000000-0000-0000-0000-000000000001',
      action: 'DOCTOR_VERIFIED_BY_ADMIN',
      target_resource: 'doctor_profiles',
      target_id: 'd-profile-02',
      metadata: { notes: 'Karnataka Medical Council registry credentials verified (KMC-61402)' },
      created_at: new Date('2026-01-12T12:00:00Z').toISOString()
    }
  ],
  consultation_sessions: [],
  messages: [],
  consultation_signals: []
};

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (connectionString && Pool) {
    try {
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000
      });
      isRealPostgres = true;
    } catch (err) {
      console.warn('[Database] Failed to configure PostgreSQL pool:', err.message);
      pool = null;
      isRealPostgres = false;
    }
  }
  return pool;
}

/**
 * Execute SQL query against PostgreSQL or fallback mock store
 */
async function query(text, params = []) {
  const p = getPool();
  if (p && isRealPostgres) {
    try {
      return await p.query(text, params);
    } catch (err) {
      console.warn('[PostgreSQL Query Error, falling back to mock]:', err.message);
    }
  }

  const normalized = text.trim().toLowerCase();

  // 1. Users Queries (Simple user table lookup without joins)
  if (normalized.includes('from users') && !normalized.includes('join doctor_profiles')) {
    if (normalized.includes('email =')) {
      const email = params[0];
      const found = mockStore.users.filter(u => u.email === email);
      return { rows: found, rowCount: found.length };
    }
    if (normalized.includes('id =')) {
      const id = params[0];
      const found = mockStore.users.filter(u => u.id === id);
      return { rows: found, rowCount: found.length };
    }
    return { rows: mockStore.users, rowCount: mockStore.users.length };
  }

  // 2. Patient Profiles Queries
  if (normalized.includes('from patient_profiles')) {
    if (normalized.includes('user_id =')) {
      const userId = params[0];
      const found = mockStore.patient_profiles.filter(p => p.user_id === userId);
      return { rows: found, rowCount: found.length };
    }
    return { rows: mockStore.patient_profiles, rowCount: mockStore.patient_profiles.length };
  }

  // 3. Doctor Profiles Queries
  if (normalized.includes('from doctor_profiles') || (normalized.includes('from users') && normalized.includes('join doctor_profiles'))) {
    // Assemble joined doctor objects
    let doctors = mockStore.doctor_profiles.map(dp => {
      const u = mockStore.users.find(user => user.id === dp.user_id) || {};
      return {
        ...dp,
        doctor_user_id: dp.user_id,
        full_name: u.full_name || 'Dr. Specialist',
        email: u.email || '',
        avatar_url: u.avatar_url || null
      };
    });

    // Check verification filter
    if (normalized.includes('is_verified = true')) {
      doctors = doctors.filter(d => d.is_verified);
    }

    // Check individual doctor lookup by user_id or profile id
    if (normalized.includes('user_id = $') || normalized.includes('u.id = $') || normalized.includes('dp.user_id = $') || normalized.includes('id = $1') || normalized.includes('(u.id = $1')) {
      const idParam = params[0];
      doctors = doctors.filter(d => d.user_id === idParam || d.id === idParam);
      return { rows: doctors, rowCount: doctors.length };
    }

    // Check specialty filter
    const specParam = params.find(p => typeof p === 'string' && p.startsWith('%'));
    if (specParam) {
      const specSearch = specParam.replace(/%/g, '').toLowerCase();
      doctors = doctors.filter(d => d.specialty_name && d.specialty_name.toLowerCase().includes(specSearch));
    }

    // Check consultation mode filter
    if (normalized.includes('consultation_modes')) {
      const modeParam = params.find(p => ['audio', 'video', 'text'].includes(p));
      if (modeParam) {
        doctors = doctors.filter(d => d.consultation_modes && d.consultation_modes.includes(modeParam));
      }
    }

    // Sorting
    doctors.sort((a, b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0) || b.experience_years - a.experience_years);

    return { rows: doctors, rowCount: doctors.length };
  }

  // 4. Consultations Queries
  if (normalized.includes('from consultations')) {
    let list = mockStore.consultations.map(c => {
      const patient = mockStore.users.find(u => u.id === c.patient_id) || {};
      const doctor = mockStore.users.find(u => u.id === c.doctor_id) || {};
      const docProfile = mockStore.doctor_profiles.find(d => d.user_id === c.doctor_id) || {};
      return {
        ...c,
        patient_name: patient.full_name,
        doctor_name: doctor.full_name,
        doctor_qualification: docProfile.qualification,
        doctor_council_reg: docProfile.council_registration_number,
        specialty_name: docProfile.specialty_name
      };
    });

    if (normalized.includes('id = $1') || normalized.includes('id = $') || normalized.includes('reference_number = $1')) {
      const id = params[0];
      list = list.filter(c => c.id === id || c.reference_number === id);
      return { rows: list, rowCount: list.length };
    }

    if (normalized.includes('patient_id = $1') || normalized.includes('patient_id = $')) {
      const patientId = params[0];
      list = list.filter(c => c.patient_id === patientId);
      return { rows: list, rowCount: list.length };
    }

    if (normalized.includes('doctor_id = $1') || normalized.includes('doctor_id = $')) {
      const doctorId = params[0];
      list = list.filter(c => c.doctor_id === doctorId);
      return { rows: list, rowCount: list.length };
    }

    return { rows: list, rowCount: list.length };
  }

  // 5. Consultation Status History Queries
  if (normalized.includes('from consultation_status_history')) {
    let history = mockStore.consultation_status_history;
    if (normalized.includes('consultation_id = $1')) {
      const cid = params[0];
      history = history.filter(h => h.consultation_id === cid);
    }
    return { rows: history, rowCount: history.length };
  }

  // 6. PHC Facilities Queries
  if (normalized.includes('from phc_facilities')) {
    return { rows: mockStore.phc_facilities, rowCount: mockStore.phc_facilities.length };
  }

  // 7. INSERT INTO consultations
  if (normalized.includes('insert into consultations')) {
    const newConsult = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'consult-' + Date.now(),
      reference_number: params[0],
      patient_id: params[1],
      doctor_id: params[2],
      status: params[3] || 'submitted',
      requested_mode: params[4] || 'audio',
      chief_complaint: params[5],
      symptoms: params[6] || '',
      scheduled_at: params[7] || null,
      slot_id: params[8] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockStore.consultations.unshift(newConsult);
    return { rows: [newConsult], rowCount: 1 };
  }

  // 8. UPDATE consultations
  if (normalized.includes('update consultations')) {
    const status = params[0];
    const cancelReason = params[1];
    const rejectReason = params[2];
    const id = params[3];

    const idx = mockStore.consultations.findIndex(c => c.id === id || c.reference_number === id);
    if (idx >= 0) {
      mockStore.consultations[idx].status = status;
      if (cancelReason) mockStore.consultations[idx].cancellation_reason = cancelReason;
      if (rejectReason) mockStore.consultations[idx].rejection_reason = rejectReason;
      mockStore.consultations[idx].updated_at = new Date().toISOString();
      return { rows: [mockStore.consultations[idx]], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. INSERT INTO consultation_status_history
  if (normalized.includes('insert into consultation_status_history')) {
    const newHist = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'hist-' + Date.now(),
      consultation_id: params[0],
      from_status: params[1],
      to_status: params[2],
      actor_id: params[3],
      actor_role: params[4],
      reason: params[5] || null,
      created_at: new Date().toISOString()
    };
    mockStore.consultation_status_history.push(newHist);
    return { rows: [newHist], rowCount: 1 };
  }

  // 10. INSERT/UPDATE patient_profiles
  if (normalized.includes('patient_profiles')) {
    if (normalized.includes('insert into patient_profiles') || normalized.includes('on conflict')) {
      const userId = params[0];
      const existingIdx = mockStore.patient_profiles.findIndex(p => p.user_id === userId);
      const profileData = {
        id: existingIdx >= 0 ? mockStore.patient_profiles[existingIdx].id : 'p-prof-' + Date.now(),
        user_id: userId,
        dob: params[1],
        gender: params[2],
        phone_number: params[3],
        taluka: params[4],
        district: params[5],
        current_symptoms: params[6],
        symptom_duration: params[7],
        symptom_severity: params[8],
        previous_medical_history: params[9],
        chronic_conditions: params[10],
        current_medications: params[11],
        allergies: params[12],
        emergency_contact_name: params[13],
        emergency_contact_phone: params[14],
        updated_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        mockStore.patient_profiles[existingIdx] = profileData;
      } else {
        mockStore.patient_profiles.push(profileData);
      }
      return { rows: [profileData], rowCount: 1 };
    }
  }

  // 11. INSERT/UPDATE doctor_profiles
  if (normalized.includes('doctor_profiles')) {
    if (normalized.includes('update doctor_profiles')) {
      const isVerified = params[0];
      const docId = params[1];
      const doc = mockStore.doctor_profiles.find(d => d.id === docId || d.user_id === docId);
      if (doc) {
        doc.is_verified = isVerified;
        doc.updated_at = new Date().toISOString();
        return { rows: [doc], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    if (normalized.includes('insert into doctor_profiles')) {
      const newDoc = {
        id: 'd-prof-' + Date.now(),
        user_id: params[0],
        is_verified: params[1] !== undefined ? params[1] : false,
        is_available: params[2] !== undefined ? params[2] : false,
        council_registration_number: null,
        council_name: 'Karnataka Medical Council',
        specialty_name: 'General Medicine',
        experience_years: 1,
        rating: 5.0,
        review_count: 0,
        consultation_modes: ['audio', 'text'],
        updated_at: new Date().toISOString()
      };
      mockStore.doctor_profiles.push(newDoc);
      return { rows: [newDoc], rowCount: 1 };
    }
  }

  // 12. consultation_sessions
  if (normalized.includes('consultation_sessions')) {
    if (normalized.includes('select') && normalized.includes('from consultation_sessions')) {
      let list = [...mockStore.consultation_sessions];
      if (normalized.includes('consultation_id = $1') || normalized.includes('consultation_id = $')) {
        const cid = params[0];
        list = list.filter(s => s.consultation_id === cid);
      }
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return { rows: list, rowCount: list.length };
    }

    if (normalized.includes('insert into consultation_sessions')) {
      const newSession = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'sess-' + Date.now(),
        consultation_id: params[0],
        session_status: params[1],
        patient_present: Boolean(params[2]),
        doctor_present: Boolean(params[3]),
        active_mode: params[4] || 'audio',
        connection_tier: params[5] || 'tier_1_good',
        patient_joined_at: null,
        doctor_joined_at: null,
        patient_last_seen: null,
        doctor_last_seen: null,
        reconnect_attempts: 0,
        ended_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockStore.consultation_sessions.unshift(newSession);
      return { rows: [newSession], rowCount: 1 };
    }

    if (normalized.includes('update consultation_sessions')) {
      const sessionId = params[params.length - 1];
      const session = mockStore.consultation_sessions.find(s => s.id === sessionId);
      if (session) {
        if (normalized.includes('ended_at = $2')) {
          session.session_status = params[0];
          session.ended_at = params[1];
          session.patient_present = false;
          session.doctor_present = false;
        } else if (normalized.includes('patient_joined_at = $4')) {
          session.session_status = params[0];
          session.patient_present = Boolean(params[1]);
          session.doctor_present = Boolean(params[2]);
          session.patient_joined_at = params[3];
          session.doctor_joined_at = params[4];
          session.patient_last_seen = params[5];
          session.doctor_last_seen = params[6];
          session.active_mode = params[7];
        } else if (normalized.includes('connection_tier = $6')) {
          session.patient_present = Boolean(params[0]);
          session.doctor_present = Boolean(params[1]);
          session.patient_last_seen = params[2];
          session.doctor_last_seen = params[3];
          session.session_status = params[4];
          session.connection_tier = params[5];
          session.active_mode = params[6];
        } else if (normalized.includes('session_status = $3')) {
          session.patient_present = Boolean(params[0]);
          session.doctor_present = Boolean(params[1]);
          session.session_status = params[2];
        }
        session.updated_at = new Date().toISOString();
        return { rows: [session], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  }

  // 13. consultation_signals
  if (normalized.includes('consultation_signals')) {
    if (normalized.includes('insert into consultation_signals')) {
      const newSignal = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'sig-' + Date.now(),
        consultation_id: params[0],
        sender_id: params[1],
        recipient_id: params[2],
        signal_type: params[3],
        payload: params[4],
        delivered: false,
        created_at: new Date().toISOString()
      };
      mockStore.consultation_signals.push(newSignal);
      return { rows: [newSignal], rowCount: 1 };
    }

    if (normalized.includes('select') && normalized.includes('from consultation_signals')) {
      const cid = params[0];
      const rid = params[1];
      const signals = mockStore.consultation_signals.filter(s =>
        s.consultation_id === cid &&
        s.recipient_id === rid &&
        (!normalized.includes('delivered = false') || !s.delivered)
      );
      signals.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      return { rows: signals, rowCount: signals.length };
    }

    if (normalized.includes('update consultation_signals')) {
      const cid = params[0];
      const rid = params[1];
      mockStore.consultation_signals.forEach(s => {
        if (s.consultation_id === cid && s.recipient_id === rid) {
          s.delivered = true;
        }
      });
      return { rows: [], rowCount: 1 };
    }

    if (normalized.includes('delete from consultation_signals')) {
      const cid = params[0];
      mockStore.consultation_signals = mockStore.consultation_signals.filter(s => s.consultation_id !== cid);
      return { rows: [], rowCount: 1 };
    }
  }

  // 14. messages
  if (normalized.includes('messages')) {
    if (normalized.includes('insert into messages')) {
      const newMsg = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now(),
        consultation_id: params[0],
        sender_id: params[1],
        client_msg_id: params[2],
        content: params[3],
        message_type: params[4] || 'text',
        server_received_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      mockStore.messages.push(newMsg);
      return { rows: [newMsg], rowCount: 1 };
    }

    if (normalized.includes('select') && normalized.includes('from messages')) {
      if (normalized.includes('client_msg_id = $1') || normalized.includes('client_msg_id = $')) {
        const found = mockStore.messages.filter(m => m.client_msg_id === params[0]);
        return { rows: found, rowCount: found.length };
      }

      if (normalized.includes('consultation_id = $1') || normalized.includes('consultation_id = $')) {
        let list = mockStore.messages.filter(m => m.consultation_id === params[0]);
        list = list.map(m => {
          const u = mockStore.users.find(usr => usr.id === m.sender_id) || {};
          return {
            ...m,
            sender_name: u.full_name || 'Participant',
            sender_role: u.role || 'user'
          };
        });
        list.sort((a, b) => new Date(a.server_received_at || 0) - new Date(b.server_received_at || 0));
        return { rows: list, rowCount: list.length };
      }
    }
  }

  // 15. INSERT INTO users
  if (normalized.includes('insert into users')) {
    const newUser = {
      id: params[0] || (crypto.randomUUID ? crypto.randomUUID() : 'usr-' + Date.now()),
      email: params[1],
      full_name: params[2] || (params[1] ? params[1].split('@')[0] : 'User'),
      role: params[3] || 'patient',
      avatar_url: params[4] || null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockStore.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // Fallback for unhandled queries
  return { rows: [], rowCount: 0 };
}

function isPostgresConnected() {
  return isRealPostgres;
}

module.exports = {
  query,
  getPool,
  isPostgresConnected,
  mockStore
};
