import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchUserCreatedPolls, deletePoll } from "../utils/firebase";
import PollCard from "../Components/Poll/PollCard";
import { Skeleton } from "../Components/UI/UIComponents";
import { isExpired } from "../utils/helpers";

const Profile = () => {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [createdPolls, setCreatedPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const getUserData = async () => {
      if (!user) return;
      setLoadingPolls(true);
      try {
        const polls = await fetchUserCreatedPolls(user.uid);
        const activeOnly = polls.filter(p => !isExpired(p.expiresAt));
        setCreatedPolls(activeOnly);
      } catch (err) {
        console.error("Failed to load user profile polls", err);
      } finally {
        setLoadingPolls(false);
      }
    };
    
    getUserData();
  }, [user]);

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast("Signed out successfully.", "info");
    } catch (err) {
      showToast("Sign out failed.", "error");
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }
    try {
      showToast("Deleting poll...", "info");
      await deletePoll(pollId, user?.uid);
      setCreatedPolls(prev => prev.filter(p => p.id !== pollId));
      showToast("Poll deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete poll.", "error");
    }
  };

  if (!user) {
    return null;
  }

  const isAnonymous = user.isAnonymous;
  const username = isAnonymous ? "Anonymous User" : user.displayName;
  const avatarUrl = isAnonymous 
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}` 
    : user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  return (
    <div className="container section-padding" style={{ maxWidth: "900px" }}>
      {/* Profile Info panel */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "32px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          textAlign: "center",
          marginBottom: "40px" 
        }}
      >
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          referrerPolicy="no-referrer"
          style={{ 
            width: "96px", 
            height: "96px", 
            borderRadius: "50%", 
            border: "3px solid var(--primary-color)",
            marginBottom: "16px",
            backgroundColor: "var(--input-bg)"
          }} 
        />
        
        <h2 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>{username}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
          {isAnonymous 
            ? "You are logged in anonymously. Connect your Google account to sync polls across devices."
            : `Linked Email: ${user.email}`
          }
        </p>

        {isAnonymous ? (
          <button className="btn btn-primary" onClick={handleSignIn}>
            🔑 Sign In / Connect Account
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={handleSignOut}>
            🚪 Sign Out
          </button>
        )}
      </div>

      {/* User Created Polls Section */}
      <div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "24px" }}>📋 My Created Polls ({createdPolls.length})</h2>

        {loadingPolls ? (
          <div className="grid-responsive">
            {[1, 2].map((n) => (
              <div key={n} className="glass-panel" style={{ padding: "24px", height: "200px" }}>
                <Skeleton type="title" />
                <Skeleton type="text" />
              </div>
            ))}
          </div>
        ) : createdPolls.length > 0 ? (
          <div className="grid-responsive">
            {createdPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} onDelete={handleDeletePoll} />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <p>You haven't created any polls yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
