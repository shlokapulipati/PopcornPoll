import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div 
      className="container align_center" 
      style={{ 
        flexDirection: "column", 
        justifyContent: "center", 
        minHeight: "75vh", 
        textAlign: "center" 
      }}
    >
      <h1 style={{ fontSize: "5rem", color: "var(--primary-color)", marginBottom: "16px" }}>404</h1>
      <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>Page Not Found 🍿</h2>
      <p style={{ color: "var(--text-muted)", maxWidth: "500px", marginBottom: "32px" }}>
        The page you are looking for does not exist. It might have been moved, deleted, or you might have entered the wrong URL.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home Page
      </Link>
    </div>
  );
};

export default NotFound;
