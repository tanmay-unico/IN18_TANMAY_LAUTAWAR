# Patient Portal - Design Document

## 1. Tech Stack Choices

### Q1. What frontend framework did you use and why? (React)

I went with React for the frontend. Here's why:

- The component-based approach makes it easy to break down the UI into reusable pieces. I can create a component for the upload form, another for the document list, etc., and reuse them easily.
- React has a huge community and tons of libraries available, so if I need something, there's probably already a solution out there.
- The virtual DOM helps with performance, especially when the document list grows.
- Good tooling and debugging support makes development smoother.
- It's widely used in production, so it's a safe bet.

### Q2. What backend framework did you choose and why? (Express)

Express.js was the obvious choice for the backend:

- It's simple and doesn't force you into a specific structure. I can set things up the way I want.
- Great middleware ecosystem - multer for file uploads, cors for handling cross-origin requests, etc. Makes adding features straightforward.
- Since it runs on Node.js, I can use JavaScript for both frontend and backend, which keeps things consistent.
- Works really well with multer for handling file uploads, which is a core requirement here.
- It's been around for a while and is battle-tested in production.

### Q3. What database did you choose and why? (SQLite)

SQLite fits perfectly for this project:

- No setup needed - just install the package and it works. No separate database server to configure or run.
- Everything is stored in a single file (documents.db), which makes backups and moving the project around super easy.
- Lightweight and fast for this use case. Since we're assuming a single user, we don't need the overhead of a full database server.
- Uses standard SQL, so if we ever need to migrate to PostgreSQL or MySQL later, the queries will be similar.
- Perfect for a single-user scenario where we don't need concurrent writes from multiple processes.

### Q4. If you were to support 1,000 users, what changes would you consider?

If we needed to scale to 1,000 users, here's what I'd change:

**Database:**
- Switch from SQLite to PostgreSQL or MySQL. SQLite can't handle that many concurrent connections well.
- Add connection pooling to manage database connections efficiently.
- Add indexes on frequently queried columns like user_id and created_at.

**Authentication:**
- Add user login/signup functionality. Probably use JWT tokens for stateless authentication.
- Modify the documents table to include a user_id foreign key so users only see their own documents.
- Maybe add role-based access if we need admins or different user types.

**File Storage:**
- Move files to cloud storage like AWS S3 or Google Cloud Storage. Local file storage won't work for 1,000 users.
- Use a CDN to serve files faster to users around the world.
- Implement file versioning and automated backups.

**Security:**
- Scan uploaded files for malware/viruses before storing them.
- Add rate limiting to prevent abuse (e.g., max 10 uploads per minute per user).
- Validate and sanitize all inputs properly.
- Use HTTPS everywhere and implement secure file upload practices.

**Performance:**
- Add Redis for caching frequently accessed data.
- Implement pagination for the document list (can't load 10,000 documents at once).
- Optimize database queries and add proper indexes.
- Use nginx as a reverse proxy for load balancing.


**Architecture:**
- Consider breaking into microservices if different parts need to scale independently.
- Use message queues for async tasks like file processing.
- Run multiple server instances behind a load balancer.

**Frontend:**
- Implement lazy loading and virtual scrolling for large document lists.
- Add client-side caching to reduce API calls.

## 2. Architecture Overview

Here's how everything connects:

**Frontend Layer:**
- React application running in the browser
- User interacts with UI components (upload form, document list, etc.)
- Makes HTTP requests to backend API endpoints
- Handles file selection, validation, and display

**Backend Layer:**
- Express.js server running on Node.js
- Receives HTTP requests from frontend
- API Endpoints:
  - POST /documents/upload - Handles file uploads
  - GET /documents - Returns list of all documents
  - GET /documents/:id - Downloads a specific file
  - DELETE /documents/:id - Deletes a file
- Processes requests using middleware (multer for file uploads, cors for cross-origin)

**Data Layer:**
- SQLite Database (documents.db):
  - Stores document metadata (id, filename, filepath, filesize, created_at)
  - Single table: `documents`
  - Provides data persistence and querying

**Storage Layer:**
- Local File System (backend/uploads/):
  - Stores actual PDF files
  - Files saved with unique names (timestamp + random number + original filename)
  - Prevents filename conflicts

**Flow:**
- User action → React frontend → HTTP request → Express backend → Database/File System → Response → React frontend → UI update

## 3. API Specification

### Endpoint 1: Upload a PDF

**URL:** `POST /documents/upload`

**Method:** POST

**What it does:** Takes a PDF file, saves it to disk, and stores the metadata in the database.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with a `file` field containing the PDF

**Example using curl:**
```bash
curl -X POST http://localhost:3001/documents/upload \
  -F "file=@prescription.pdf"
```

**Success Response (201):**
```json
{
  "message": "File uploaded successfully",
  "document": {
    "id": 1,
    "filename": "prescription.pdf",
    "filesize": 245678,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Only PDF files are allowed"
}
```

---

### Endpoint 2: List All Documents

**URL:** `GET /documents`

**Method:** GET

**What it does:** Returns a list of all uploaded documents with their metadata.

**Example using curl:**
```bash
curl -X GET http://localhost:3001/documents
```

**Success Response (200):**
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "prescription.pdf",
      "filesize": 245678,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "filename": "test_results.pdf",
      "filesize": 189234,
      "created_at": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch documents"
}
```

---

### Endpoint 3: Download a File

**URL:** `GET /documents/:id`

**Method:** GET

**What it does:** Downloads the actual PDF file by its ID.

**Example using curl:**
```bash
curl -X GET http://localhost:3001/documents/1 \
  -o downloaded_file.pdf
```

**Success Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="prescription.pdf"`
- Body: The actual PDF file bytes

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

---

### Endpoint 4: Delete a File

**URL:** `DELETE /documents/:id`

**Method:** DELETE

**What it does:** Removes the file from disk and deletes its record from the database.

**Example using curl:**
```bash
curl -X DELETE http://localhost:3001/documents/1
```

**Success Response (200):**
```json
{
  "message": "Document deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

---

## 4. Data Flow Description

### Q5. Describe the step-by-step process of what happens when a file is uploaded and when it is downloaded.

#### File Upload Flow:

1. **User picks a file**: User clicks the file input in the React app and selects a PDF. The frontend checks it's actually a PDF and under 10MB.

2. **Frontend sends request**: React creates a FormData object with the file and POSTs it to `/documents/upload`.

3. **Backend receives and processes**: 
   - Express gets the request
   - Multer middleware handles it:
     - Checks file type is PDF
     - Checks size is under 10MB
     - Generates a unique filename (timestamp + random number + original name) to avoid conflicts
     - Saves the file to `backend/uploads/`

4. **Save to database**: Backend extracts the original filename, filepath, and size, then inserts a row into the SQLite `documents` table. The `created_at` timestamp is automatically set.

5. **Send response**: Backend returns the document metadata including the new ID. If the database insert fails, we delete the uploaded file to keep things clean.

6. **Update UI**: React gets the success response, shows a success message, refetches the document list to show the new file, and clears the upload form.

#### File Download Flow:

1. **User clicks download**: User clicks the "Download" button for a document in the React app.

2. **Frontend requests file**: React sends a GET request to `/documents/:id` with `responseType: 'blob'` to handle binary data.

3. **Backend finds file**: 
   - Express looks up the document by ID in SQLite
   - If not found, returns 404
   - If found, checks the file actually exists on disk

4. **Send file**: Backend reads the file from disk and streams it back with proper headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename="original_name.pdf"`

5. **Frontend handles download**: 
   - React receives the blob
   - Creates a temporary URL for it
   - Creates a hidden `<a>` tag with download attribute
   - Programmatically clicks it to trigger browser download
   - Cleans up the temporary URL
   - Shows a success message

## 5. Assumptions

### Q6. What assumptions did you make while building this?

Here are the assumptions I made:

1. **Single user**: No authentication system. Anyone who can access the app can see and manage all documents. This keeps things simple for the demo.

2. **File size limit**: Set to 10MB max per file. Medical documents are usually small, and this prevents someone from uploading huge files and filling up disk space.

3. **PDF only**: Only accepts PDF files. Validated on both frontend (for better UX) and backend (for security). Checks the MIME type to make sure it's actually a PDF.

4. **Local development**: Built for running on localhost. No HTTPS, no domain setup, CORS enabled for local dev. Not production-ready as-is.

5. **Concurrency**: SQLite works fine for single-user scenarios. Not worried about multiple people uploading at the same time. File operations are blocking/synchronous.

6. **Error handling**: Basic error handling in place. If database insert fails after file upload, we delete the file. Shows user-friendly error messages.

7. **File storage**: Files stored locally in `backend/uploads/`. No cloud storage, no distributed system. Files stay until explicitly deleted.

8. **Database schema**: Simple schema with just the essentials - id, filename, filepath, filesize, created_at. No soft deletes, no versioning, no history.

9. **Security**: 
   - No virus/malware scanning of uploaded files
   - No rate limiting on endpoints
   - Basic input validation
   - Files stored unencrypted

10. **Performance**: 
    - No pagination (assumes reasonable number of documents)
    - No caching
    - Direct file system access

11. **Browser support**: Assumes modern browsers with ES6+ and File/Blob APIs.

12. **Network**: Assumes stable connection. No retry logic for network failures.
