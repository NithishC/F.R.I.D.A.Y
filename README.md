# F.R.I.D.A.Y with Open Context Vault + Basic's mem0

This project combines the F.R.I.D.A.Y assistant with Open Context Vault (OCV), a secure, privacy-focused personal data layer for AI context sharing. It uses Basic.tech's mem0 as the underlying memory layer for storing and retrieving context data.

## Project Structure

- `/backend` - Original F.R.I.D.A.Y backend (Flask)
- `/frontend` - Original F.R.I.D.A.Y frontend
- `/ocv` - Open Context Vault implementation
  - `/backend` - Rust-based OCV backend with mem0 integration
  - `/frontend` - Consent management UI
  - `/sdks` - Client libraries for OCV
  - `/travel-demo` - Example zero-UI travel application

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Rust](https://www.rust-lang.org/tools/install) (stable channel, 1.75+)
- [Node.js](https://nodejs.org/) (v18+)
- Basic.tech mem0 API key

### Basic.tech mem0 Configuration

1. Obtain an API key from Basic.tech for their mem0 service
2. Create a `.env` file in the root directory with the following content:
   ```
   BASIC_MEM0_API_KEY=your_api_key_here
   ```

### Running the Project

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd F.R.I.D.A.Y
   ```

2. Start the services:
   ```bash
   docker-compose up
   ```

This will start all the necessary services:
- F.R.I.D.A.Y backend on port 5000
- F.R.I.D.A.Y frontend on port 8080
- OCV backend on port 8000
- OCV consent UI on port 3000
- Travel demo on port 3001
- PostgreSQL database on port 5432

## Accessing Services from Another Laptop

To access the services from another laptop on your home network:

1. Find the IP address of the host laptop:
   ```bash
   # On Windows
   ipconfig
   
   # On macOS/Linux
   ifconfig
   # or
   ip addr
   ```

2. On the client laptop, access the services using the host laptop's IP address:
   - OCV Consent UI: `http://<host-ip>:3000`
   - Travel Demo: `http://<host-ip>:3001`
   - F.R.I.D.A.Y Frontend: `http://<host-ip>:8080`

## OCV Development

For development of the Open Context Vault components, please refer to the detailed documentation in `/ocv/DEVELOPMENT.md`.

## mem0 Integration

OCV integrates with Basic.tech's mem0 service for storing and retrieving context data. The integration is implemented in the following components:

- `adapters/mem0.rs` - Adapter for mem0 API
- `context_management/repository.rs` - Repository using the mem0 adapter
- `context_management/service.rs` - Service exposing mem0 functionality

### How it Works

1. User data is encrypted using OCV's encryption service
2. Encrypted data is stored in mem0 through the adapter
3. OCV's consent management controls access to the data
4. Applications interact with the data through OCV's GraphQL API

## Travel Demo

The travel demo showcases how applications can integrate with OCV to provide personalized experiences while respecting user privacy. Key features:

- Zero-UI sign-up experience
- Personalized travel recommendations
- User-controlled context sharing
- Persistent preferences across devices

To use the travel demo:
1. Navigate to http://localhost:3001
2. Click "Connect to OCV" to grant access to your context data
3. Set your travel preferences
4. Explore personalized destination recommendations

## Architecture

Open Context Vault follows a modular architecture:

- **Context Management Service**: Stores and retrieves encrypted context shards using mem0
- **Consent Manager**: Handles access grants and permissions
- **Policy Engine**: Enforces access control rules
- **Encryption Service**: Handles end-to-end encryption
- **GraphQL API**: Unified API for applications

For more details, see the architecture documentation in `/ocv/README.md`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
