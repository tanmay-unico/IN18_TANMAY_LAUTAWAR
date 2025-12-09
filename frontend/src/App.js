import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Message from './components/Message';
import UploadSection from './components/UploadSection';
import DocumentList from './components/DocumentList';
import DeleteDialog from './components/DeleteDialog';
import { documentService } from './services/api';
import './App.css';
import './components/Button.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, filename: '' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await documentService.getAll();
      setDocuments(docs);
    } catch (error) {
      showMessage('Failed to fetch documents', 'error');
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      await documentService.upload(file);
      showMessage('File uploaded successfully!', 'success');
      fetchDocuments();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to upload file';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const blob = await documentService.download(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage('File downloaded successfully!', 'success');
    } catch (error) {
      showMessage('Failed to download file', 'error');
    }
  };

  const openDeleteDialog = (id, filename) => {
    setDeleteDialog({ isOpen: true, id, filename });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, id: null, filename: '' });
  };

  const confirmDelete = async () => {
    const { id } = deleteDialog;
    try {
      await documentService.delete(id);
      showMessage('File deleted successfully!', 'success');
      fetchDocuments();
      closeDeleteDialog();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete file';
      showMessage(errorMessage, 'error');
      closeDeleteDialog();
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  return (
    <div className="app">
      <div className="container">
        <Header />
        <Message text={message.text} type={message.type} />
        <UploadSection onUpload={handleUpload} loading={loading} showMessage={showMessage} />
        <DocumentList 
          documents={documents} 
          onDownload={handleDownload} 
          onDelete={openDeleteDialog} 
        />
      </div>
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        filename={deleteDialog.filename}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

export default App;
