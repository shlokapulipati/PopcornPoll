import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-grid container">
        <div className="hero-content">
          <div className="hero-badge">🎬 PopcornPoll Platform</div>
          <h1 className="hero-title">
            Decide What to Watch, <span className="highlight">Together.</span>
          </h1>
          <p className="hero-description">
            Create real-time, multi-option movie and TV show polls. Search, filter, 
            cast votes, and analyze stats with friends, family, or your online community.
          </p>
          <div className="hero-actions">
            <Link to="/poll/create" className="btn btn-primary hero-btn">
              ⚡ Create a Poll
            </Link>
            <Link to="/browse" className="btn btn-secondary hero-btn">
              🔍 Browse Movies
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="card-mockup main-mock">
            <span className="mock-title">What should we watch tonight? 🍿</span>
            <div className="mock-option">
              <span>Inception</span>
              <div className="mock-bar" style={{ width: "70%" }}></div>
              <span className="mock-percent">70%</span>
            </div>
            <div className="mock-option">
              <span>Interstellar</span>
              <div className="mock-bar" style={{ width: "45%" }}></div>
              <span className="mock-percent">45%</span>
            </div>
            <div className="mock-option">
              <span>The Dark Knight</span>
              <div className="mock-bar" style={{ width: "60%" }}></div>
              <span className="mock-percent">60%</span>
            </div>
            <div className="mock-footer">
              <span>🔥 184 votes cast</span>
              <span>Active</span>
            </div>
          </div>
          <div className="card-mockup side-mock">
            <span className="mock-badge">🏆 Trending Poll</span>
            <h3>Best Sci-Fi of all time?</h3>
            <p>1,204 voters active</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
