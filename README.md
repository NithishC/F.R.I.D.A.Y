# F.R.I.D.A.Y with Open Context Vault

This project integrates F.R.I.D.A.Y (a voice assistant) with Open Context Vault (OCV), a secure personal data layer that uses Basic.tech's mem0 for storing user context.

## Project Structure

- `/backend` - F.R.I.D.A.Y backend (Flask)
- `/frontend` - F.R.I.D.A.Y frontend
- `/ocv` - Open Context Vault implementation
  - `/backend` - OCV backend with mem0 integration
  - `/frontend` - Consent management UI

## Architecture

In this setup:

1. **F.R.I.D.A.Y** serves as the primary voice interface for users
2. **OCV** provides a secure data layer for storing user context
3. **mem0** is used as the underlying memory storage

F.R.I.D.A.Y can request access to user preferences and history stored in OCV, enabling personalized interactions while maintaining user privacy and control.

## Getting Started

### Prerequisites

- Python 3.10+ for F.R.I.D.A.Y backend
- Rust 1.75.0+ for OCV backend
- Basic.tech mem0 API key

### Configuration

1. Configure the mem0 API key in the OCV backend:
   ```
   # In ocv/backend/.env
   BASIC_MEM0_API_KEY=your_api_key_here
   ```

### Running the F.R.I.D.A.Y Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The F.R.I.D.A.Y backend will run at http://localhost:5000

### Running the F.R.I.D.A.Y Frontend

The frontend is a static web application. You can serve it using any web server:

```bash
cd frontend
# Using Python's built-in HTTP server
python -m http.server 8080
```

The F.R.I.D.A.Y frontend will be available at http://localhost:8080

### Running the OCV Backend

```bash
cd ocv/backend
cargo run
```

The OCV backend will run at http://localhost:8000

### Running the OCV Consent UI

The consent UI is a static web application:

```bash
cd ocv/frontend/public
python -m http.server 3000
```

The OCV Consent UI will be available at http://localhost:3000

## Integration Flow

1. User speaks to F.R.I.D.A.Y through the web interface
2. F.R.I.D.A.Y backend processes the speech and identifies the intent
3. If needed, F.R.I.D.A.Y requests access to user context from OCV
4. OCV validates the access permission and provides the requested data
5. F.R.I.D.A.Y uses the context to provide personalized responses
6. Any new context generated during the interaction can be stored back in OCV

This architecture gives users control over their data while allowing F.R.I.D.A.Y to maintain context across different sessions.
