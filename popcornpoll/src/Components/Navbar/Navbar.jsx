import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DarkMode from "../DarkMode/DarkMode";
import logo from "../../assets/popcornpoll.png";
import "./Navbar.css";

const Navbar = () => {
  const { user, setAuthModalOpen } = useAuth();
  const [draftCount, setDraftCount] = useState(0);

  // Read draft count from session storage
  const updateDraftCount = () => {
    try {
      const draft = JSON.parse(sessionStorage.getItem("draft_poll_movies") || "[]");
      setDraftCount(draft.length);
    } catch (e) {
      setDraftCount(0);
    }
  };

  useEffect(() => {
    updateDraftCount();

    // Listen for draft updates (custom event from MovieCard / PollCreate)
    window.addEventListener("draftPollUpdated", updateDraftCount);
    return () => {
      window.removeEventListener("draftPollUpdated", updateDraftCount);
    };
  }, []);

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };

  const username = user && !user.isAnonymous ? user.displayName : "Guest";
  const avatarUrl = user && user.photoURL 
    ? user.photoURL 
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "guest"}`;

  return (
    <nav className="navbar align_center">
      <Link to="/" className="logo-title">
        <img src={logo} alt="PopcornPoll logo" className="logo animated-logo" />
        <h1 className="brand-text">Popcorn<span>Poll</span></h1>
      </Link>
      
      <div className="nav-right">
        <ul className="nav-links align_center">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? "active" : "")}>
              Browse
            </NavLink>
          </li>
          <li>
            <NavLink to="/poll/create" className={({ isActive }) => (isActive ? "active" : "")}>
              Create Poll {draftCount > 0 && <span className="nav-badge">{draftCount}</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </li>
        </ul>

        <div className="align_center" style={{ gap: "16px" }}>
          <DarkMode />
          
          <div className="nav-user-profile">
            {user ? (
              <Link to="/profile" className="align_center" style={{ gap: "8px" }} title="View Profile">
                <img 
                  src={avatarUrl} 
                  alt={username} 
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                />
                <span className="nav-username">{username}</span>
              </Link>
            ) : (
              <button onClick={handleSignIn} className="btn btn-primary btn-sm">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;