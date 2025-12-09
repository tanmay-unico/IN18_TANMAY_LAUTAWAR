const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const dbPath = path.join(__dirname, 'documents.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filesize INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Documents table ready');
      }
    });
  }
});

app.post('/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { filename, path: filepath, size: filesize } = req.file;

  db.run(
    'INSERT INTO documents (filename, filepath, filesize) VALUES (?, ?, ?)',
    [req.file.originalname, filepath, filesize],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        fs.unlinkSync(filepath);
        return res.status(500).json({ error: 'Failed to save document metadata' });
      }

      res.status(201).json({
        message: 'File uploaded successfully',
        document: {
          id: this.lastID,
          filename: req.file.originalname,
          filesize: filesize,
          created_at: new Date().toISOString()
        }
      });
    }
  );
});

app.get('/documents', (req, res) => {
  db.all('SELECT id, filename, filesize, created_at FROM documents ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }

    res.json({
      documents: rows.map(row => {
        let timestamp = row.created_at;
        if (timestamp && !timestamp.includes('T') && !timestamp.includes('Z')) {
          timestamp = timestamp.replace(' ', 'T') + 'Z';
        }
        return {
          id: row.id,
          filename: row.filename,
          filesize: row.filesize,
          created_at: timestamp
        };
      })
    });
  });
});

app.get('/documents/:id', (req, res) => {
  const documentId = parseInt(req.params.id);

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = row.filepath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, row.filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  });
});

app.delete('/documents/:id', (req, res) => {
  const documentId = parseInt(req.params.id);

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = row.filepath;

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('File deletion error:', unlinkErr);
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      db.run('DELETE FROM documents WHERE id = ?', [documentId], (deleteErr) => {
        if (deleteErr) {
          console.error('Database deletion error:', deleteErr);
          return res.status(500).json({ error: 'Failed to delete document record' });
        }

        res.json({ message: 'Document deleted successfully' });
      });
    });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

