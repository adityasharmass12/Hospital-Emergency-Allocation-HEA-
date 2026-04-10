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

    conn.commit()
    _seed_beds_only(conn)
    conn.close()

def _seed_beds_only(conn):
    pass