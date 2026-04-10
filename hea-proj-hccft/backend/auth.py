"""
HEA — Authentication Module
Handles user registration, login, JWT token management,
and end-to-end password encryption with bcrypt.
"""
import os
import re
import jwt
import bcrypt
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g

from db import get_db

# ─── Configuration ───────────────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'hea-super-secret-key-change-in-production-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24
REFRESH_EXPIRY_DAYS = 7

# ─── Database Initialisation ────────────────────────────────────
def init_auth_db():
    """Create the users table if it doesn't exist, and seed the default admin."""
    conn = get_db()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name       TEXT    NOT NULL,
        email           TEXT    NOT NULL UNIQUE,
        password_hash   TEXT    NOT NULL,
        role            TEXT    NOT NULL DEFAULT 'patient',
        phone           TEXT,
        is_active       INTEGER DEFAULT 1,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login      TIMESTAMP
    )''')

    # Seed default admin if not exists
    existing = c.execute("SELECT id FROM users WHERE email = ?", ('admin@hea.health',)).fetchone()
    if not existing:
        hashed = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        c.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ('HEA Administrator', 'admin@hea.health', hashed, 'admin')
        )

    conn.commit()
    conn.close()

# ─── Helpers ─────────────────────────────────────────────────────
def _validate_email(email: str) -> bool:
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def _validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, ""

def _generate_tokens(user_id: int, role: str, email: str, full_name: str) -> dict:
    """Generate both access and refresh JWT tokens."""
    now = datetime.now(timezone.utc)

    access_payload = {
        'sub': user_id,
        'role': role,
        'email': email,
        'name': full_name,
        'type': 'access',
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRY_HOURS),
    }

    refresh_payload = {
        'sub': user_id,
        'type': 'refresh',
        'iat': now,
        'exp': now + timedelta(days=REFRESH_EXPIRY_DAYS),
    }

    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': JWT_EXPIRY_HOURS * 3600,
    }

# ─── JWT Middleware ──────────────────────────────────────────────
def jwt_required(f):
    """Decorator that verifies JWT on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('type') != 'access':
                return jsonify({'error': 'Invalid token type'}), 401
            g.current_user = {
                'id': payload['sub'],
                'role': payload['role'],
                'email': payload['email'],
                'name': payload['name'],
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator that requires admin role."""
    @wraps(f)
    @jwt_required
    def decorated(*args, **kwargs):
        if g.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ─── Route Handlers ──────────────────────────────────────────────

def register_auth_routes(app):
    """Register all auth-related API routes on the Flask app."""

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        full_name = (data.get('full_name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        phone = (data.get('phone') or '').strip()
        role = data.get('role', 'patient')  # default patient

        # Validate required fields
        if not full_name:
            return jsonify({'error': 'Full name is required'}), 400
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        if not _validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate password strength
        valid, msg = _validate_password(password)
        if not valid:
            return jsonify({'error': msg}), 400

        # Restrict role
        if role not in ('patient', 'admin', 'staff'):
            role = 'patient'

        # Hash password with bcrypt (end-to-end encryption)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        conn = get_db()
        try:
            conn.execute(
                "INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
                (full_name, email, password_hash, role, phone)
            )
            conn.execute(
                "INSERT INTO audit_log (action, details) VALUES (?, ?)",
                ("USER_REGISTERED", f"{full_name} ({email}) as {role}")
            )
            conn.commit()

            # Fetch the new user
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            conn.close()

            tokens = _generate_tokens(user['id'], user['role'], user['email'], user['full_name'])

            return jsonify({
                'message': 'Registration successful',
                'user': {
                    'id': user['id'],
                    'full_name': user['full_name'],
                    'email': user['email'],
                    'role': user['role'],
                    'phone': user['phone'],
                },
                **tokens,
            }), 201

        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'An account with this email already exists'}), 409

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        login_role = data.get('role', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if not user:
            conn.close()
            return jsonify({'error': 'Invalid email or password'}), 401

        # Verify password with bcrypt
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Invalid email or password'}), 401

        if not user['is_active']:
            conn.close()
            return jsonify({'error': 'Account is deactivated. Contact admin.'}), 403

        # Role-based login validation
        if login_role == 'patient' and user['role'] != 'patient':
            conn.close()
            return jsonify({'error': 'This account is not registered as a patient'}), 403
        if login_role in ('staff', 'admin') and user['role'] == 'patient':
            conn.close()
            return jsonify({'error': 'Patient accounts cannot access staff login'}), 403

        # Update last login
        conn.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
            (user['id'],)
        )
        conn.execute(
            "INSERT INTO audit_log (action, details) VALUES (?, ?)",
            ("USER_LOGIN", f"{user['full_name']} ({user['email']})")
        )
        conn.commit()
        conn.close()

        tokens = _generate_tokens(user['id'], user['role'], user['email'], user['full_name'])

        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'full_name': user['full_name'],
                'email': user['email'],
                'role': user['role'],
                'phone': user['phone'],
            },
            **tokens,
        })

    @app.route('/api/auth/refresh', methods=['POST'])
    def refresh_token():
        data = request.get_json()
        refresh_tok = data.get('refresh_token', '') if data else ''

        if not refresh_tok:
            return jsonify({'error': 'Refresh token is required'}), 400

        try:
            payload = jwt.decode(refresh_tok, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('type') != 'refresh':
                return jsonify({'error': 'Invalid token type'}), 401

            user_id = payload['sub']
            conn = get_db()
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            conn.close()

            if not user or not user['is_active']:
                return jsonify({'error': 'User not found or deactivated'}), 401

            tokens = _generate_tokens(user['id'], user['role'], user['email'], user['full_name'])
            return jsonify(tokens)

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Refresh token expired, please login again', 'code': 'REFRESH_EXPIRED'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid refresh token'}), 401

    @app.route('/api/auth/me', methods=['GET'])
    @jwt_required
    def get_me():
        """Returns the current authenticated user's profile."""
        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user['id'],)).fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user['id'],
                'full_name': user['full_name'],
                'email': user['email'],
                'role': user['role'],
                'phone': user['phone'],
                'created_at': user['created_at'],
                'last_login': user['last_login'],
            }
        })

    @app.route('/api/auth/change-password', methods=['POST'])
    @jwt_required
    def change_password():
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')

        valid, msg = _validate_password(new_password)
        if not valid:
            return jsonify({'error': msg}), 400

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user['id'],)).fetchone()

        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401

        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user['id']))
        conn.execute(
            "INSERT INTO audit_log (action, details) VALUES (?, ?)",
            ("PASSWORD_CHANGED", f"User {user['email']}")
        )
        conn.commit()
        conn.close()

        return jsonify({'message': 'Password changed successfully'})
