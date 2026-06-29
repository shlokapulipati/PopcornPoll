import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { voteOnPoll, checkIfUserVoted, updateUserVotedPoll, getPollDetails, deletePoll } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, getTimeRemaining, isExpired, exportToCSV, exportToJSON } from "../utils/helpers";
import ShareModal from "../Components/Poll/ShareModal";
import { Skeleton } from "../Components/UI/UIComponents";
import "../Components/Poll/Poll.css";

const PollView = () => {
  const { id } = useParams();
  const { user, setAuthModalOpen } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVotedOption, setUserVotedOption] = useState(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Get anonymous device ID if not logged in
  const getVoterId = () => {
    if (user && !user.isAnonymous) return user.uid;
    let anonId = localStorage.getItem("anon_voter_id");
    if (!anonId) {
      anonId = `anonymous-voter-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("anon_voter_id", anonId);
    }
    return anonId;
  };

  // Real-time Firestore Sync with immediate fallback load
  useEffect(() => {
    let active = true;

    const loadInitialPoll = async () => {
      try {
        const initialPoll = await getPollDetails(id);
        if (initialPoll && active) {
          setPoll(initialPoll);
          setLoading(false);
          
          const voterId = getVoterId();
          const votedOptionId = await checkIfUserVoted(id, voterId);
          if (active) setUserVotedOption(votedOptionId);
        }
      } catch (e) {
        console.warn("Initial poll fetch error:", e);
      }
    };
    
    loadInitialPoll();

    const docRef = doc(db, "polls", id);
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (!active) return;
        if (docSnap.exists()) {
          const pollData = docSnap.data();
          setPoll(pollData);
          
          const voterId = getVoterId();
          const votedOptionId = await checkIfUserVoted(id, voterId);
          if (active) {
            setUserVotedOption(votedOptionId);
            setLoading(false);
          }
        } else {
          // Only show error toast if we haven't loaded any cached poll details locally
          if (!poll && active) {
            showToast("Poll not found.", "error");
            setLoading(false);
          }
        }
      },
      (err) => {
        console.warn("Firestore sync error, using local/cached state:", err);
        if (active) setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [id, user]);

  const handleVote = async (optionId) => {
    if (votingInProgress) return;
    if (!user || user.isAnonymous) {
      showToast("Please sign in to vote on this poll.", "warning");
      setAuthModalOpen(true);
      return;
    }

    const voterId = getVoterId();
    const expired = isExpired(poll.expiresAt);
    
    if (expired) {
      showToast("This poll has already closed.", "warning");
      return;
    }

    setVotingInProgress(true);
    showToast("Casting vote...", "info");

    try {
      const result = await voteOnPoll(id, optionId, voterId);
      setUserVotedOption(optionId);
      
      // Update local poll state immediately so changes render instantly
      if (result && result.newOptions) {
        setPoll(prev => ({
          ...prev,
          options: result.newOptions,
          totalVotes: result.newTotalVotes
        }));
      }
      
      // Update locally in users table too
      if (user && !user.isAnonymous) {
        await updateUserVotedPoll(user.uid, id, optionId);
      }

      showToast("Vote registered successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not cast vote.", "error");
    } finally {
      setVotingInProgress(false);
    }
  };

  const handleDeletePoll = async () => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }
    try {
      showToast("Deleting poll...", "info");
      await deletePoll(id, user?.uid);
      showToast("Poll deleted successfully.", "success");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete poll.", "error");
    }
  };

  if (loading) {
    return (
      <div className="poll-view-container">
        <div className="glass-panel poll-view-card">
          <Skeleton type="title" />
          <Skeleton type="text" />
          <div style={{ marginTop: "24px" }}>
            <Skeleton type="text" />
            <Skeleton type="text" />
            <Skeleton type="text" />
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-view-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>⚠️ Poll Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
          The poll link you followed may be incorrect or the poll was deleted.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const expired = isExpired(poll.expiresAt);
  const showResults = userVotedOption !== null || expired;
  const timeRemaining = getTimeRemaining(poll.expiresAt);

  return (
    <div className="poll-view-container">
      <div className="glass-panel poll-view-card">
        
        {/* Expiry / Status row */}
        <div className="poll-info-bar">
          <span className={`poll-status-badge ${expired ? "expired" : "active"}`}>
            {expired ? "Closed" : "Live"}
          </span>
          <span>📅 Created: {formatDate(poll.createdAt)}</span>
          {!expired && <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>⏱️ {timeRemaining}</span>}
          {expired && <span style={{ fontWeight: 600, color: "var(--danger-color)" }}>⏱️ Ended</span>}
        </div>

        <h1 className="poll-question-large">{poll.question}</h1>

        <div className="poll-options-list">
          {poll.options.map((opt) => {
            const hasVotedThis = userVotedOption === opt.id;
            const percentage = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;

            return (
              <div 
                key={opt.id}
                onClick={() => !showResults && handleVote(opt.id)}
                className={`poll-option-vote-card ${hasVotedThis ? "selected" : ""} ${showResults ? "results-mode" : ""}`}
                style={{ pointerEvents: showResults ? "none" : "auto" }}
              >
                {/* Visual indicator of results percentage bar */}
                {showResults && (
                  <div 
                    className="poll-option-voted-bar"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                {opt.poster ? (
                  <img src={opt.poster} alt={opt.title} className="option-poster-small" />
                ) : (
                  <div className="option-poster-small thumb-placeholder" style={{ fontSize: "1.5rem" }}>🎬</div>
                )}

                <div className="option-details">
                  <h3 className="option-title-text">
                    {opt.title} {hasVotedThis && "✅"}
                  </h3>
                  <p className="option-meta-text">Released: {opt.releaseDate || "N/A"}</p>
                </div>

                <div className="option-vote-stats">
                  {showResults ? (
                    <>
                      <div className="option-vote-pct">{percentage}%</div>
                      <div className="option-vote-count">{opt.votes || 0} votes</div>
                    </>
                  ) : (
                    <div className="option-vote-pct" style={{ opacity: 0.2 }}>🗳️</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="poll-actions-footer">
          <div style={{ fontSize: "0.95rem" }}>
            Total Votes Cast: <strong>{poll.totalVotes || 0}</strong>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShareModalOpen(true)}
            >
              🔗 Share Poll
            </button>
            {user && poll && user.uid === poll.creatorId && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleDeletePoll}
                style={{ 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  borderColor: "rgba(239, 68, 68, 0.3)", 
                  color: "#ef4444" 
                }}
              >
                🗑️ Delete Poll
              </button>
            )}
            {showResults && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => exportToJSON(poll)}>
                  📥 JSON
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(poll)}>
                  📥 CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <Link to="/" className="btn btn-secondary">
          🏠 Home Page
        </Link>
      </div>

      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        pollId={poll.id}
        question={poll.question}
      />
    </div>
  );
};

export default PollView;
