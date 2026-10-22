-- Samālōcane Seed Data (Phase 2 Enhanced)
-- Provides medical specialties with symptom keywords, verified & unverified doctors, and sample health records

-- 1. Specialties with symptom keywords for non-diagnostic recommendation
INSERT INTO specialties (id, name, description, icon_name, keywords)
VALUES 
    (
        '11111111-1111-1111-1111-111111111101',
        'General Medicine',
        'Primary care for common adult conditions, fevers, infections, metabolic disorders, and persistent fatigue.',
        'Stethoscope',
        ARRAY['fever', 'headache', 'body ache', 'weakness', 'fatigue', 'cough', 'cold', 'vomiting', 'diarrhea', 'infection', 'chills', 'flu', 'stomach ache', 'nausea']
    ),
    (
        '11111111-1111-1111-1111-111111111102',
        'Pediatrics',
        'Specialized healthcare for infants, children, and adolescents, including growth and developmental assessments.',
        'Baby',
        ARRAY['child fever', 'infant rash', 'child vomiting', 'baby crying', 'immunization', 'toddler cough', 'child appetite', 'colic']
    ),
    (
        '11111111-1111-1111-1111-111111111103',
        'Dermatology',
        'Diagnosis and management of skin diseases, fungal infections, rashes, eczema, hair, and nail problems common in humid coastal zones.',
        'Activity',
        ARRAY['skin rash', 'itching', 'fungal infection', 'ringworm', 'eczema', 'skin redness', 'boils', 'allergy rash', 'blisters', 'scabies', 'hives', 'psoriasis']
    ),
    (
        '11111111-1111-1111-1111-111111111104',
        'Pulmonology / Respiratory',
        'Care for chronic respiratory diseases, asthma, bronchitis, and breathing difficulties prevalent in humid and hilly talukas.',
        'Wind',
        ARRAY['chronic cough', 'wheezing', 'asthma', 'breathlessness', 'chest congestion', 'phlegm', 'difficulty breathing', 'bronchitis']
    ),
    (
        '11111111-1111-1111-1111-111111111105',
        'Orthopedics',
        'Treatment for joint pain, bone injuries, arthritis, back pain, and musculoskeletal strain common in hill plantation terrain.',
        'Shield',
        ARRAY['joint pain', 'knee pain', 'back pain', 'sprain', 'fracture', 'swelling in joints', 'shoulder pain', 'neck stiffness', 'arthritis', 'muscle strain']
    ),
    (
        '11111111-1111-1111-1111-111111111106',
        'Gynecology & Obstetrics',
        'Maternal health, prenatal guidance, menstrual disorders, and reproductive healthcare.',
        'Heart',
        ARRAY['pregnancy advice', 'menstrual cramps', 'irregular periods', 'pelvic pain', 'nausea in pregnancy', 'prenatal care', 'maternal']
    ),
    (
        '11111111-1111-1111-1111-111111111107',
        'ENT / Otolaryngology',
        'Ear infections, hearing issues, chronic sinusitis, tonsillitis, and vertigo common in monsoon coastal areas.',
        'Ear',
        ARRAY['ear pain', 'ear discharge', 'hearing loss', 'sore throat', 'sinusitis', 'nasal blockage', 'throat pain', 'hoarseness', 'ear ringing', 'vertigo']
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Users (Admin, Verified Doctors, Unverified Doctor, Patients)
INSERT INTO users (id, email, full_name, role, is_active)
VALUES 
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@samalocane.in',
        'District Health Officer (Admin)',
        'admin',
        TRUE
    ),
    (
        '22222222-2222-2222-2222-222222222201',
        'dr.ramesh.rao@samalocane.in',
        'Dr. Ramesh Rao',
        'doctor',
        TRUE
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'dr.ananya.hegde@samalocane.in',
        'Dr. Ananya Hegde',
        'doctor',
        TRUE
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'dr.manjunath.bhat@samalocane.in',
        'Dr. Manjunath Bhat',
        'doctor',
        TRUE
    ),
    (
        '22222222-2222-2222-2222-222222222204',
        'dr.priya.nayak@samalocane.in',
        'Dr. Priya Nayak',
        'doctor',
        TRUE
    ),
    (
        '22222222-2222-2222-2222-222222222299',
        'dr.unverified.test@samalocane.in',
        'Dr. Test Unverified',
        'doctor',
        TRUE
    ),
    (
        '33333333-3333-3333-3333-333333333301',
        'patient.demo@samalocane.in',
        'Smt. Parvathi',
        'patient',
        TRUE
    ),
    (
        '33333333-3333-3333-3333-333333333302',
        'ravi.kumar@samalocane.in',
        'Shri Ravi Kumar',
        'patient',
        TRUE
    )
ON CONFLICT (email) DO NOTHING;

-- 3. Doctor Profiles (with verified credentials and fees)
INSERT INTO doctor_profiles (
    user_id,
    council_registration_number,
    council_name,
    registration_year,
    qualification,
    specialty_id,
    specialty_name,
    experience_years,
    bio,
    consultation_fee,
    languages_spoken,
    is_verified,
    verification_date,
    verified_by,
    is_available,
    consultation_modes
)
VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'KMC-48291',
        'Karnataka Medical Council',
        2012,
        'MBBS, MD (General Medicine)',
        '11111111-1111-1111-1111-111111111101',
        'General Medicine',
        12,
        'Consultant Physician with extensive experience in rural community health and tropical infections in coastal Karnataka.',
        0,
        ARRAY['Kannada', 'Konkani', 'English'],
        TRUE,
        CURRENT_TIMESTAMP,
        '00000000-0000-0000-0000-000000000001',
        TRUE,
        ARRAY['text', 'audio', 'video']
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'KMC-61402',
        'Karnataka Medical Council',
        2017,
        'MBBS, DVD, MD (Dermatology)',
        '11111111-1111-1111-1111-111111111103',
        'Dermatology',
        7,
        'Dermatologist specializing in fungal infections, allergic contact dermatitis, and pediatric skin conditions common in high-humidity talukas.',
        100,
        ARRAY['Kannada', 'Tulu', 'English'],
        TRUE,
        CURRENT_TIMESTAMP,
        '00000000-0000-0000-0000-000000000001',
        TRUE,
        ARRAY['text', 'audio', 'video']
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'KMC-39184',
        'Karnataka Medical Council',
        2008,
        'MBBS, DTCD (Pulmonary Medicine)',
        '11111111-1111-1111-1111-111111111104',
        'Pulmonology / Respiratory',
        16,
        'Senior Pulmonologist focusing on asthma management and post-infectious bronchial spasms in hill talukas of Kodagu and Hassan.',
        150,
        ARRAY['Kannada', 'English', 'Hindi'],
        TRUE,
        CURRENT_TIMESTAMP,
        '00000000-0000-0000-0000-000000000001',
        TRUE,
        ARRAY['text', 'audio']
    ),
    (
        '22222222-2222-2222-2222-222222222204',
        'KMC-73891',
        'Karnataka Medical Council',
        2019,
        'MBBS, DCH, DNB (Pediatrics)',
        '11111111-1111-1111-1111-111111111102',
        'Pediatrics',
        5,
        'Pediatrician passionate about infant growth monitoring, immunization guidance, and neonatal primary care in coastal talukas.',
        50,
        ARRAY['Kannada', 'English'],
        TRUE,
        CURRENT_TIMESTAMP,
        '00000000-0000-0000-0000-000000000001',
        FALSE,
        ARRAY['text', 'audio', 'video']
    ),
    -- Unverified Doctor for testing exclusion
    (
        '22222222-2222-2222-2222-222222222299',
        'KMC-PENDING-99',
        'Karnataka Medical Council',
        2024,
        'MBBS (Junior Resident)',
        '11111111-1111-1111-1111-111111111101',
        'General Medicine',
        1,
        'Pending verification test practitioner. Must not be returned in verified directory queries.',
        0,
        ARRAY['English'],
        FALSE,
        NULL,
        NULL,
        TRUE,
        ARRAY['text']
    )
ON CONFLICT (user_id) DO NOTHING;

-- 4. Patient Profiles (Enhanced with symptoms, duration, severity, history)
INSERT INTO patient_profiles (
    user_id,
    dob,
    gender,
    phone_number,
    taluka,
    district,
    current_symptoms,
    symptom_duration,
    symptom_severity,
    previous_medical_history,
    chronic_conditions,
    current_medications,
    allergies,
    emergency_contact_name,
    emergency_contact_phone
)
VALUES
    (
        '33333333-3333-3333-3333-333333333301',
        '1984-06-15',
        'Female',
        '+919845012345',
        'Kumta',
        'Uttara Kannada',
        'Persistent dry cough with mild evening fever and body aches',
        '4 days',
        'Moderate',
        'History of recurrent bronchitis during monsoon season.',
        ARRAY['Hypertension'],
        'Amlodipine 5mg once daily morning',
        'Penicillin (Causes severe urticaria and hives)',
        'Ganesh (Son)',
        '+919845067890'
    ),
    (
        '33333333-3333-3333-3333-333333333302',
        '1992-11-20',
        'Male',
        '+919845099887',
        'Madikeri',
        'Kodagu',
        'Right knee pain and swelling after slip on hill trail',
        '2 days',
        'Severe',
        'No major previous hospitalizations.',
        ARRAY['None'],
        'None',
        'None reported',
        'Kavitha (Spouse)',
        '+919845055443'
    )
ON CONFLICT (user_id) DO NOTHING;

-- 5. Coastal & Hill Taluka Emergency Health Facilities (PHC / CHC / Taluka Hospitals)
INSERT INTO phc_facilities (name, facility_type, taluka, district, address, contact_numbers, emergency_phone, latitude, longitude, operating_hours, ambulance_available)
VALUES
    (
        'Kumta Taluka General Hospital',
        'Taluka Hospital',
        'Kumta',
        'Uttara Kannada',
        'Main Road, near Court Complex, Kumta, Karnataka 581343',
        ARRAY['+918386222045', '+918386222108'],
        '+918386222045',
        14.4286,
        74.4093,
        '24/7 Casualty & Emergency',
        TRUE
    ),
    (
        'Baad Primary Health Centre',
        'PHC',
        'Kumta',
        'Uttara Kannada',
        'Near Gram Panchayat, Baad Village, Kumta, Karnataka 581351',
        ARRAY['+918386241210'],
        '+918386241210',
        14.4512,
        74.3821,
        '09:00 AM - 04:30 PM (Emergency Call available)',
        FALSE
    ),
    (
        'Karwar District Hospital',
        'Taluka Hospital',
        'Karwar',
        'Uttara Kannada',
        'MG Road, Karwar, Karnataka 581301',
        ARRAY['+918382226250', '+918382226251'],
        '+918382226250',
        14.8135,
        74.1298,
        '24/7 Critical Care & Blood Bank',
        TRUE
    ),
    (
        'Madikeri District Hospital',
        'Taluka Hospital',
        'Madikeri',
        'Kodagu',
        'Hospital Road, Stuart Hill, Madikeri, Karnataka 571201',
        ARRAY['+918272228345', '+918272228346'],
        '+918272228345',
        12.4244,
        75.7382,
        '24/7 Trauma & Emergency',
        TRUE
    )
ON CONFLICT DO NOTHING;
