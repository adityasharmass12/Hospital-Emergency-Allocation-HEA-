import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_db


def get_all_beds():
    conn = get_db()
    rows = conn.execute("SELECT * FROM beds ORDER BY ward, bed_number").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_bed_summary():
                  COUNT(*) AS total,
                  SUM(CASE WHEN status='available'   THEN 1 ELSE 0 END) AS available,
                  SUM(CASE WHEN status='occupied'    THEN 1 ELSE 0 END) AS occupied,
                  SUM(CASE WHEN status='maintenance' THEN 1 ELSE 0 END) AS maintenance
    conn = get_db()

    if preferred_ward:
        bed = conn.execute(
            "SELECT * FROM beds WHERE status='available' AND ward=? ORDER BY id LIMIT 1",
            (preferred_ward,)
        ).fetchone()

    if not preferred_ward or not bed:
        bed = conn.execute(
            "SELECT * FROM beds WHERE status='available' ORDER BY id LIMIT 1"
        ).fetchone()

    if not bed:
        conn.close()
        return None, "No beds available"

    conn.execute(
        "UPDATE beds SET status='occupied', patient_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (patient_id, bed['id'])
    )
    conn.execute(
        "INSERT INTO audit_log (action, details) VALUES (?, ?)",
        ("BED_ALLOCATE", f"Bed {bed['bed_number']} allocated to patient {patient_id}")
    )
    conn.commit()
    result = dict(bed)
    result['status'] = 'occupied'
    result['patient_id'] = patient_id
    conn.close()
    return result, None


def release_bed(bed_id):
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) AS occupied FROM beds"
    ).fetchone()
    conn.close()
    if not row or row['total'] == 0:
        return 0
    return round((row['occupied'] / row['total']) * 100, 1)


def update_ward_capacity(ward_name, new_total):
    conn = get_db()
    current_beds = conn.execute(
        "SELECT * FROM beds WHERE ward = ? ORDER BY id", (ward_name,)
    ).fetchall()
    
    current_count = len(current_beds)
    if new_total == current_count:
        conn.close()
        return True, "No changes needed"
    
    if new_total > current_count:

        to_add = new_total - current_count



        if current_count > 0:
            sample_bed = current_beds[0]
            prefix = sample_bed['bed_number'].split('-')[0]
            bed_type = sample_bed['type']

            max_num = 0
            for b in current_beds:
                try:
                    num = int(b['bed_number'].split('-')[1])
                    if num > max_num: max_num = num
                except: pass
        else:

            mapping = {"General": "G", "ICU": "I", "Emergency": "E", "Pediatric": "P", "Maternity": "M"}
            prefix = mapping.get(ward_name, ward_name[0].upper())
            bed_type = ward_name.lower()
            max_num = 100
        
        for i in range(1, to_add + 1):
            new_num = f"{prefix}-{max_num + i}"
            conn.execute(
                "INSERT INTO beds (bed_number, ward, type, status) VALUES (?, ?, ?, 'available')",
                (new_num, ward_name, bed_type)
            )
        
        conn.execute("INSERT INTO audit_log (action, details) VALUES (?, ?)",
                     ("CAPACITY_INCREASE", f"Added {to_add} beds to {ward_name} ward"))
        conn.commit()
    
    else:

        to_remove = current_count - new_total

        avail_beds = [b for b in current_beds if b['status'] == 'available']
        if len(avail_beds) < to_remove:
            conn.close()
            return False, f"Cannot reduce capacity. Ward has {current_count - len(avail_beds)} occupied/maintenance beds, needs at least {new_total}."
        

        avail_beds_ids = [b['id'] for b in avail_beds[-to_remove:]]
        placeholders = ', '.join(['?'] * len(avail_beds_ids))
        conn.execute(f"DELETE FROM beds WHERE id IN ({placeholders})", avail_beds_ids)
        
        conn.execute("INSERT INTO audit_log (action, details) VALUES (?, ?)",
                     ("CAPACITY_DECREASE", f"Removed {to_remove} beds from {ward_name} ward"))
        conn.commit()

    conn.close()
    return True, f"Capacity updated to {new_total} beds"
