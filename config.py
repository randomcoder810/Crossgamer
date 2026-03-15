import os
import hashlib

class Config:
    """Configuration class for the BGMI Esport application"""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)
    
    # Admin credentials (in production, use environment variables)
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME') or "admin"
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or "admin"
    
    # Generate password hash
    @classmethod
    def get_admin_password_hash(cls):
        return hashlib.sha256(cls.ADMIN_PASSWORD.encode()).hexdigest()
    
    # Data directory
    DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
    
    # File paths
    REG_FILE = os.path.join(DATA_DIR, 'registrations.json')
    CONTACT_FILE = os.path.join(DATA_DIR, 'contacts.json')
    VIDEOS_FILE = os.path.join(DATA_DIR, 'videos.json')
    USERS_FILE = os.path.join(DATA_DIR, 'users.json')
    
    # Security settings
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour session timeout
