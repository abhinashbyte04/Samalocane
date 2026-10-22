-- Samālōcane PostgreSQL DDL Schema
-- Smart Healthcare and Doctor Recommendation Platform for Low-Bandwidth Coastal & Hill Talukas
-- Phase 2 Database Architecture

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Medical Specialties
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_specialties_keywords ON specialties USING GIN(keywords);

-- 3. Patient Profiles (Enhanced for Phase 2)
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dob DATE,
    gender VARCHAR(50),
    phone_number VARCHAR(20),
    taluka VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    current_symptoms TEXT,
    symptom_duration VARCHAR(50),
    symptom_severity VARCHAR(20), -- 'Mild', 'Moderate', 'Severe'
    previous_medical_history TEXT,
    chronic_conditions TEXT[] DEFAULT '{}',
    current_medications TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_taluka ON patient_profiles(taluka);

-- 4. Doctor Profiles (Enhanced with fees and verification)
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    council_registration_number VARCHAR(100) UNIQUE NOT NULL,
    council_name VARCHAR(200) NOT NULL,
    registration_year INT NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    specialty_id UUID NOT NULL REFERENCES specialties(id),
    specialty_name VARCHAR(100),
    experience_years INT NOT NULL DEFAULT 0,
    bio TEXT,
    consultation_fee INT NOT NULL DEFAULT 0, -- In INR (₹)
    languages_spoken TEXT[] NOT NULL DEFAULT '{"Kannada", "English"}',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    consultation_modes TEXT[] NOT NULL DEFAULT '{"text", "audio"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctor_profiles(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verified_available ON doctor_profiles(is_verified, is_available);

-- 5. Doctor Availability Time Slots
CREATE TABLE IF NOT EXISTS doctor_availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON doctor_availability_slots(doctor_id, slot_date);

-- 6. Consultations with 9-State State Machine
DO $$ BEGIN
    CREATE TYPE consultation_status AS ENUM (
        'draft',
        'submitted',
        'pending_doctor_review',
        'accepted',
        'waiting',
        'in_progress',
        'completed',
        'rejected',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consultation_mode AS ENUM ('text', 'audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    status consultation_status NOT NULL DEFAULT 'submitted',
    requested_mode consultation_mode NOT NULL DEFAULT 'audio',
    actual_mode_used VARCHAR(50) DEFAULT 'audio',
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    slot_id UUID REFERENCES doctor_availability_slots(id),
    cancellation_reason TEXT,
    rejection_reason TEXT,
    doctor_notes TEXT,
    diagnosis_summary TEXT,
    follow_up_date DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_ref ON consultations(reference_number);

-- 7. Consultation Status Transition History (Audit Trail)
CREATE TABLE IF NOT EXISTS consultation_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    from_status consultation_status NOT NULL,
    to_status consultation_status NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_role user_role NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_consultation ON consultation_status_history(consultation_id, created_at ASC);

-- 8. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID UNIQUE NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    dietary_advice TEXT,
    general_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8b. Real-Time Consultation Communication Sessions
DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM (
        'created',
        'waiting_peer',
        'ready',
        'active',
        'reconnecting',
        'completed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS consultation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID UNIQUE NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    session_status session_status_enum NOT NULL DEFAULT 'created',
    patient_present BOOLEAN NOT NULL DEFAULT FALSE,
    doctor_present BOOLEAN NOT NULL DEFAULT FALSE,
    patient_joined_at TIMESTAMP WITH TIME ZONE,
    doctor_joined_at TIMESTAMP WITH TIME ZONE,
    patient_last_seen TIMESTAMP WITH TIME ZONE,
    doctor_last_seen TIMESTAMP WITH TIME ZONE,
    active_mode VARCHAR(20) NOT NULL DEFAULT 'audio',
    connection_tier VARCHAR(20) NOT NULL DEFAULT 'good',
    reconnect_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_consultation ON consultation_sessions(consultation_id);

-- 9. Real-Time Messages
DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('text', 'system_event', 'clinical_note');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    client_msg_id UUID UNIQUE NOT NULL,
    content TEXT NOT NULL,
    message_type message_type_enum NOT NULL DEFAULT 'text',
    server_received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_consultation ON messages(consultation_id, server_received_at ASC);

-- 9b. WebRTC Signaling Messages
DO $$ BEGIN
    CREATE TYPE signal_type_enum AS ENUM ('offer', 'answer', 'ice_candidate', 'call_ready', 'call_ended', 'call_error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS consultation_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    signal_type signal_type_enum NOT NULL,
    payload JSONB NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signals_recipient ON consultation_signals(consultation_id, recipient_id, delivered);

-- 10. Genuine Patient Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID UNIQUE NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_doctor ON feedback(doctor_id);

-- 11. Primary Health Centre (PHC) Directory
DO $$ BEGIN
    CREATE TYPE facility_type_enum AS ENUM ('PHC', 'CHC', 'Sub-Centre', 'Taluka Hospital');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS phc_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    facility_type facility_type_enum NOT NULL DEFAULT 'PHC',
    taluka VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    contact_numbers TEXT[] NOT NULL DEFAULT '{}',
    emergency_phone VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    operating_hours VARCHAR(100) DEFAULT '24/7',
    ambulance_available BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phc_taluka ON phc_facilities(taluka);

-- 12. Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    target_id UUID,
    ip_address VARCHAR(45),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
