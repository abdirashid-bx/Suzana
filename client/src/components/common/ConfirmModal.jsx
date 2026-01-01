import React from 'react';
import { FiCreditCard } from 'react-icons/fi';
import './ConfirmModal.css';

const ConfirmModal = ({
  open,
  title = 'Confirm Payment?',
  message,
  amountFormatted,
  studentName,
  subText = 'This transaction will be processed immediately.',
  onConfirm,
  onCancel,
  confirmText = 'Confirm Payment',
  cancelText = 'Cancel',
  loading = false,
  variant = 'success',
}) => {
  if (!open) return null;

  const buildMessage = () => {
    if (message) return message;
    return (
      <>Are you sure you want to pay <strong>{amountFormatted}</strong> for <strong>{studentName}</strong>?</>
    );
  };

  return (
    <div className="cm-overlay" role="dialog" aria-modal="true">
      <div className="cm-modal">
        <div className={`cm-icon-wrapper cm-${variant}`}>
          <div className="cm-icon"><FiCreditCard /></div>
        </div>

        <div className="cm-content">
          <h3 className="cm-title">{title}</h3>

          <div className="cm-body">
            <p className="cm-message">{buildMessage()}</p>
            <p className="cm-subtext">{subText}</p>
          </div>

          <div className="cm-footer">
            <button className="cm-btn cm-btn-cancel" onClick={onCancel} disabled={loading}>{cancelText}</button>
            <button className={`cm-btn cm-btn-confirm cm-btn-${variant}`} onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
