import React from 'react';
import { formatFileSize, formatDate } from '../utils/formatters';
import './DocumentCard.css';
import './Button.css';

const DocumentCard = ({ document, onDownload, onDelete }) => {
  return (
    <div className="document-card">
      <div className="document-info">
        <h3 className="document-name">{document.filename}</h3>
        <div className="document-meta">
          <span className="meta-item">
            <strong>Size:</strong> {formatFileSize(document.filesize)}
          </span>
          <span className="meta-item">
            <strong>Uploaded:</strong> {formatDate(document.created_at)}
          </span>
        </div>
      </div>
      <div className="document-actions">
        <button
          onClick={() => onDownload(document.id, document.filename)}
          className="btn btn-secondary"
        >
          Download
        </button>
        <button
          onClick={() => onDelete(document.id, document.filename)}
          className="btn btn-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;

