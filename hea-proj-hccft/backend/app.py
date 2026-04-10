import sys, os
import sqlite3
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r

from db import init_db, get_db, DATABASE
from models.bed import get_all_beds, get_bed_summary, allocate_bed, release_bed, get_occupancy_rate
from models.patient import admit_patient, discharge_patient, get_active_patients, get_patient_stats
from models.paient import (book_appointment, get_appointments, get_appointment_by_id, 
                           confirm_appointment, cancel_appointment, complete_appointment, get_appointment_stats)
from ml.predict import predict_next_72h
from ml.insights import generate_insights
from alerts import check_alerts

app = Flask(__name__)
CORS(app, supports_credentials=True)


@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "HEA API running"})


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


@app.route('/api/patients', methods=['GET'])

def patients():
    return jsonify(get_active_patients())

def get_main_hospital():
    R = 6371
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


@app.route('/api/forecast')
def get_forecast():
    try:
        data = generate_insights(DATABASE)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/alerts')
def alerts():
    return jsonify(check_alerts())


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
    rows = conn.execute("SELECT * FROM hospitals ORDER BY registered_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400
    

    response = {"response": "Chat service is not yet available"}
    return jsonify({"response": response})



@app.route('/api/appointments', methods=['GET'])
def get_all_appointments():
    stats = get_appointment_stats()
    return jsonify(stats)

@app.route('/api/appointments', methods=['POST'])
def book_new_appointment():
    data = request.get_json()
    phone = data.get('phone')
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM appointments WHERE patient_phone=? AND status IN ('pending', 'confirmed') ORDER BY appointment_date ASC, appointment_time ASC",
        (phone,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/appointments/<int:appointment_id>')
def get_appointment(appointment_id):
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    success, message = confirm_appointment(appointment_id)
    return jsonify({"message": message, "appointment_id": appointment_id})

@app.route('/api/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appt(appointment_id):
    data = request.get_json() or {}
    notes = data.get('notes', '')
    
    appointment = get_appointment_by_id(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    success, message = complete_appointment(appointment_id, notes)
    return jsonify({"message": message, "appointment_id": appointment_id})



if __name__ == '__main__':
    print("Initialising HEA database...")
    init_db()
    print("HEA API running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)