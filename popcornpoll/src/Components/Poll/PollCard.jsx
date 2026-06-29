import React from "react";
import { Link } from "react-router-dom";
import { formatDate, getTimeRemaining, isExpired } from "../../utils/helpers";
import "./Poll.css";

const PollCard = ({ poll, onDelete }) => {
  const expired = isExpired(poll.expiresAt);
  const timeRemaining = getTimeRemaining(poll.expiresAt);

  return (
    <div className="poll-card glass-panel">
      <div className="poll-card-header">
        <span className={`poll-status-badge ${expired ? "expired" : "active"}`}>
          {expired ? "Closed" : "Active"}
        </span>
        <span className="poll-card-date">{formatDate(poll.createdAt)}</span>
      </div>
      
      <h3 className="poll-card-question">{poll.question}</h3>
      
      <div className="poll-card-options-preview">
        {poll.options.slice(0, 4).map((opt) => (
          <div key={opt.id} className="poll-card-option-thumb">
            {opt.poster ? (
              <img src={opt.poster} alt={opt.title} className="thumb-img" />
            ) : (
              <div className="thumb-placeholder">🎬</div>
            )}
            <span className="thumb-title">{opt.title}</span>
            <span className="thumb-votes">{opt.votes || 0} votes</span>
          </div>
        ))}
      </div>

      <div className="poll-card-footer">
        <div className="poll-card-stats">
          <span>🗳️ <strong>{poll.totalVotes || 0}</strong> votes</span>
          <span>•</span>
          <span>👤 By {poll.creatorName}</span>
        </div>
        <div className="poll-card-actions" style={{ display: "flex", gap: "8px" }}>
          {onDelete && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(poll.id);
              }}
              className="btn btn-secondary btn-sm"
              style={{ 
                padding: "8px 10px",
                backgroundColor: "rgba(239, 68, 68, 0.1)", 
                borderColor: "rgba(239, 68, 68, 0.3)", 
                color: "#ef4444" 
              }}
              title="Delete Poll"
            >
              🗑️
            </button>
          )}
          <Link to={`/poll/${poll.id}`} className="btn btn-primary btn-sm">
            {expired ? "View Results" : "Vote Now"}
          </Link>
        </div>
      </div>
      {!expired && <div className="poll-card-time">{timeRemaining}</div>}
    </div>
  );
};

export default PollCard;
