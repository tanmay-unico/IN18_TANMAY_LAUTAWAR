import React, { useState } from 'react';
import './UploadSection.css';
import './Button.css';

const UploadSection = ({ onUpload, loading, showMessage }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showMessage('Please select a PDF file', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showMessage('File size must be less than 10MB', 'error');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showMessage('Please select a file to upload', 'error');
      return;
    }

    await onUpload(selectedFile);
    setSelectedFile(null);
    e.target.reset();
  };

  return (
    <section className="upload-section">
      <h2>Upload Document</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-input"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {selectedFile ? selectedFile.name : 'Choose PDF file'}
          </label>
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!selectedFile || loading}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </section>
  );
};

export default UploadSection;

