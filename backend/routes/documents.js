const express = require('express');
const fs = require('fs');
const path = require('path');
const { upload } = require('../storage');
const db = require('../db');

const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filepath, size: filesize } = req.file;

  db.run(
    'INSERT INTO documents (filename, filepath, filesize) VALUES (?, ?, ?)',
    [req.file.originalname, filepath, filesize],
    function insertCb(err) {
      if (err) {
        fs.unlinkSync(filepath);
        return res.status(500).json({ error: 'Failed to save document metadata' });
      }

      return res.status(201).json({
        message: 'File uploaded successfully',
        document: {
          id: this.lastID,
          filename: req.file.originalname,
          filesize,
          created_at: new Date().toISOString()
        }
      });
    }
  );
});

router.get('/', (req, res) => {
  db.all('SELECT id, filename, filesize, created_at FROM documents ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }

    return res.json({
      documents: rows.map((row) => {
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

router.get('/:id', (req, res) => {
  const documentId = parseInt(req.params.id, 10);

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch document' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = row.filepath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    return res.download(filePath, row.filename, (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  });
});

router.delete('/:id', (req, res) => {
  const documentId = parseInt(req.params.id, 10);

  db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch document' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = row.filepath;

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      db.run('DELETE FROM documents WHERE id = ?', [documentId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: 'Failed to delete document record' });
        }

        return res.json({ message: 'Document deleted successfully' });
      });
    });
  });
});

module.exports = router;

