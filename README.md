# Patient Portal - Medical Document Management

A full-stack application for managing medical documents (PDFs) with upload, view, download, and delete functionality.

## Project Structure

```
in18_tanmay/
├── backend/
│   ├── server.js          # Express server and API endpoints
│   ├── package.json       # Backend dependencies
│   ├── uploads/           # PDF files storage (created automatically)
│   └── documents.db       # SQLite database (created automatically)
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (Header, UploadSection, etc.)
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions (formatters)
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Main styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # Frontend dependencies
├── design.md              # Design document with architecture and API specs
└── README.md              # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## Features

-  Upload PDF files (with validation)
-  View all uploaded documents
-  Download documents
-  Delete documents
-  Success/error message notifications
-  Responsive design

## API Endpoints

- `POST /documents/upload` - Upload a PDF file
- `GET /documents` - List all documents
- `GET /documents/:id` - Download a specific file
- `DELETE /documents/:id` - Delete a file

See `design.md` for detailed API documentation.

## Example API Calls

### Using cURL

#### 1. Upload a PDF File
```bash
curl -X POST http://localhost:3001/documents/upload \
  -F "file=@/path/to/your/document.pdf"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "document": {
    "id": 1,
    "filename": "document.pdf",
    "filesize": 245678,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. List All Documents
```bash
curl -X GET http://localhost:3001/documents
```

**Response:**
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

#### 3. Download a Specific File
```bash
curl -X GET http://localhost:3001/documents/1 \
  -o downloaded_file.pdf
```

**Response:** Binary PDF file content

#### 4. Delete a File
```bash
curl -X DELETE http://localhost:3001/documents/1
```

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

### Using Postman

#### 1. Upload a PDF File
- **Method:** POST
- **URL:** `http://localhost:3001/documents/upload`
- **Body:** Select `form-data`
- **Key:** `file` (type: File)
- **Value:** Select your PDF file

#### 2. List All Documents
- **Method:** GET
- **URL:** `http://localhost:3001/documents`

#### 3. Download a Specific File
- **Method:** GET
- **URL:** `http://localhost:3001/documents/:id`
- Replace `:id` with the document ID (e.g., `1`)
- **Send and Download:** Click "Send and Download" in Postman

#### 4. Delete a File
- **Method:** DELETE
- **URL:** `http://localhost:3001/documents/:id`
- Replace `:id` with the document ID (e.g., `1`)

## File Limits

- Maximum file size: 10MB
- Accepted file types: PDF only

## Database Schema

The `documents` table contains:
- `id` (INTEGER PRIMARY KEY)
- `filename` (TEXT)
- `filepath` (TEXT)
- `filesize` (INTEGER)
- `created_at` (DATETIME)

## Notes

- Files are stored in `backend/uploads/` directory
- Database file is created automatically as `backend/documents.db`
- The application assumes a single user (no authentication)
- All operations are performed locally



