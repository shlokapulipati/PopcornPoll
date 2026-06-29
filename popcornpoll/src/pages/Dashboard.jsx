import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Chart as ChartJS, 
  ArcElement, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { fetchPolls, fetchUserCreatedPolls } from "../utils/firebase";
import { calculateAnalytics } from "../utils/analytics";
import { Skeleton } from "../Components/UI/UIComponents";
import { useAuth } from "../context/AuthContext";
import { isExpired } from "../utils/helpers";

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPolls, setUserPolls] = useState([]);
  const [loadingUserPolls, setLoadingUserPolls] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setLoading(false);
        setLoadingUserPolls(false);
        return;
      }
      try {
        setLoading(true);
        setLoadingUserPolls(true);
        const polls = await fetchUserCreatedPolls(user.uid);
        setUserPolls(polls);
        const calculated = calculateAnalytics(polls);
        setStats(calculated);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
        setStats({
          totalPolls: 0,
          totalVotes: 0,
          mostVotedPoll: null,
          genreDistribution: {},
          activityHistory: []
        });
      } finally {
        setLoading(false);
        setLoadingUserPolls(false);
      }
    };
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="container section-padding">
        <Skeleton type="title" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px" }}>
          <Skeleton type="poster" />
          <Skeleton type="poster" />
        </div>
      </div>
    );
  }

  // Genre distribution chart configurations
  const genreLabels = Object.keys(stats.genreDistribution || {});
  const genreData = Object.values(stats.genreDistribution || {});

  const doughnutData = {
    labels: genreLabels.length > 0 ? genreLabels : ["No Genres"],
    datasets: [
      {
        label: "Votes by Genre",
        data: genreData.length > 0 ? genreData : [1],
        backgroundColor: [
          "#ff9800",
          "#3b82f6",
          "#10b981",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#f59e0b",
          "#14b8a6"
        ],
        borderWidth: 1
      }
    ]
  };

  // Activity over time chart configurations
  const barData = {
    labels: stats.activityHistory.map(h => h.date),
    datasets: [
      {
        label: "Votes cast",
        data: stats.activityHistory.map(h => h.votes),
        backgroundColor: "rgba(255, 152, 0, 0.75)",
        borderColor: "#ff9800",
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="container section-padding">
      <header style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📊 Analytics & Insights</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Real-time metrics, genre trends, and voting activities across all PopcornPolls.
        </p>
      </header>

      {/* Metrics Top Row */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
          gap: "24px",
          marginBottom: "40px"
        }}
      >
        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>TOTAL POLLS CREATED</span>
          <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary-color)" }}>{stats.totalPolls}</span>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>TOTAL VOTES CAST</span>
          <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary-color)" }}>{stats.totalVotes}</span>
        </div>

        {stats.mostVotedPoll && (
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>MOST POPULAR POLL</span>
            <Link 
              to={`/poll/${stats.mostVotedPoll.id}`} 
              style={{ fontSize: "1.1rem", fontWeight: 700, display: "block", marginTop: "8px", color: "var(--text-color)" }}
            >
              {stats.mostVotedPoll.question.slice(0, 40)}...
            </Link>
            <span style={{ fontSize: "0.85rem", color: "var(--primary-color)" }}>🔥 {stats.mostVotedPoll.totalVotes} votes</span>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* Doughnut distribution */}
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ marginBottom: "20px", alignSelf: "flex-start" }}>🎭 Vote Distribution by Genre</h3>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px", height: "340px" }}>
            <Doughnut 
              data={doughnutData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: "rgba(150, 150, 150, 0.9)" }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* My Polls Section */}
      <div className="glass-panel" style={{ marginTop: "40px", padding: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          📋 My Created Polls & Live Results
        </h2>
        
        {loadingUserPolls ? (
          <div>
            <Skeleton type="title" />
            <Skeleton type="text" />
          </div>
        ) : userPolls.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {userPolls.map((poll) => {
              const expired = isExpired(poll.expiresAt);
              return (
                <div 
                  key={poll.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: "24px", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                        {poll.question}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Created on {new Date(poll.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span 
                      className={`poll-status-badge ${expired ? "expired" : "active"}`}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: expired ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: expired ? "#ef4444" : "#10b981",
                        border: expired ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)"
                      }}
                    >
                      {expired ? "Closed" : "Active"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                    {poll.options.map((opt) => {
                      const pct = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;
                      return (
                        <div key={opt.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                            <span style={{ fontWeight: 600 }}>{opt.title}</span>
                            <span style={{ color: "var(--primary-color)" }}>
                              <strong>{pct}%</strong> ({opt.votes || 0} votes)
                            </span>
                          </div>
                          <div style={{ 
                            width: "100%", 
                            height: "8px", 
                            background: "rgba(255, 255, 255, 0.05)", 
                            borderRadius: "4px",
                            overflow: "hidden"
                          }}>
                            <div style={{ 
                              width: `${pct}%`, 
                              height: "100%", 
                              background: "linear-gradient(135deg, #ff9800, #f57c00)", 
                              borderRadius: "4px",
                              transition: "width 0.4s ease"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Total Votes Cast: <strong>{poll.totalVotes || 0}</strong>
                    </span>
                    <Link to={`/poll/${poll.id}`} className="btn btn-secondary btn-sm">
                      🔍 View Poll & Vote Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            <p>You haven't created any polls yet.</p>
            <Link to="/poll/create" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>
              ⚡ Create Your First Poll
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
