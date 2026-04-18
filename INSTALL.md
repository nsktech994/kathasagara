# Kathasagara Application Installation Guide

## Prerequisites

Before installing the Kathasagara application, make sure you have the following installed on your system:

- **Node.js** (v20 or higher recommended)
- **pnpm** (package manager)
- **MySQL** database server

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kathasagara
```

### 2. Install Dependencies

The project uses pnpm as the package manager. Install all dependencies with:

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment Variables for Kathasagara Application

# Application ID
VITE_APP_ID=your_app_id_here

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_here

# Database Connection String (MySQL)
DATABASE_URL=mysql://username:password@localhost:3306/database_name

# OAuth Server URL
OAUTH_SERVER_URL=https://your-oauth-server.com

# Owner OpenID (for administrative access)
OWNER_OPEN_ID=your_owner_openid_here

# Built-in Forge API Configuration
BUILT_IN_FORGE_API_URL=https://forge-api.example.com
BUILT_IN_FORGE_API_KEY=your_forge_api_key_here

# OpenRouter API for story generation
OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
OPEN_ROUTER_API_URL=https://openrouter.ai/api/v1

# Gemini API for narration/text-to-speech
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

# Node Environment (development or production)
NODE_ENV=development
```

> **Note**: Replace the placeholder values with your actual configuration values.

### 4. Set Up Database

1. Ensure MySQL server is running
2. Create a database for the application:
   ```sql
   CREATE DATABASE kathasagara;
   ```
3. Update the `DATABASE_URL` in your `.env` file to point to this database
4. Run database migrations:
   ```bash
   pnpm run db:push
   ```

### 5. Development Server

Start the development server:

```bash
pnpm dev
```

The application should now be running at `http://localhost:3000` (or another available port if 3000 is in use).

### 6. Production Build

To create a production build:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

## Troubleshooting

### Common Issues

1. **Port already in use**: The application will automatically find an available port if 3000 is busy.

2. **Database connection failed**: 
   - Verify MySQL server is running
   - Check your `DATABASE_URL` in the `.env` file
   - Ensure the database exists and credentials are correct

3. **Missing environment variables**: 
   - Ensure all required variables are set in your `.env` file
   - Check for typos in variable names

### Getting Help

If you encounter issues not covered in this guide, please check the application logs for more detailed error messages.