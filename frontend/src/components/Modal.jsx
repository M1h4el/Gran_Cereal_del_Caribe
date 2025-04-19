import React from 'react'
import "@/styles/Modal.scss"

function Modal({ open, onClose, children, onConfirm }) {
    if (!open) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>
            ✖
          </button>
          {children}
        </div>
      </div>
    );
}

export default Modal