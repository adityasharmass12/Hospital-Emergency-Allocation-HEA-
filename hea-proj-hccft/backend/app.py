"""
HEA — Hospital Emergency Allocation
Main Flask application
"""
import sys, os
import sqlite3
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS  # type: ignore
from math import radians, cos, sin, asin, sqrt

from db import init_db, get_db, DATABASE
from models.bed import get_all_beds, get_bed_summary, allocate_bed, release_bed, get_occupancy_rate
from models.patient import admit_patient, discharge_patient, get_active_patients, get_patient_stats
from models.paient import (book_appointment, get_appointments, get_appointment_by_id, 
                           confirm_appointment, cancel_appointment, complete_appointment, get_appointment_stats)
from ml.predict import predict_next_72h
from ml.insights import generate_insights
from alerts import check_alerts
from auth import register_auth_routes, init_auth_db, jwt_required, admin_required

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Register authentication routes (register, login, refresh, profile)
register_auth_routes(app)

# ─── HEALTH CHECK ───────────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "HEA API running"})

# ─── DASHBOARD SUMMARY ──────────────────────────────────────────
@app.route('/api/dashboard')
def dashboard():
    bed_summary = get_bed_summary()
    patient_stats = get_patient_stats()
    alerts = check_alerts()
    occupancy = get_occupancy_rate()

    conn = get_db()
    resources = [dict(r) for r in conn.execute("SELECT * FROM resources").fetchall()]
    conn.close()

    return jsonify({
        "bed_summary": bed_summary,
        "patient_stats": patient_stats,
        "alerts": alerts,
        "occupancy_rate": occupancy,
        "resources": resources
    })

# ─── BEDS ────────────────────────────────────────────────────────
@app.route('/api/beds')
def beds():
    ward = request.args.get('ward')
    all_beds = get_all_beds()
    if ward:
        all_beds = [b for b in all_beds if b['ward'].lower() == ward.lower()]
    return jsonify(all_beds)

@app.route('/api/beds/summary')
def beds_summary():
    return jsonify(get_bed_summary())

@app.route('/api/wards/capacity', methods=['POST'])
def update_capacity():
    from models.bed import update_ward_capacity
    data = request.get_json()
    ward = data.get('ward')
    total = data.get('total')
    if not ward or total is None:
        return jsonify({"error": "ward and total are required"}), 400
    
    success, msg = update_ward_capacity(ward, int(total))
    if not success:
        return jsonify({"error": msg}), 400
    return jsonify({"message": msg})

@app.route('/api/beds/allocate', methods=['POST'])
def allocate():
    data = request.get_json()
    patient_id = data.get('patient_id')
    ward = data.get('ward')
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
    bed, err = allocate_bed(patient_id, ward)
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"bed": bed, "message": "Bed allocated successfully"})

@app.route('/api/beds/release', methods=['POST'])
def release():
    data = request.get_json()
    bed_id = data.get('bed_id')
    if not bed_id:
        return jsonify({"error": "bed_id is required"}), 400
    release_bed(bed_id)
    return jsonify({"message": "Bed released"})

@app.route('/api/beds/<int:bed_id>/status', methods=['PUT'])
def update_bed_status(bed_id):
    data = request.get_json()
    status = data.get('status')
    if status not in ['available', 'occupied', 'maintenance']:
        return jsonify({"error": "Invalid status"}), 400
    conn = get_db()
    conn.execute("UPDATE beds SET status=? WHERE id=?", (status, bed_id))
    conn.execute("INSERT INTO audit_log (action, details) VALUES (?, ?)",
                 ("BED_STATUS_CHANGE", f"Bed {bed_id} set to {status}"))
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated"})

# ─── PATIENTS ────────────────────────────────────────────────────
@app.route('/api/patients', methods=['GET'])

def patients():
    return jsonify(get_active_patients())

def get_main_hospital():
    """Get the main hospital info (or a default one) for patient admissions."""
    conn = get_db()
    # Try to get the first hospital marked as main, or get the closest one
    hospital = conn.execute(
        "SELECT * FROM nearby_hospitals ORDER BY id LIMIT 1"
    ).fetchone()
    conn.close()
    
    if hospital:
        return dict(hospital)
    
    # Fallback if no hospitals in DB
    return {
        "id": 0,
        "name": "AuraCare Central Hospital",
        "address": "123 Medical Complex, Healthcare City",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "phone": "+1-800-HOSPITAL",
        "type": "General Hospital",
        "rating": 4.8,
        "has_ambulance": 1,
        "is_open_24h": 1
    }

@app.route('/api/patients/admit', methods=['POST'])
def admit():
    data = request.get_json()
    
    # Validate all required fields with proper error messages
    if not data.get('name') or not str(data.get('name')).strip():
        return jsonify({"error": "name is required"}), 400
    
    # Validate age - must be a positive number
    age = data.get('age')
    if age is None:
        return jsonify({"error": "age is required"}), 400
    
    try:
        age = int(age) if isinstance(age, str) else age
        if age <= 0 or age > 150:
            return jsonify({"error": "age must be between 1 and 150"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "age must be a valid number"}), 400
    
    if not data.get('gender'):
        return jsonify({"error": "gender is required"}), 400
    
    if not data.get('condition') or not str(data.get('condition')).strip():
        return jsonify({"error": "condition is required"}), 400

    try:
        patient_id, allocated_bed, error_msg = admit_patient(
            name=data['name'],
            age=age,
            gender=data['gender'],
            condition=data['condition'],
            priority=data.get('priority', 'normal'),
            ward=data.get('ward'),
            auto_allocate=True
        )
        
        hospital = get_main_hospital()
        
        if error_msg and not allocated_bed:
            return jsonify({
                "patient_id": patient_id,
                "bed": None,
                "hospital": hospital,
                "message": f"Patient admitted successfully but bed allocation failed: {error_msg}"
            }), 207
        
        return jsonify({
            "patient_id": patient_id,
            "bed": allocated_bed,
            "hospital": hospital,
            "message": f"Patient admitted successfully and bed {allocated_bed['bed_number']} allocated automatically!" if allocated_bed else "Patient admitted but no bed available"
        })
    except Exception as e:
        return jsonify({"error": f"Failed to admit patient: {str(e)}"}), 500

@app.route('/api/patients/<int:patient_id>/discharge', methods=['POST'])
def discharge(patient_id):
    ok, msg = discharge_patient(patient_id)
    if not ok:
        return jsonify({"error": msg}), 404
    return jsonify({"message": msg})

# ─── STAFF ───────────────────────────────────────────────────────
@app.route('/api/staff')
def staff():
    conn = get_db()
    rows = conn.execute("SELECT * FROM staff").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# ─── NEARBY HOSPITALS ────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two lat/lng points using Haversine formula."""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))

@app.route('/api/nearby-hospitals')
def nearby_hospitals():
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)
    radius_km = request.args.get('radius_km', default=50, type=float)

    conn = get_db()
    rows = conn.execute("SELECT * FROM nearby_hospitals").fetchall()
    conn.close()

    hospitals = [dict(r) for r in rows]

    # If user location is available, calculate real Haversine distances
    if user_lat is not None and user_lng is not None:
        for h in hospitals:
            h['distance_km'] = round(
                haversine(user_lat, user_lng, h['latitude'], h['longitude']), 1
            )
        hospitals = [h for h in hospitals if h['distance_km'] <= radius_km]
        hospitals.sort(key=lambda h: h['distance_km'])
    else:
        hospitals.sort(key=lambda h: h['distance_km'])

    return jsonify(hospitals)

# ─── ML & AI INSIGHTS ────────────────────────────────────────────
@app.route('/api/forecast')
def get_forecast():
    """Returns 72-hour admission predictions from the ML model."""
    try:
        data = predict_next_72h()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/insights')
def get_insights():
    """Produces AI-driven operational insights based on hospital state."""
    try:
        data = generate_insights(DATABASE)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── ALERTS ──────────────────────────────────────────────────────
@app.route('/api/alerts')
def alerts():
    return jsonify(check_alerts())

# ─── RESOURCES ───────────────────────────────────────────────────
@app.route('/api/resources')
def resources():
    conn = get_db()
    rows = conn.execute("SELECT * FROM resources").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/resources/<int:res_id>', methods=['PUT'])
def update_resource(res_id):
    data = request.get_json()
    available = data.get('available')
    conn = get_db()
    conn.execute("UPDATE resources SET available=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                 (available, res_id))
    conn.execute("INSERT INTO audit_log (action, details) VALUES (?, ?)",
                 ("RESOURCE_UPDATE", f"Resource {res_id} set available={available}"))
    conn.commit()
    conn.close()
    return jsonify({"message": "Updated"})

# ─── REPORTS ─────────────────────────────────────────────────────
@app.route('/api/reports/audit')
def audit_log():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100"
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/reports/pdf')
def download_pdf():
    try:
        from reports.generate_pdf import generate_report
        path = generate_report()
        return send_file(path, as_attachment=True, download_name="HEA_Report.pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── HOSPITAL REGISTRATION ───────────────────────────────────────
@app.route('/api/hospitals/register', methods=['POST'])
def register_hospital():
    data = request.get_json()
    name = data.get('hospital_name')
    location = data.get('location')
    contact = data.get('contact')
    bed_capacity = data.get('bed_capacity', 0)
    icu_availability = data.get('icu_availability', 0)
    if not name or not location:
        return jsonify({"error": "Hospital name and location are required"}), 400
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, location TEXT, contact TEXT,
        bed_capacity INTEGER DEFAULT 0, icu_availability INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending', registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.execute(
        "INSERT INTO hospitals (name, location, contact, bed_capacity, icu_availability) VALUES (?,?,?,?,?)",
        (name, location, contact, bed_capacity, icu_availability)
    )
    conn.execute("INSERT INTO audit_log (action, details) VALUES (?, ?)",
                 ("HOSPITAL_REGISTERED", f"{name} at {location}"))
    conn.commit()
    conn.close()
    return jsonify({"message": f"{name} registered successfully", "status": "pending"})

@app.route('/api/hospitals')
def list_hospitals():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, location TEXT, contact TEXT,
        bed_capacity INTEGER DEFAULT 0, icu_availability INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending', registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    rows = conn.execute("SELECT * FROM hospitals ORDER BY registered_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/chat', methods=['POST'])
def chat():
    from chat import process_chat
    data = request.get_json()
    query = data.get('query')
    context = data.get('context', 'admin')
    session_id = data.get('session_id', 'default')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    response = process_chat(query, context, session_id)
    return jsonify({"response": response})


# ─── APPOINTMENTS (Non-Emergency Booking) ───────────────────────
@app.route('/api/appointments', methods=['GET'])
def get_all_appointments():
    """Get all appointments with optional status filter."""
    status = request.args.get('status')
    appointments = get_appointments(status=status)
    return jsonify(appointments)

@app.route('/api/appointments/stats')
def appointment_stats():
    """Get appointment statistics."""
    stats = get_appointment_stats()
    return jsonify(stats)

@app.route('/api/appointments', methods=['POST'])
def book_new_appointment():
    """Book a new non-emergency appointment with all patient details."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = [
        'patient_name', 'patient_phone', 'patient_age', 'patient_gender',
        'appointment_date', 'appointment_time', 'appointment_type', 
        'specialty', 'reason_for_visit'
    ]
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    # Validate age
    try:
        age = int(data.get('patient_age', 0))
        if age <= 0 or age > 150:
            return jsonify({"error": "Age must be between 1 and 150"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a valid number"}), 400
    
    appointment_id, message, hospital_info = book_appointment(data)
    
    if appointment_id is None:
        return jsonify({"error": message}), 500
    
    appointment = get_appointment_by_id(appointment_id)
    return jsonify({
        "appointment_id": appointment_id,
        "appointment": appointment,
        "message": message,
        "hospital_info": hospital_info
    }), 201

@app.route('/api/appointments/patient/<phone>', methods=['GET'])
def get_patient_appointments(phone):
    """Get all appointments for a patient by phone number."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM appointments WHERE patient_phone=? AND status IN ('pending', 'confirmed') ORDER BY appointment_date ASC, appointment_time ASC",
        (phone,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/appointments/<int:appointment_id>')
def get_appointment(appointment_id):
    """Get a specific appointment by ID."""
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    return jsonify(appointment)

@app.route('/api/appointments/<int:appointment_id>/confirm', methods=['POST'])
def confirm_appt(appointment_id):
    """Confirm an appointment."""
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    success, message = confirm_appointment(appointment_id)
    return jsonify({"message": message, "appointment_id": appointment_id})

@app.route('/api/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appt(appointment_id):
    """Cancel an appointment."""
    data = request.get_json() or {}
    reason = data.get('reason', '')
    
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    success, message = cancel_appointment(appointment_id, reason)
    return jsonify({"message": message, "appointment_id": appointment_id})

@app.route('/api/appointments/<int:appointment_id>/complete', methods=['POST'])
def complete_appt(appointment_id):
    """Mark an appointment as completed."""
    data = request.get_json() or {}
    notes = data.get('notes', '')
    
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    success, message = complete_appointment(appointment_id, notes)
    return jsonify({"message": message, "appointment_id": appointment_id})


# ─── STARTUP ─────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Initialising HEA database...")
    init_db()
    print("Initialising auth system...")
    init_auth_db()
    print("HEA API running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)