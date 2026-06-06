-- Central users table mapping firebase UIDs to roles
CREATE TABLE IF NOT EXISTS users (
    firebase_uid VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient profile table
CREATE TABLE IF NOT EXISTS patients (
    firebase_uid VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    age INT,
    blood_group VARCHAR(10),
    preferred_language VARCHAR(100) DEFAULT 'English'
);

-- Doctor profile table
CREATE TABLE IF NOT EXISTS doctors (
    firebase_uid VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    medical_registration_number VARCHAR(100) UNIQUE NOT NULL,
    degree_certificate_url VARCHAR(500),
    experience_years INT,
    specialization VARCHAR(255),
    preferred_language VARCHAR(100),
    online_status BOOLEAN DEFAULT TRUE
);

-- Hospital profile table
CREATE TABLE IF NOT EXISTS hospitals (
    firebase_uid VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    contact_number VARCHAR(50),
    latitude DOUBLE,
    longitude DOUBLE,
    total_beds INT DEFAULT 100,
    available_beds INT DEFAULT 10
);

-- Ambulance provider profile table
CREATE TABLE IF NOT EXISTS ambulances (
    firebase_uid VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
    provider_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(100) UNIQUE NOT NULL,
    driver_name VARCHAR(255),
    contact_number VARCHAR(50),
    latitude DOUBLE,
    longitude DOUBLE,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    assigned_patient_uid VARCHAR(255),
    assigned_hospital_uid VARCHAR(255)
);

-- Blood Bank profile table
CREATE TABLE IF NOT EXISTS blood_banks (
    firebase_uid VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
    blood_bank_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    contact_number VARCHAR(50),
    a_positive INT DEFAULT 10,
    a_negative INT DEFAULT 10,
    b_positive INT DEFAULT 10,
    b_negative INT DEFAULT 10,
    ab_positive INT DEFAULT 10,
    ab_negative INT DEFAULT 10,
    o_positive INT DEFAULT 10,
    o_negative INT DEFAULT 10
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_uid VARCHAR(255) NOT NULL REFERENCES patients(firebase_uid) ON DELETE CASCADE,
    doctor_uid VARCHAR(255) NOT NULL REFERENCES doctors(firebase_uid) ON DELETE CASCADE,
    appointment_date VARCHAR(50) NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultation Rooms table
CREATE TABLE IF NOT EXISTS consultation_rooms (
    id VARCHAR(255) PRIMARY KEY,
    patient_uid VARCHAR(255) NOT NULL REFERENCES patients(firebase_uid) ON DELETE CASCADE,
    doctor_uid VARCHAR(255) NOT NULL REFERENCES doctors(firebase_uid) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'REQUESTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultation Messages table
CREATE TABLE IF NOT EXISTS consultation_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL REFERENCES consultation_rooms(id) ON DELETE CASCADE,
    sender_uid VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',
    original_text TEXT,
    translated_text TEXT,
    audio_data CLOB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Logs table
CREATE TABLE IF NOT EXISTS emergency_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_uid VARCHAR(255) NOT NULL REFERENCES patients(firebase_uid) ON DELETE CASCADE,
    patient_latitude DOUBLE NOT NULL,
    patient_longitude DOUBLE NOT NULL,
    ambulance_uid VARCHAR(255) REFERENCES ambulances(firebase_uid) ON DELETE SET NULL,
    hospital_uid VARCHAR(255) REFERENCES hospitals(firebase_uid) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'DISPATCHED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Requests table
CREATE TABLE IF NOT EXISTS blood_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_uid VARCHAR(255) NOT NULL REFERENCES hospitals(firebase_uid) ON DELETE CASCADE,
    blood_bank_uid VARCHAR(255) NOT NULL REFERENCES blood_banks(firebase_uid) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL,
    required_units INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_uid VARCHAR(255) NOT NULL REFERENCES patients(firebase_uid) ON DELETE CASCADE,
    doctor_uid VARCHAR(255) NOT NULL REFERENCES doctors(firebase_uid) ON DELETE CASCADE,
    medicines TEXT NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    instructions VARCHAR(255) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Tracker table
CREATE TABLE IF NOT EXISTS medicine_tracker (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_uid VARCHAR(255) NOT NULL REFERENCES patients(firebase_uid) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    frequency VARCHAR(255) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
