import React from 'react';
import DocumentCard from './DocumentCard';
import './DocumentList.css';

const DocumentList = ({ documents, onDownload, onDelete }) => {
  if (documents.length === 0) {
    return (
      <section className="documents-section">
        <h2>Your Documents (0)</h2>
        <div className="empty-state">
          <p>No documents uploaded yet.</p>
          <p>Upload your first medical document above.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="documents-section">
      <h2>Your Documents ({documents.length})</h2>
      <div className="documents-list">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
};

export default DocumentList;

