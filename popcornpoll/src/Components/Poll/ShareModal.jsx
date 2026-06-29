import React from "react";
import { Modal } from "../UI/UIComponents";
import { copyToClipboard } from "../../utils/helpers";
import { useToast } from "../../context/ToastContext";
import "./Poll.css";

const ShareModal = ({ isOpen, onClose, pollId, question }) => {
  const { showToast } = useToast();
  const pollUrl = `${window.location.origin}/poll/${pollId}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(pollUrl);
    if (success) {
      showToast("Link copied to clipboard!", "success");
    } else {
      showToast("Failed to copy link.", "error");
    }
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Vote on this PopcornPoll: "${question}" 🎬🍿`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pollUrl)}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Vote on this PopcornPoll: "${question}" - ${pollUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareDiscord = async () => {
    const formattedText = `**PopcornPoll:** ${question}\nVote here: ${pollUrl}`;
    const success = await copyToClipboard(formattedText);
    if (success) {
      showToast("Formatted Discord message copied!", "info");
    } else {
      showToast("Failed to copy text.", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share this Poll">
      <div className="share-modal-body">
        <p style={{ marginBottom: "12px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Share this link with your friends to collect their votes:
        </p>
        
        <div className="share-input-group">
          <input 
            type="text" 
            readOnly 
            value={pollUrl} 
            className="share-link-input"
            onClick={(e) => e.target.select()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleCopy}>
            📋 Copy
          </button>
        </div>

        <div className="share-links-grid">
          <button className="share-btn-social" onClick={shareTwitter}>
            <span className="share-btn-icon">🐦</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Twitter/X</span>
          </button>
          
          <button className="share-btn-social" onClick={shareWhatsApp}>
            <span className="share-btn-icon">💬</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>WhatsApp</span>
          </button>
          
          <button className="share-btn-social" onClick={shareDiscord}>
            <span className="share-btn-icon">🎮</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Discord</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
