import React from "react";
import "./UI.css";

export const Skeleton = ({ className, type = "text" }) => {
  return <div className={`skeleton skeleton-${type} ${className || ""}`} />;
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export const Button = ({ 
  children, 
  variant = "primary", 
  onClick, 
  disabled = false, 
  className = "", 
  type = "button" 
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${disabled ? "btn-disabled" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
