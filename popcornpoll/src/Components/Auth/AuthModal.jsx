import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./AuthModal.css";

const AuthModal = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    loginWithGoogle, 
    signUpWithEmail, 
    signInWithEmail 
  } = useAuth();

  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, username);
        showToast("Account created successfully!", "success");
      } else {
        await signInWithEmail(email, password);
        showToast("Signed in successfully!", "success");
      }
      setAuthModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Authentication failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast("Signed in with Google successfully!", "success");
      setAuthModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Google sign in failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
  };

  return (
    <div className="auth-modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="auth-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={() => setAuthModalOpen(false)} aria-label="Close modal">
          &times;
        </button>

        <h2 className="auth-modal-title">
          {isSignUp ? "Create an Account" : "Welcome Back"}
        </h2>
        <p className="auth-modal-subtitle">
          {isSignUp 
            ? "Sign up to track, create, and share movie polls." 
            : "Sign in to access your polls and settings."
          }
        </p>

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                required
                placeholder="e.g. MovieBuff99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="auth-modal-divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          className="btn btn-secondary auth-google-btn"
          disabled={loading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
            className="google-logo-icon"
          />
          Continue with Google
        </button>

        <p className="auth-modal-switch-text">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            className="auth-modal-switch-btn"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
