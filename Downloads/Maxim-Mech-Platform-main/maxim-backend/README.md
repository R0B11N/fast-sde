# Frank Cusimano Backend

This is the API backend for "Frank Cusimano", the AI construction assistant for Maxim Mechanical Group Inc.

## Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon.tech)
- **Authentication**: JWT & Refresh Tokens (bcrypt hashed passwords)
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root of `maxim-backend` based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/maxim_dev"
   JWT_SECRET="your_secure_random_string"
   JWT_REFRESH_SECRET="your_secondary_random_string"
   PORT=3000
   NODE_ENV=development
   UPLOAD_DIR="uploads"
   MAX_FILE_SIZE_MB=50
   ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
   ```

3. **Database Migration**:
   Push the Prisma schema to your Neon database:
   ```bash
   npx prisma db push
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health
- **GET `/health`**
  - Auth required: No
  - Response: `{ status: "ok", timestamp: "...", database: "connected" }`

### Authentication
- **POST `/auth/register`**
  - Auth required: No
  - Request Body: `{ "email", "password", "firstName", "lastName" }`
  - Response (201): User profile object

- **POST `/auth/login`**
  - Auth required: No
  - Request Body: `{ "email", "password" }`
  - Response (200): `{ accessToken, refreshToken, user: { ... } }`

- **POST `/auth/refresh`**
  - Auth required: No
  - Request Body: `{ "refreshToken" }`
  - Response (200): `{ accessToken, refreshToken }`

- **POST `/auth/logout`**
  - Auth required: Yes
  - Request Body: `{ "refreshToken" }`
  - Response (200): `{ message: "Logged out successfully" }`

- **GET `/auth/me`**
  - Auth required: Yes
  - Response (200): Authenticated User profile object

### Documents
- **POST `/documents/upload`**
  - Auth required: Yes
  - Content-Type: `multipart/form-data`
  - Fields: `file` (binary), `docType` (string - optional)
  - Response (201): Uploaded document metadata object

- **GET `/documents`**
  - Auth required: Yes
  - Query Params: `?docType=&status=&limit=20&offset=0`
  - Response (200): `{ documents: [...], total, limit, offset }`

- **GET `/documents/:id`**
  - Auth required: Yes
  - Response (200): Document metadata including `filePath`

- **DELETE `/documents/:id`**
  - Auth required: Yes
  - Response (200): `{ message: "Document deleted successfully" }`
