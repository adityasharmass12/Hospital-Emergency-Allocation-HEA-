import sqlite3
import os

DATABASE = os.path.join(os.path.dirname(__file__), '..', 'database', 'hea.db')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Beds table
    c.execute('''CREATE TABLE IF NOT EXISTS beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bed_number TEXT NOT NULL UNIQUE,
        ward TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        patient_id INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Patients table
    c.execute('''CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        condition TEXT,
        priority TEXT DEFAULT 'normal',
        ward TEXT,
        bed_number TEXT,
        admitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discharged_at TIMESTAMP,
        bed_id INTEGER
    )''')

    # Appointments table (for non-emergency booking)
    c.execute('''CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        patient_email TEXT,
        patient_phone TEXT NOT NULL,
        patient_age INTEGER NOT NULL,
        patient_gender TEXT NOT NULL,
        patient_address TEXT,
        patient_city TEXT,
        patient_state TEXT,
        patient_zip TEXT,
        medical_history TEXT,
        allergies TEXT,
        current_medications TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        appointment_type TEXT NOT NULL,
        specialty TEXT NOT NULL,
        reason_for_visit TEXT NOT NULL,
        insurance_provider TEXT,
        insurance_id TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        hospital_id INTEGER,
        hospital_name TEXT,
        availability_status TEXT DEFAULT 'pending',
        available_at_requested_time INTEGER DEFAULT 0,
        suggested_time TEXT,
        status TEXT DEFAULT 'pending',
        booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT
    )''')

    # Resources table (ventilators, OT rooms, etc.)
    c.execute('''CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        total INTEGER DEFAULT 0,
        available INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Audit log table
    c.execute('''CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        performed_by TEXT DEFAULT 'system',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Staff table
    c.execute('''CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        ward TEXT,
        shift TEXT,
        on_duty INTEGER DEFAULT 1
    )''')

    # Nearby Hospitals table
    c.execute('''CREATE TABLE IF NOT EXISTS nearby_hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        distance_km REAL,
        latitude REAL,
        longitude REAL,
        phone TEXT,
        type TEXT,
        rating REAL,
        total_beds INTEGER DEFAULT 0,
        available_beds INTEGER DEFAULT 0,
        icu_total INTEGER DEFAULT 0,
        icu_available INTEGER DEFAULT 0,
        emergency_total INTEGER DEFAULT 0,
        emergency_available INTEGER DEFAULT 0,
        general_total INTEGER DEFAULT 0,
        general_available INTEGER DEFAULT 0,
        has_ambulance INTEGER DEFAULT 0,
        is_open_24h INTEGER DEFAULT 0,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    conn.commit()

    # Seed initial beds structure (required for bed allocation)
    _seed_beds_only(conn)
    conn.close()

def _seed_beds_only(conn):
    """Seed only the bed structure (no dummy patient data)."""
    c = conn.cursor()

    # Seed beds (only if empty) - Required for bed allocation to work
    c.execute("SELECT COUNT(*) FROM beds")
    if c.fetchone()[0] == 0:
        wards = [
            ("General", "w", 20),
            ("ICU", "i", 8),
            ("Emergency", "e", 10),
            ("Pediatric", "p", 12),
            ("Maternity", "m", 8),
        ]
        for ward_name, ward_code, count in wards:
            for i in range(1, count + 1):
                # Bed Numbering: e.g. G-101, I-201
                prefix = ward_code.upper()
                start_num = {"GENERAL": 100, "ICU": 200, "EMERGENCY": 300, "PEDIATRIC": 400, "MATERNITY": 500}
                bed_num = f"{prefix}-{start_num.get(ward_name.upper(), 0) + i}"
                c.execute(
                    "INSERT INTO beds (bed_number, ward, type, status) VALUES (?, ?, ?, 'available')",
                    (bed_num, ward_name, ward_code)
                )

    conn.commit()
