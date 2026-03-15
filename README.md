# BGMI Esport Tournament Website

A Flask-based web application for managing BGMI (Battlegrounds Mobile India) esport tournament registrations and contact forms with enhanced data management capabilities.

## Features

- **Team Registration**: Register teams with up to 5 players
- **Contact Form**: Send messages to tournament organizers
- **Modern UI**: Responsive design with Bootstrap 5
- **Form Validation**: Both client-side and server-side validation
- **Enhanced Data Storage**: JSON-based data storage with structured format
- **Data Management Tools**: Built-in utilities for data viewing and management
- **Unique Registration IDs**: Each registration gets a unique identifier
- **Comprehensive Metadata**: IP tracking, user agent logging, and validation status
- **Error Handling**: Proper error pages and user feedback

## Installation

1. **Clone or download the project**
2. **Install Python dependencies**:
   ```bash
   pip install -r requirement.txt
   ```

## Usage

1. **Run the application**:
   ```bash
   python app.py
   ```

2. **Access the website**:
   - Open your browser and go to `http://localhost:5000`
   - The application will be available on all network interfaces

3. **Data Management** (Optional):
   ```bash
   python data_manager.py
   ```

## Project Structure

```
bgmi-esport-site/
├── app.py                 # Main Flask application
├── requirement.txt        # Python dependencies
├── README.md             # Project documentation
├── migrate_data.py       # Data migration script (CSV to JSON)
├── data_manager.py       # Data management utility
├── static/               # Static files (CSS, JS)
│   ├── css/
│   │   └── style.css     # Custom styles
│   └── js/
│       └── script.js     # JavaScript validation
├── templates/            # HTML templates
│   ├── layout.html       # Base template
│   ├── index.html        # Home page
│   ├── register.html     # Registration form
│   ├── contact.html      # Contact form
│   ├── 404.html          # 404 error page
│   └── 500.html          # 500 error page
└── data/                 # Data storage (created automatically)
    ├── registrations.json # Team registrations (JSON format)
    ├── contacts.json     # Contact messages (JSON format)
    └── *.csv.backup      # Backup of original CSV files
```

## Enhanced Data Format

### Registration Data Structure
```json
{
  "registration_id": "REG-20250803-3C16632B",
  "team_info": {
    "name": "Team Name",
    "created_at": "2025-08-03T14:44:53",
    "status": "pending",
    "category": "BGMI",
    "tournament": "Esports Championship 2025"
  },
  "players": [
    {
      "id": 1,
      "name": "Player Name",
      "role": "Player 1",
      "status": "active"
    }
  ],
  "contact_info": {
    "email": "team@example.com",
    "phone": "1234567890",
    "primary_contact": "Player 1"
  },
  "registration_meta": {
    "submitted_at": "2025-08-03T14:44:53",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "form_version": "2.0"
  },
  "validation": {
    "email_verified": false,
    "phone_verified": false,
    "payment_status": "pending",
    "documents_uploaded": false
  }
}
```

### Contact Data Structure
```json
{
  "contact_id": "CONT-20250803-ABC12345",
  "sender_info": {
    "name": "Sender Name",
    "email": "sender@example.com"
  },
  "message": {
    "content": "Message content",
    "subject": "Contact Form Submission",
    "priority": "normal"
  },
  "meta": {
    "submitted_at": "2025-08-03T14:44:53",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "status": "unread"
  }
}
```

## Data Management Tools

### Migration Script
Convert existing CSV data to the new JSON format:
```bash
python migrate_data.py
```

### Data Manager Utility
Interactive tool for managing registration and contact data:
```bash
python data_manager.py
```

**Features:**
- View all registrations and contacts
- Search registrations by team name, player name, or email
- Get detailed registration information by ID
- Update registration status (pending/approved/rejected)
- View statistics and analytics
- Export data to CSV format

## Features Details

### Team Registration
- Team name (minimum 3 characters)
- 5 player names (minimum 2 characters each)
- Contact email (validated format)
- Phone number (10 digits)
- Unique registration ID generation
- Comprehensive metadata tracking

### Contact Form
- Name (minimum 2 characters)
- Email (validated format)
- Message (minimum 10 characters)
- Unique contact ID generation
- Priority and status tracking

### Enhanced Security Features
- Secure random secret key generation
- Input sanitization and validation
- CSRF protection (Flask built-in)
- IP address and user agent logging
- Error handling for file operations

### UI/UX Features
- Responsive design for mobile and desktop
- Modern gradient background
- Smooth animations and transitions
- Bootstrap 5 components
- Custom styling with glassmorphism effects
- Success messages with registration IDs

## Data Storage

The application now uses JSON format for better data structure and flexibility:

### Benefits of JSON Format
- **Structured Data**: Hierarchical organization of information
- **Extensibility**: Easy to add new fields without breaking existing data
- **Readability**: Human-readable format for debugging
- **Validation**: Built-in support for data validation
- **Metadata**: Rich metadata for tracking and analytics
- **Searchability**: Better search and filtering capabilities

### Data Files
- `data/registrations.json`: Enhanced team registration data
- `data/contacts.json`: Enhanced contact form submissions
- `data/*.csv.backup`: Backup of original CSV files after migration

## Development

### Adding New Features
1. Update the Flask routes in `app.py`
2. Create or modify templates in `templates/`
3. Add custom styles in `static/css/style.css`
4. Add JavaScript functionality in `static/js/script.js`
5. Update data structures in JSON files as needed

### Customization
- Modify colors and styling in `static/css/style.css`
- Update form validation in `static/js/script.js`
- Change validation rules in `app.py` validation functions
- Extend data structures in the JSON format

### Data Management
- Use `data_manager.py` for administrative tasks
- Export data to CSV for external analysis
- Update registration statuses through the management tool
- Generate reports and statistics

## Troubleshooting

### Common Issues
1. **Port already in use**: Change the port in `app.py` line 146
2. **Permission errors**: Ensure write permissions for the `data/` directory
3. **Import errors**: Make sure all dependencies are installed
4. **JSON parsing errors**: Check file integrity and encoding

### Migration Issues
- If migration fails, check the original CSV file format
- Backup files are created automatically during migration
- Run migration script only once to avoid duplicates

### Debug Mode
The application runs in debug mode by default. For production:
- Set `debug=False` in `app.py`
- Use a production WSGI server like Gunicorn
- Set a fixed secret key instead of generating one
- Implement proper logging and monitoring

## License

This project is open source and available under the MIT License. 