import React, { useState, useEffect } from "react";
import Hero from "../Components/Hero/Hero";
import PollCard from "../Components/Poll/PollCard";
import MovieList from "../Components/MovieList/MovieList";
import { fetchPolls } from "../utils/firebase";
import { Skeleton } from "../Components/UI/UIComponents";
import { isExpired } from "../utils/helpers";

const Home = () => {
  const [activePolls, setActivePolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);

  useEffect(() => {
    const getRecentPolls = async () => {
      try {
        const polls = await fetchPolls("recent", 50);
        const active = polls.filter(p => !isExpired(p.expiresAt));
        setActivePolls(active.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch polls", err);
      } finally {
        setPollsLoading(false);
      }
    };
    getRecentPolls();
  }, []);

  return (
    <div className="home-page" style={{ paddingBottom: "60px" }}>
      <Hero />
      
      {/* Active Polls Section */}
      <section className="recent-polls-section container" style={{ marginTop: "40px" }}>
        <div className="flex-between" style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>🔥 Live Polls</h2>
        </div>

        {pollsLoading ? (
          <div className="grid-responsive">
            {[1, 2].map((n) => (
              <div key={n} className="glass-panel" style={{ padding: "24px", height: "180px" }}>
                <Skeleton type="title" />
                <Skeleton type="text" />
                <Skeleton type="text" />
              </div>
            ))}
          </div>
        ) : activePolls.length > 0 ? (
          <div className="grid-responsive">
            {activePolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: "40px", textAlignment: "center", color: "var(--text-muted)", textAlign: "center" }}>
            <p>No active polls found. Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* Movies Showcases */}
      <div style={{ marginTop: "60px" }}>
        <MovieList type="popular" title="Popular Movies" />
        <MovieList type="top_rated" title="Top Rated Movies" />
      </div>
    </div>
  );
};

export default Home;
