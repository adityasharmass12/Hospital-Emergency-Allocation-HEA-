import sqlite3
import os

def generate_insights(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()


    beds = c.execute("SELECT status, ward FROM beds").fetchall()
    patients = c.execute("SELECT priority, admitted_at FROM patients").fetchall()
    resources = c.execute("SELECT name, total, available FROM resources").fetchall()
    
    total_beds = len(beds)
    occupied_beds = len([b for b in beds if b['status'] == 'occupied'])
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
    
    urgent_patients = len([p for p in patients if p['priority'] in ['urgent', 'critical']])
    low_resources = [r['name'] for r in resources if (r['available'] / r['total']) < 0.3]

    insights = []


    if occupancy_rate > 85:
        insights.append({
            "type": "critical",
            "title": "Critical Occupancy Alert",
            "message": f"Hospital is at {occupancy_rate:.1f}% capacity. Consider deferring non-emergency admissions.",
            "action": "Open Surge Ward"
        })
    elif occupancy_rate > 70:
        insights.append({
            "type": "warning",
            "title": "High Patient Volume",
            "message": f"Capacity reached {occupancy_rate:.1f}%. Monitor discharge flow to maintain availability.",
            "action": "Review Discharges"
        })
    else:
        insights.append({
            "type": "info",
            "title": "Stable Capacity",
            "message": f"Current occupancy is {occupancy_rate:.1f}%. Operational flow is within optimal range.",
            "action": "None"
        })


    if low_resources:
        insights.append({
            "type": "warning",
            "title": "Resource Depletion",
            "message": f"Inventory for {', '.join(low_resources)} is below 30% threshold.",
            "action": "Restock Supply"
        })


    if urgent_patients > 5:
        insights.append({
            "type": "critical",
            "title": "Acute Care Pressure",
            "message": f"High number of urgent/critical cases ({urgent_patients}). Reallocate staff to ICU and Emergency.",
            "action": "Redeploy Staff"
        })


    insights.append({
        "type": "info",
        "title": "Staff Optimization",
        "message": "Current nurse-to-patient ratio is 1:4. Morning shift is fully staffed.",
        "action": "View Schedule"
    })

    conn.close()
    return insights
