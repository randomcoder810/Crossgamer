from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    jsonify,
    session,
)
from functools import wraps
import json
import os
import re
from datetime import datetime, timedelta
import uuid
import hashlib
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Login attempt tracking
login_attempts = {}
MAX_LOGIN_ATTEMPTS = 3
LOCKOUT_DURATION = 120  # 2 minutes in seconds


def is_ip_locked(ip_address):
    """Check if IP address is locked due to too many failed attempts"""
    if ip_address in login_attempts:
        attempts_data = login_attempts[ip_address]
        if attempts_data["count"] >= MAX_LOGIN_ATTEMPTS:
            time_diff = datetime.now() - attempts_data["last_attempt"]
            if time_diff.total_seconds() < LOCKOUT_DURATION:
                return True
            else:
                # Reset attempts after lockout period
                del login_attempts[ip_address]
    return False


def record_failed_attempt(ip_address):
    """Record a failed login attempt for an IP address"""
    if ip_address not in login_attempts:
        login_attempts[ip_address] = {"count": 0, "last_attempt": datetime.now()}

    login_attempts[ip_address]["count"] += 1
    login_attempts[ip_address]["last_attempt"] = datetime.now()


def get_remaining_lockout_time(ip_address):
    """Get remaining lockout time in seconds for an IP address"""
    if ip_address in login_attempts:
        attempts_data = login_attempts[ip_address]
        if attempts_data["count"] >= MAX_LOGIN_ATTEMPTS:
            time_diff = datetime.now() - attempts_data["last_attempt"]
            remaining = LOCKOUT_DURATION - time_diff.total_seconds()
            return max(0, int(remaining))
    return 0


def reset_login_attempts(ip_address):
    """Reset login attempts for an IP address after successful login"""
    if ip_address in login_attempts:
        del login_attempts[ip_address]


# Create data directory
os.makedirs(Config.DATA_DIR, exist_ok=True)
for required_file in [Config.REG_FILE, Config.CONTACT_FILE, Config.VIDEOS_FILE, Config.USERS_FILE]:
    if not os.path.exists(required_file):
        try:
            with open(required_file, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception:
            pass


# Security headers
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    return response


def login_required(f):
    """Require admin session for admin routes."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)

    return decorated_function


def verify_admin_credentials(username, password):
    """Verify admin credentials"""
    if username == Config.ADMIN_USERNAME:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        return password_hash == Config.get_admin_password_hash()
    return False


# --- User helpers ---
def hash_password(password: str) -> str:
    return hashlib.sha256((password or "").encode()).hexdigest()


def verify_user_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == (password_hash or "")


def validate_user_signup(name: str, email: str, password: str) -> list:
    errors = []
    if not name or len(name.strip()) < 2:
        errors.append("Name must be at least 2 characters long")
    if not email or not validate_email(email):
        errors.append("Enter a valid email address")
    if not password or len(password) < 6:
        errors.append("Password must be at least 6 characters long")
    return errors


def save_to_json(file_path, data_dict):
    """Save data to JSON file with better structure"""
    try:
        # Load existing data
        existing_data = []
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = []

        # Add new data
        existing_data.append(data_dict)

        # Save back to file
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving to JSON: {e}")
        return False


def generate_registration_id():
    """Generate unique registration ID"""
    return f"REG-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


def clean_player_data(data):
    """Clean and validate player data"""
    players = []
    for i in range(1, 5):
        player_key = f"player{i}"
        player_name = data.get(player_key, "").strip()
        if player_name:
            players.append(
                {
                    "id": i,
                    "name": player_name,
                    "role": f"Player {i}",
                    "status": "active",
                }
            )
    return players


def validate_email(email):
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Validate phone number (10 digits)"""
    return re.match(r"^\d{10}$", phone) is not None


def validate_registration_data(data):
    """Validate registration form data"""
    errors = []

    # Validate team name
    if not data.get("team_name") or len(data["team_name"].strip()) < 3:
        errors.append("Team name must be at least 3 characters long")

    # Validate player names
    for i in range(1, 5):
        player_key = f"player{i}"
        if not data.get(player_key) or len(data[player_key].strip()) < 2:
            errors.append(f"Player {i} name must be at least 2 characters long")

    # Validate email
    if not data.get("email") or not validate_email(data["email"]):
        errors.append("Please enter a valid email address")

    # Validate phone
    if not data.get("phone") or not validate_phone(data["phone"]):
        errors.append("Please enter a valid 10-digit phone number")

    return errors


def parse_user_agent(user_agent_string):
    """Return a minimal parse of browser and device from the User-Agent string."""
    ua = user_agent_string or ""

    # Browser detection (very lightweight)
    browser = "Unknown"
    version = ""
    patterns = [
        (r"Edg/([\d\.]+)", "Microsoft Edge"),
        (r"OPR/([\d\.]+)", "Opera"),
        (r"Chrome/([\d\.]+)", "Chrome"),
        (r"Firefox/([\d\.]+)", "Firefox"),
        (r"Version/([\d\.]+).*Safari", "Safari"),
        (r"Safari/([\d\.]+)", "Safari"),
        (r"MSIE ([\d\.]+)", "Internet Explorer"),
        (r"Trident/.*rv:([\d\.]+)", "Internet Explorer"),
    ]
    for pattern, name in patterns:
        m = re.search(pattern, ua)
        if m:
            browser = name
            version = m.group(1)
            break

    # Device detection
    device = "Desktop"
    if re.search(r"Mobile|Android|iPhone|iPad|iPod", ua, re.I):
        device = "Mobile"
    if re.search(r"Tablet|iPad", ua, re.I):
        device = "Tablet"

    browser_str = f"{browser} {version}".strip()
    return {"browser": browser_str, "device": device}


def validate_contact_data(data):
    """Validate contact form data"""
    errors = []

    # Validate name
    if not data.get("name") or len(data["name"].strip()) < 2:
        errors.append("Name must be at least 2 characters long")

    # Validate email
    if not data.get("email") or not validate_email(data["email"]):
        errors.append("Please enter a valid email address")

    # Validate message
    if not data.get("message") or len(data["message"].strip()) < 10:
        errors.append("Message must be at least 10 characters long")

    return errors


@app.route("/")
def index():
    from video_manager import VideoManager

    vm = VideoManager()
    featured_video = vm.get_featured_video()
    all_videos = vm.load_videos()

    return render_template(
        "index.html", featured_video=featured_video, all_videos=all_videos
    )


@app.route("/videos")
def videos():
    """Dedicated videos page with enhanced video player"""
    from video_manager import VideoManager

    vm = VideoManager()
    all_videos = vm.load_videos()

    return render_template("videos.html", all_videos=all_videos)


@app.route("/test-video")
def test_video():
    """Test page for video player functionality"""
    return render_template("test_video.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Restriction: must be logged in and have at least $3 in wallet
        if not session.get('user_id'):
            flash('Please log in before submitting registration.', 'danger')
            return redirect(url_for('user_login'))

        try:
            from data_manager import DataManager
            manager = DataManager()
            current_user = manager.find_user_by_email(session.get('user_email', ''))
            wallet_balance = int(current_user.get('wallet', {}).get('balance', 0)) if current_user else 0
            if wallet_balance < 20:
                flash('You need at least $20 in your wallet to submit.', 'danger')
                return redirect(url_for('user_wallet'))
        except Exception:
            flash('Unable to verify wallet. Please try again later.', 'danger')
            return redirect(url_for('user_wallet'))
        # Get form data
        team_name = request.form.get("team_name", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()

        # Basic validation
        data = {
            "team_name": team_name,
            "player1": request.form.get("player1", "").strip(),
            "player2": request.form.get("player2", "").strip(),
            "player3": request.form.get("player3", "").strip(),
            "player4": request.form.get("player4", "").strip(),
            "email": email,
            "phone": phone,
        }

        # Server-side validation
        errors = validate_registration_data(data)
        if errors:
            for error in errors:
                flash(error, "danger")
            return render_template("register.html")

        # Create enhanced data structure
        enhanced_data = {
            "registration_id": generate_registration_id(),
            "team_info": {
                "name": team_name,
                "created_at": datetime.now().isoformat(),
                "status": "pending",
                "category": "BGMI",
                "tournament": "Esports Championship 2025",
            },
            "players": clean_player_data(data),
            "contact_info": {
                "email": email,
                "phone": phone,
                "primary_contact": data["player1"],  # First player as primary contact
            },
            "registration_meta": (lambda ua: (lambda parsed: {
                "submitted_at": datetime.now().isoformat(),
                "ip_address": request.headers.get("X-Forwarded-For", request.remote_addr),
                "browser": parsed.get("browser"),
                "device": parsed.get("device"),
                "form_version": "2.1"
            })(parse_user_agent(ua)))(request.headers.get("User-Agent", "")),
            "validation": {
                "email_verified": False,
                "phone_verified": False,
                "payment_status": "pending",
                "documents_uploaded": False,
            },
        }

        # Deduct $20 before saving; refund if save fails
        deducted = False
        if current_user:
            updated = manager.update_wallet(current_user.get('id'), -20)
            deducted = bool(updated)

        if save_to_json(Config.REG_FILE, enhanced_data):
            flash(
                f'Registration submitted successfully! Your ID: {enhanced_data["registration_id"]}',
                "success",
            )
        else:
            # Refund if we deducted
            if deducted and current_user:
                try:
                    manager.update_wallet(current_user.get('id'), 20)
                except Exception:
                    pass
            flash("Error saving registration. Please try again.", "danger")

        return redirect(url_for("register"))

    return render_template("register.html")


@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        # Get form data
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        message = request.form.get("message", "").strip()

        # Basic validation
        data = {"name": name, "email": email, "message": message}

        # Server-side validation
        errors = validate_contact_data(data)
        if errors:
            for error in errors:
                flash(error, "danger")
            return render_template("contact.html")

        # Create enhanced contact data structure
        contact_data = {
            "contact_id": f"CONT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "sender_info": {"name": name, "email": email},
            "message": {
                "content": message,
                "subject": "Contact Form Submission",
                "priority": "normal",
            },
            "meta": {
                "submitted_at": datetime.now().isoformat(),
                "ip_address": request.remote_addr,
                "user_agent": request.headers.get("User-Agent", ""),
                "status": "unread",
            },
        }

        if save_to_json(Config.CONTACT_FILE, contact_data):
            flash("Message sent successfully! We will get back to you soon.", "success")
        else:
            flash("Error sending message. Please try again.", "danger")

        return redirect(url_for("contact"))

    return render_template("contact.html")


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    """Admin login page"""
    # Get client IP address
    ip_address = request.remote_addr

    # Check if IP is locked
    if is_ip_locked(ip_address):
        remaining_time = get_remaining_lockout_time(ip_address)
        minutes = remaining_time // 60
        seconds = remaining_time % 60
        if minutes > 0:
            time_msg = f"{minutes} minute{'s' if minutes != 1 else ''} and {seconds} second{'s' if seconds != 1 else ''}"
        else:
            time_msg = f"{seconds} second{'s' if seconds != 1 else ''}"

        flash(
            f"Account temporarily locked due to too many failed attempts. Please try again in {time_msg}.",
            "danger",
        )
        return render_template(
            "admin_panel/admin_login.html", locked=True, remaining_time=remaining_time, body_class="pixel-admin"
        )

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if verify_admin_credentials(username, password):
            # Successful login - reset attempts
            reset_login_attempts(ip_address)
            session["admin_logged_in"] = True
            session["admin_username"] = username
            session["last_activity"] = datetime.now().isoformat()
            flash("Login successful! Welcome to the admin panel.", "success")
            return redirect(url_for("admin"))
        else:
            # Failed login - record attempt
            record_failed_attempt(ip_address)
            remaining_attempts = (
                MAX_LOGIN_ATTEMPTS - login_attempts[ip_address]["count"]
            )

            if remaining_attempts > 0:
                flash(
                    f'Invalid username or password. {remaining_attempts} attempt{"s" if remaining_attempts != 1 else ""} remaining.',
                    "danger",
                )
            else:
                flash(
                    "Too many failed attempts. Account locked for 2 minutes.", "danger"
                )

    return render_template("admin_panel/admin_login.html", locked=False, body_class="pixel-admin")


@app.route("/admin/logout")
def admin_logout():
    """Admin logout"""
    session.pop("admin_logged_in", None)
    session.pop("admin_username", None)
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("admin_login"))


# ----------------- User Auth & Wallet -----------------
@app.route('/signup', methods=['GET', 'POST'])
def user_signup():
    from data_manager import DataManager
    if request.method == 'POST':
        name = (request.form.get('name') or '').strip()
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''

        errors = validate_user_signup(name, email, password)
        if errors:
            for e in errors:
                flash(e, 'danger')
            return render_template('user_signup.html')

        manager = DataManager()
        if manager.find_user_by_email(email):
            flash('An account with this email already exists.', 'danger')
            return render_template('user_signup.html')

        user = manager.create_user(name, email, hash_password(password))
        if user:
            flash('Account created! Please log in.', 'success')
            return redirect(url_for('user_login'))
        flash('Failed to create account. Try again.', 'danger')
    return render_template('user_signup.html')


@app.route('/login', methods=['GET', 'POST'])
def user_login():
    from data_manager import DataManager
    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        manager = DataManager()
        user = manager.find_user_by_email(email)
        if user and verify_user_password(password, user.get('password_hash','')):
            session['user_id'] = user.get('id')
            session['user_email'] = user.get('email')
            session['user_name'] = user.get('name')
            flash('Logged in successfully.', 'success')
            return redirect(url_for('user_wallet'))
        flash('Invalid email or password.', 'danger')
    return render_template('user_login.html')


@app.route('/logout')
def user_logout():
    session.pop('user_id', None)
    session.pop('user_email', None)
    session.pop('user_name', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))


def user_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return redirect(url_for('user_login'))
        return f(*args, **kwargs)
    return wrapper


@app.route('/wallet')
@user_login_required
def user_wallet():
    from data_manager import DataManager
    manager = DataManager()
    user = None
    if session.get('user_email'):
        user = manager.find_user_by_email(session['user_email'])
    return render_template('user_wallet.html', user=user)


# Admin: manage users
@app.route('/admin/users')
@login_required
def admin_users():
    from data_manager import DataManager
    manager = DataManager()
    users = manager.get_users()
    return render_template('admin_panel/admin_users.html', users=users, body_class='pixel-admin')


@app.route('/admin/users/wallet/<user_id>', methods=['POST'])
@login_required
def admin_update_user_wallet(user_id):
    from data_manager import DataManager
    manager = DataManager()
    action = (request.form.get('action') or '').strip()
    amount = int(request.form.get('amount') or '0')
    if action == 'set':
        user = manager.set_wallet(user_id, amount)
    else:
        user = manager.update_wallet(user_id, amount)
    if user:
        flash('Wallet updated.', 'success')
        return redirect(url_for('admin_users'))
    flash('Failed to update wallet.', 'danger')
    return redirect(url_for('admin_users'))


@app.route("/admin")
@login_required
def admin():
    """Admin dashboard to view registrations"""
    from data_manager import DataManager

    manager = DataManager()
    registrations = manager.get_registrations()
    stats = manager.get_statistics()

    # Get search query
    search_query = request.args.get("search", "").strip()

    # Filter registrations if search query provided
    if search_query:
        registrations = manager.search_registrations(search_query)

    # Prepare stats for template
    template_stats = {
        "total_registrations": stats["total_registrations"],
        "approved": stats["status_breakdown"].get("approved", 0),
        "pending": stats["status_breakdown"].get("pending", 0),
        "rejected": stats["status_breakdown"].get("rejected", 0),
        "recent": stats["recent_registrations"],
    }

    return render_template(
        "admin_panel/admin.html",
        registrations=registrations,
        stats=template_stats,
        search_query=search_query,
        body_class="pixel-admin",
    )


@app.route("/admin/update-status/<reg_id>", methods=["POST"])
@login_required
def update_registration_status(reg_id):
    """Update registration status via AJAX"""
    from data_manager import DataManager

    status = request.form.get("status")
    if not status or status not in ["pending", "approved", "rejected"]:
        return jsonify({"success": False, "message": "Invalid status"}), 400

    manager = DataManager()
    if manager.update_registration_status(reg_id, status):
        return jsonify({"success": True, "message": f"Status updated to {status}"})
    else:
        return jsonify({"success": False, "message": "Registration not found"}), 404


# Registration detail route
@app.route("/admin/registration/<reg_id>", methods=["GET"])
@login_required
def get_registration_detail(reg_id):
    """Return full registration details as JSON for the modal view."""
    from data_manager import DataManager

    manager = DataManager()
    reg = manager.get_registration_by_id(reg_id)
    if reg:
        return jsonify({"success": True, "registration": reg})
    return jsonify({"success": False, "message": "Registration not found"}), 404


# Video Management Routes
@app.route("/admin/videos")
@login_required
def admin_videos():
    """Admin dashboard for video management"""
    from video_manager import VideoManager

    vm = VideoManager()
    videos = vm.load_videos()

    return render_template("admin_panel/admin_videos.html", videos=videos, body_class="pixel-admin")


@app.route("/admin/videos/add", methods=["GET", "POST"])
@login_required
def add_video():
    """Add a new video"""
    if request.method == "POST":
        from video_manager import VideoManager

        vm = VideoManager()
        try:
            video = vm.add_video(
                title=request.form.get("title"),
                description=request.form.get("description"),
                youtube_url=request.form.get("youtube_url"),
                category=request.form.get("category", "general"),
                featured=request.form.get("featured") == "on",
            )
            flash("Video added successfully!", "success")
            return redirect(url_for("admin_videos"))
        except ValueError as e:
            flash(f"Error: {str(e)}", "danger")
        except Exception as e:
            flash(f"Error adding video: {str(e)}", "danger")

    return render_template("admin_panel/add_video.html", body_class="pixel-admin")


@app.route("/admin/videos/edit/<video_id>", methods=["GET", "POST"])
@login_required
def edit_video(video_id):
    """Edit an existing video"""
    from video_manager import VideoManager

    vm = VideoManager()
    video = vm.get_video_by_id(video_id)

    if not video:
        flash("Video not found!", "danger")
        return redirect(url_for("admin_videos"))

    if request.method == "POST":
        try:
            updated_video = vm.update_video(
                video_id,
                title=request.form.get("title"),
                description=request.form.get("description"),
                youtube_url=request.form.get("youtube_url"),
                category=request.form.get("category", "general"),
                featured=request.form.get("featured") == "on",
            )
            flash("Video updated successfully!", "success")
            return redirect(url_for("admin_videos"))
        except Exception as e:
            flash(f"Error updating video: {str(e)}", "danger")

    return render_template("admin_panel/edit_video.html", video=video, body_class="pixel-admin")


@app.route("/admin/videos/delete/<video_id>", methods=["POST"])
@login_required
def delete_video(video_id):
    """Delete a video"""
    from video_manager import VideoManager

    vm = VideoManager()
    try:
        vm.delete_video(video_id)
        flash("Video deleted successfully!", "success")
    except Exception as e:
        flash(f"Error deleting video: {str(e)}", "danger")

    return redirect(url_for("admin_videos"))


@app.route("/admin/videos/toggle-featured/<video_id>", methods=["POST"])
@login_required
def toggle_featured(video_id):
    """Toggle featured status of a video"""
    from video_manager import VideoManager

    vm = VideoManager()
    try:
        video = vm.toggle_featured(video_id)
        status = "featured" if video.get("featured") else "unfeatured"
        flash(f"Video {status} successfully!", "success")
    except Exception as e:
        flash(f"Error updating video: {str(e)}", "danger")

    return redirect(url_for("admin_videos"))


@app.route("/admin/material")
@login_required
def admin_material():
    """Back-compat route: redirect to the default admin page."""
    return redirect(url_for("admin"))


@app.route("/api/video/<video_id>/view", methods=["POST"])
def api_increment_view(video_id):
    """Increment video views (idempotent per browser via localStorage token)."""
    from video_manager import VideoManager

    try:
        vm = VideoManager()
        new_count = vm.increment_view(video_id)
        if new_count >= 0:
            return jsonify({"success": True, "views": new_count})
        return jsonify({"success": False, "message": "Video not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# HTTP Error Handlers
@app.errorhandler(400)
def bad_request_error(error):
    return render_template("errors/400.html"), 400


@app.errorhandler(401)
def unauthorized_error(error):
    return render_template("errors/401.html"), 401


@app.errorhandler(403)
def forbidden_error(error):
    return render_template("errors/403.html"), 403


@app.errorhandler(404)
def not_found_error(error):
    return render_template("errors/404.html"), 404


@app.errorhandler(405)
def method_not_allowed_error(error):
    return render_template("errors/405.html"), 405


@app.errorhandler(409)
def conflict_error(error):
    return render_template("errors/409.html"), 409


@app.errorhandler(429)
def too_many_requests_error(error):
    return render_template("errors/429.html"), 429


@app.errorhandler(500)
def internal_error(error):
    return render_template("errors/500.html"), 500


@app.errorhandler(503)
def service_unavailable_error(error):
    return render_template("errors/503.html"), 503


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
