# Authentication Module Setup & Testing Guide

## Installation

### Server Setup

```bash
cd server
pnpm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### Client Setup

```bash
cd client
pnpm install
cp .env.example .env
# Edit .env if needed (default should work)
```

## Running the Application

### Terminal 1: Start MongoDB
```bash
# Make sure MongoDB is running locally
mongod
# Or if using MongoDB Atlas, update MONGO_URI in server/.env
```

### Terminal 2: Start Server
```bash
cd server
pnpm dev
# Server runs on http://localhost:8080
```

### Terminal 3: Start Client
```bash
cd client
pnpm dev
# Client runs on http://localhost:5173
```

## Manual Testing Steps

### 1. Register a New User
1. Open http://localhost:5173/register
2. Fill in:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
3. Click "Register"
4. **Check server console** - you should see the OTP code logged:
   ```
   📧 EMAIL (DEV MODE)
   To: john@example.com
   Subject: Verify Your Email - Construction Safety
   Body: Your verification code is: 123456
   ```
5. Copy the 6-digit OTP from the console

### 2. Verify Email
1. You should be redirected to `/verify`
2. Enter the 6-digit OTP you copied from the server console
3. Click "Verify Email"
4. You should be redirected to `/login` with a success message

### 3. Login
1. On the login page, enter:
   - Email: `john@example.com`
   - Password: `password123`
2. Click "Sign in"
3. You should be redirected to `/dashboard`

### 4. Dashboard & User Info
1. The dashboard should display:
   - User ID
   - Email
   - Full Name
   - Role (default: VIEWER)
   - Email Verified status (should be ✓ Yes)

### 5. Test Refresh Token Flow
1. Open browser DevTools → Network tab
2. Wait 15+ minutes (or manually expire the access token)
3. Try to navigate or refresh the page
4. The axios interceptor should automatically:
   - Detect 401 error
   - Call `/auth/refresh` with the httpOnly cookie
   - Get a new access token
   - Retry the original request
5. You should see the refresh request in the Network tab

### 6. Test Protected Route (Role-Based)
1. If your user role is ADMIN or SAFETY_OFFICER:
   - Click the "Call /auth/secret" button
   - You should see a success message with the secret data
2. If your user role is VIEWER or SUPERVISOR:
   - The button should not appear, or show an error if you try to call it

### 7. Logout
1. Click the "Logout" button on the dashboard
2. You should be redirected to `/login`
3. The access token should be cleared from memory
4. The refresh token cookie should be cleared

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate token
- `GET /auth/me` - Get current user (requires auth)
- `GET /auth/secret` - Protected route (requires ADMIN or SAFETY_OFFICER)

## Environment Variables

### Server (.env)
- `MONGO_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `APP_ORIGIN` - Frontend origin for CORS (default: http://localhost:5173)
- `EMAIL_DEV_ECHO` - Set to `true` to log emails to console
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)

### Client (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:8080)

## Notes

- Access tokens are stored in memory (not localStorage)
- Refresh tokens are stored as httpOnly cookies
- OTP expires in 10 minutes
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- In development, emails are logged to console when `EMAIL_DEV_ECHO=true`

