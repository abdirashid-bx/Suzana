import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    title = 'Are you sure?',
    message,
    subMessage,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="dcm-overlay">
            <div className="dcm-modal">
                <div className="dcm-icon-wrapper">
                    <FiAlertTriangle className="dcm-icon" />
                </div>

                <div className="dcm-content">
                    {message ? (
                        <p className="dcm-message">{message}</p>
                    ) : (
                        <p className="dcm-message">
                            Are you sure you want to delete <strong>{itemName}</strong>?
                        </p>
                    )}

                    {subMessage && (
                        <p className="dcm-sub-message">{subMessage}</p>
                    )}
                </div>

                <div className="dcm-actions">
                    <button
                        className="dcm-btn dcm-btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="dcm-btn dcm-btn-delete"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
