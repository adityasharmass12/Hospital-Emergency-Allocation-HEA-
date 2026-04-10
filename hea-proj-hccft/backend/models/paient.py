import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_db


def _assign_ward_based_on_priority(priority, condition):
    priority = priority.lower() if priority else 'normal'
    condition = condition.lower() if condition else ''
    

    if priority in ['critical', 'urgent']:
        return 'ICU'
    

    if 'pediatric' in condition or 'child' in condition or 'infant' in condition:
        return 'Pediatric'
    if 'maternity' in condition or 'pregnancy' in condition or 'prenatal' in condition or 'postnatal' in condition:
        return 'Maternity'
    if 'emergency' in condition or 'trauma' in condition or 'acute' in condition:
        return 'Emergency'
    

    return 'General'


def admit_patient(name, age, gender, condition, priority='normal', ward=None, auto_allocate=True):
    from models.bed import allocate_bed
    
    conn = get_db()
    

    if not ward:
        ward = _assign_ward_based_on_priority(priority, condition)
    
    cur = conn.execute(
        (name, int(age), gender, condition, priority, ward)
    )
    patient_id = cur.lastrowid
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("PATIENT_ADMIT", f"Admitted {name} (ID {patient_id}), condition: {condition}, priority: {priority}, ward: {ward}")
    )
    conn.commit()
    conn.close()
    

    allocated_bed = None
    error_msg = None
    if auto_allocate:
        allocated_bed, error_msg = allocate_bed(patient_id, ward)
    
    return patient_id, allocated_bed, error_msg


def discharge_patient(patient_id):
    conn = get_db()
    rows = conn.execute(
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_patient_stats():
    Find the best available hospital for the appointment.
    Returns (hospital_id, hospital_name, is_available, suggested_time)
    Book a non-emergency appointment with all necessary patient details.
    Also assigns a hospital if available.
    Returns (appointment_id, success_msg, hospital_info) or (None, error_msg, {})
                patient_name, patient_email, patient_phone, patient_age, 
                patient_gender, patient_address, patient_city, patient_state, 
                patient_zip, medical_history, allergies, current_medications,
                appointment_date, appointment_time, appointment_type, specialty,
                reason_for_visit, insurance_provider, insurance_id,
                emergency_contact_name, emergency_contact_phone, 
                hospital_id, hospital_name, availability_status, available_at_requested_time,
                suggested_time, status
    conn = get_db()
    
    if status:
        rows = conn.execute(
            "SELECT * FROM appointments WHERE status=? ORDER BY appointment_date DESC, appointment_time DESC LIMIT ?",
            (status, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM appointments ORDER BY appointment_date DESC, appointment_time DESC LIMIT ?",
            (limit,)
        ).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]


def get_appointment_by_id(appointment_id):
    conn = get_db()
    
    conn.execute(
        "UPDATE appointments SET status='confirmed', confirmed_at=CURRENT_TIMESTAMP WHERE id=?",
        (appointment_id,)
    )
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("APPOINTMENT_CONFIRMED", f"Appointment ID {appointment_id} confirmed by staff")
    )
    conn.commit()
    conn.close()
    
    return True, f"Appointment {appointment_id} confirmed successfully"


def cancel_appointment(appointment_id, reason=''):
    conn = get_db()
    
    conn.execute(
        "UPDATE appointments SET status='completed', completed_at=CURRENT_TIMESTAMP, notes=? WHERE id=?",
        (notes, appointment_id)
    )
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("APPOINTMENT_COMPLETED", f"Appointment ID {appointment_id} completed. Notes: {notes}")
    )
    conn.commit()
    conn.close()
    
    return True, f"Appointment {appointment_id} marked as completed"


def get_appointment_stats():