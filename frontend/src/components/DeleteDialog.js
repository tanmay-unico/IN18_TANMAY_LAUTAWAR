import React from 'react';
import './DeleteDialog.css';
import './Button.css';

const DeleteDialog = ({ isOpen, filename, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <p className="dialog-message">
          Delete <strong>"{filename}"</strong>?
        </p>
        <div className="dialog-actions">
          <button
            onClick={onCancel}
            className="btn btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;

