import sqlite3
import os
import uuid
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "feedback.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite feedback database table if it doesn't exist and populates sample entries if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedbacks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            rating INTEGER NOT NULL,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            session_id TEXT,
            status TEXT DEFAULT 'Pending',
            admin_notes TEXT DEFAULT '',
            created_at REAL NOT NULL
        )
    """)
    conn.commit()

    # Check if empty and seed initial demo feedback entries
    cursor.execute("SELECT COUNT(*) FROM feedbacks")
    count = cursor.fetchone()[0]
    if count == 0:
        now = time.time()
        seed_data = [
            (
                f"fb_seed_{uuid.uuid4().hex[:8]}",
                "Rajesh V.",
                "rajesh@example.com",
                5,
                "Clinical Quality",
                "The AI health assistant gave clear guidance for my symptom query! Excellent speed and accuracy.",
                "session-demo-001",
                "Reviewed",
                "Verified AI triage logs. Patient provided positive review.",
                now - 3600 * 24
            ),
            (
                f"fb_seed_{uuid.uuid4().hex[:8]}",
                "Priya Sharma",
                "priya@example.com",
                4,
                "Feature Request",
                "Loved the HIPAA privacy features. Would be great to export consultation summaries to PDF.",
                "session-demo-002",
                "Pending",
                "",
                now - 3600 * 5
            ),
            (
                f"fb_seed_{uuid.uuid4().hex[:8]}",
                "Anonymous Patient",
                "",
                5,
                "General Feedback",
                "Super smooth UI and easy document upload feature. Keep up the good work!",
                "session-demo-003",
                "Resolved",
                "Acknowledged patient feedback.",
                now - 3600 * 2
            )
        ]
        cursor.executemany("""
            INSERT INTO feedbacks (id, name, email, rating, category, message, session_id, status, admin_notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_data)
        conn.commit()

    conn.close()

# Auto-initialize DB on import
init_db()


def create_feedback(name: str, email: str, rating: int, category: str, message: str, session_id: str = "") -> dict:
    feedback_id = f"fb_{uuid.uuid4().hex[:10]}"
    now = time.time()
    user_name = name.strip() if name and name.strip() else "Anonymous Patient"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO feedbacks (id, name, email, rating, category, message, session_id, status, admin_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?)
        """,
        (feedback_id, user_name, email.strip() if email else "", rating, category, message.strip(), session_id, now)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": feedback_id,
        "name": user_name,
        "email": email,
        "rating": rating,
        "category": category,
        "message": message,
        "session_id": session_id,
        "status": "Pending",
        "admin_notes": "",
        "created_at": now
    }

def get_all_feedbacks(category_filter: str = None, status_filter: str = None, rating_filter: int = None) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM feedbacks WHERE 1=1"
    params = []
    
    if category_filter and category_filter != "All":
        query += " AND category = ?"
        params.append(category_filter)
        
    if status_filter and status_filter != "All":
        query += " AND status = ?"
        params.append(status_filter)
        
    if rating_filter and rating_filter > 0:
        query += " AND rating = ?"
        params.append(rating_filter)
        
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_feedback_stats() -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*), AVG(rating) FROM feedbacks")
    total_count, avg_rating = cursor.fetchone()
    avg_rating = round(avg_rating, 1) if avg_rating else 0.0
    
    rating_counts = {}
    for r in range(1, 6):
        cursor.execute("SELECT COUNT(*) FROM feedbacks WHERE rating = ?", (r,))
        rating_counts[str(r)] = cursor.fetchone()[0]
        
    cursor.execute("SELECT status, COUNT(*) FROM feedbacks GROUP BY status")
    status_rows = cursor.fetchall()
    status_counts = {row[0]: row[1] for row in status_rows}
    
    conn.close()
    
    return {
        "total": total_count,
        "avg_rating": avg_rating,
        "rating_breakdown": rating_counts,
        "pending_count": status_counts.get("Pending", 0),
        "reviewed_count": status_counts.get("Reviewed", 0),
        "resolved_count": status_counts.get("Resolved", 0)
    }

def update_feedback(feedback_id: str, status: str = None, admin_notes: str = None) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM feedbacks WHERE id = ?", (feedback_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
        
    current = dict(row)
    new_status = status if status in ["Pending", "Reviewed", "Resolved"] else current["status"]
    new_notes = admin_notes if admin_notes is not None else current["admin_notes"]
    
    cursor.execute(
        "UPDATE feedbacks SET status = ?, admin_notes = ? WHERE id = ?",
        (new_status, new_notes, feedback_id)
    )
    conn.commit()
    conn.close()
    
    current["status"] = new_status
    current["admin_notes"] = new_notes
    return current

def delete_feedback(feedback_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM feedbacks WHERE id = ?", (feedback_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
