"""
models/patient.py  (note: filename is paient.py to match original project)
Functions for admitting, discharging, and querying patients.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_db


def _assign_ward_based_on_priority(priority, condition):
    """
    Intelligently assign a ward based on patient priority and condition.
    Returns the recommended ward name.
    """
    priority = priority.lower() if priority else 'normal'
    condition = condition.lower() if condition else ''
    
    # Critical/Urgent → ICU
    if priority in ['critical', 'urgent']:
        return 'ICU'
    
    # Check condition keywords for specialty wards
    if 'pediatric' in condition or 'child' in condition or 'infant' in condition:
        return 'Pediatric'
    if 'maternity' in condition or 'pregnancy' in condition or 'prenatal' in condition or 'postnatal' in condition:
        return 'Maternity'
    if 'emergency' in condition or 'trauma' in condition or 'acute' in condition:
        return 'Emergency'
    
    # Default to General ward
    return 'General'


def admit_patient(name, age, gender, condition, priority='normal', ward=None, auto_allocate=True):
    """
    Insert a new patient row, auto-assign ward, and optionally allocate a bed.
    Returns (patient_id, allocated_bed_dict or None, error_msg or None)
    """
    from models.bed import allocate_bed
    
    conn = get_db()
    
    # Auto-assign ward if not provided
    if not ward:
        ward = _assign_ward_based_on_priority(priority, condition)
    
    cur = conn.execute(
        """INSERT INTO patients (name, age, gender, condition, priority, ward)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (name, int(age), gender, condition, priority, ward)
    )
    patient_id = cur.lastrowid
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("PATIENT_ADMIT", f"Admitted {name} (ID {patient_id}), condition: {condition}, priority: {priority}, ward: {ward}")
    )
    conn.commit()
    conn.close()
    
    # Auto-allocate bed if enabled
    allocated_bed = None
    error_msg = None
    if auto_allocate:
        allocated_bed, error_msg = allocate_bed(patient_id, ward)
    
    return patient_id, allocated_bed, error_msg


def discharge_patient(patient_id):
    """Mark a patient as discharged and release their bed."""
    conn = get_db()
    patient = conn.execute(
        "SELECT * FROM patients WHERE id=? AND discharged_at IS NULL", (patient_id,)
    ).fetchone()

    if not patient:
        conn.close()
        return False, "Patient not found or already discharged"

    conn.execute(
        "UPDATE beds SET status='available', patient_id=NULL, updated_at=CURRENT_TIMESTAMP WHERE patient_id=?",
        (patient_id,)
    )
    conn.execute(
        "UPDATE patients SET discharged_at=CURRENT_TIMESTAMP WHERE id=?",
        (patient_id,)
    )
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("PATIENT_DISCHARGE", f"Discharged patient ID {patient_id} ({patient['name']})")
    )
    conn.commit()
    conn.close()
    return True, f"Patient {patient['name']} discharged successfully"


def get_active_patients():
    """Return all patients who have not yet been discharged, with their bed info."""
    conn = get_db()
    rows = conn.execute(
        """SELECT p.*, b.bed_number, b.ward
           FROM patients p
           LEFT JOIN beds b ON b.patient_id = p.id
           WHERE p.discharged_at IS NULL
           ORDER BY p.admitted_at DESC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_patient_stats():
    """Return aggregate counts used by the dashboard."""
    conn = get_db()
    total  = conn.execute("SELECT COUNT(*) FROM patients WHERE discharged_at IS NULL").fetchone()[0]
    urgent = conn.execute(
        "SELECT COUNT(*) FROM patients WHERE discharged_at IS NULL AND priority IN ('urgent','critical')"
    ).fetchone()[0]
    today  = conn.execute(
        "SELECT COUNT(*) FROM patients WHERE DATE(admitted_at)=DATE('now')"
    ).fetchone()[0]
    conn.close()
    return {"total_active": total, "urgent": urgent, "admitted_today": today}


# ──────────────────────────────────────────────────────────────────────
# Appointment Booking Functions (Non-Emergency)
# ──────────────────────────────────────────────────────────────────────

def _find_best_hospital_for_appointment(appointment_date, appointment_time, specialty, conn=None):
    """
    Find the best available hospital for the appointment.
    Returns (hospital_id, hospital_name, is_available, suggested_time)
    """
    if conn is None:
        conn = get_db()
    
    # Get all hospitals
    hospitals = conn.execute("SELECT * FROM nearby_hospitals ORDER BY rating DESC").fetchall()
    
    if not hospitals:
        return None, None, False, None
    
    # For now, assign to nearest/best hospital
    # In production, this would check actual appointment slots/availability
    best_hospital = hospitals[0]
    
    # For this implementation:
    # - If it's during business hours (09:00-17:00), mark as available
    # - Otherwise suggest next business day same time
    from datetime import datetime, timedelta
    
    try:
        appt_time = datetime.strptime(appointment_time, "%H:%M")
        is_available = 9 <= appt_time.hour < 17
        
        suggested_time = None
        if not is_available:
            # Suggest next business day at 10:00 AM
            appt_date = datetime.strptime(appointment_date, "%Y-%m-%d")
            next_day = appt_date + timedelta(days=1)
            suggested_time = next_day.strftime("%Y-%m-%d") + " 10:00"
    except:
        is_available = False
        suggested_time = None
    
    return best_hospital['id'], best_hospital['name'], is_available, suggested_time


def book_appointment(appointment_data):
    """
    Book a non-emergency appointment with all necessary patient details.
    Also assigns a hospital if available.
    Returns (appointment_id, success_msg, hospital_info) or (None, error_msg, {})
    """
    conn = get_db()
    
    try:
        # Find best hospital for this appointment
        hospital_id, hospital_name, is_available, suggested_time = _find_best_hospital_for_appointment(
            appointment_data.get('appointment_date'),
            appointment_data.get('appointment_time'),
            appointment_data.get('specialty'),
            conn
        )
        
        cur = conn.execute(
            """INSERT INTO appointments (
                patient_name, patient_email, patient_phone, patient_age, 
                patient_gender, patient_address, patient_city, patient_state, 
                patient_zip, medical_history, allergies, current_medications,
                appointment_date, appointment_time, appointment_type, specialty,
                reason_for_visit, insurance_provider, insurance_id,
                emergency_contact_name, emergency_contact_phone, 
                hospital_id, hospital_name, availability_status, available_at_requested_time,
                suggested_time, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                appointment_data.get('patient_name'),
                appointment_data.get('patient_email'),
                appointment_data.get('patient_phone'),
                int(appointment_data.get('patient_age', 0)),
                appointment_data.get('patient_gender'),
                appointment_data.get('patient_address'),
                appointment_data.get('patient_city'),
                appointment_data.get('patient_state'),
                appointment_data.get('patient_zip'),
                appointment_data.get('medical_history'),
                appointment_data.get('allergies'),
                appointment_data.get('current_medications'),
                appointment_data.get('appointment_date'),
                appointment_data.get('appointment_time'),
                appointment_data.get('appointment_type'),
                appointment_data.get('specialty'),
                appointment_data.get('reason_for_visit'),
                appointment_data.get('insurance_provider'),
                appointment_data.get('insurance_id'),
                appointment_data.get('emergency_contact_name'),
                appointment_data.get('emergency_contact_phone'),
                hospital_id,
                hospital_name,
                'available' if is_available else 'unavailable',
                1 if is_available else 0,
                suggested_time,
                'confirmed' if is_available else 'pending'
            )
        )
        appointment_id = cur.lastrowid
        
        conn.execute(
            "INSERT INTO audit_log (action, details) VALUES (?, ?)",
            ("APPOINTMENT_BOOKED", 
             f"Appointment booked for {appointment_data.get('patient_name')} (ID {appointment_id}), "
             f"{appointment_data.get('specialty')} at {hospital_name} on {appointment_data.get('appointment_date')} at {appointment_data.get('appointment_time')}")
        )
        conn.commit()
        conn.close()
        
        hospital_info = {
            'hospital_id': hospital_id,
            'hospital_name': hospital_name,
            'is_available': is_available,
            'suggested_time': suggested_time
        }
        
        msg = f"Appointment confirmed at {hospital_name}!" if is_available else f"Appointment pending approval. Suggested time: {suggested_time}"
        return appointment_id, msg, hospital_info
    
    except Exception as e:
        conn.close()
        return None, f"Error booking appointment: {str(e)}", {}


def get_appointments(status=None, limit=50):
    """Get all appointments with optional status filter."""
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
    """Get a specific appointment by ID."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM appointments WHERE id=?",
        (appointment_id,)
    ).fetchone()
    conn.close()
    
    return dict(row) if row else None


def confirm_appointment(appointment_id):
    """Confirm an appointment (change status to confirmed)."""
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
    """Cancel an appointment."""
    conn = get_db()
    
    conn.execute(
        "UPDATE appointments SET status='cancelled' WHERE id=?",
        (appointment_id,)
    )
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("APPOINTMENT_CANCELLED", f"Appointment ID {appointment_id} cancelled. Reason: {reason}")
    )
    conn.commit()
    conn.close()
    
    return True, f"Appointment {appointment_id} cancelled"


def complete_appointment(appointment_id, notes=''):
    """Mark appointment as completed."""
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
    """Get appointment statistics."""
    conn = get_db()
    
    total = conn.execute("SELECT COUNT(*) FROM appointments").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM appointments WHERE status='pending'").fetchone()[0]
    confirmed = conn.execute("SELECT COUNT(*) FROM appointments WHERE status='confirmed'").fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM appointments WHERE status='completed'").fetchone()[0]
    cancelled = conn.execute("SELECT COUNT(*) FROM appointments WHERE status='cancelled'").fetchone()[0]
    
    conn.close()
    
    return {
        "total_appointments": total,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled
    }
