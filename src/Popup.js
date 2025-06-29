import React from 'react';
import './Popup.css';

function Popup({ isOpen, onClose, title, message, type = 'success' }) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className={`popup ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>{title}</h3>
          <button className="popup-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="popup-content">
          <p>{message}</p>
        </div>
        <div className="popup-footer">
          <button className="popup-button" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup; 