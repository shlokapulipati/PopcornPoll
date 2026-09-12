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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { isExpired } from "../utils/helpers";
import { Button } from "@/components/ui/button";

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
        
        // Deduplicate duplicate questions inside dashboard to avoid redundant stats/bars
        const uniquePolls = [];
        const seenQuestions = new Set();
        for (const p of polls) {
          const lowerQuestion = (p.question || "").toLowerCase().trim();
          if (!seenQuestions.has(lowerQuestion)) {
            seenQuestions.add(lowerQuestion);
            uniquePolls.push(p);
          }
        }

        setUserPolls(uniquePolls);
        const calculated = calculateAnalytics(uniquePolls);
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
      <div className="min-h-screen bg-[#a6f3ff] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <Skeleton className="h-16 w-3/4 mx-auto bg-white/40 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full bg-white/40 rounded-[2rem]" />
            <Skeleton className="h-64 w-full bg-white/40 rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  const genreLabels = Object.keys(stats.genreDistribution || {});
  const genreData = Object.values(stats.genreDistribution || {});

  const doughnutData = {
    labels: genreLabels.length > 0 ? genreLabels : ["No Genres"],
    datasets: [
      {
        label: "Votes by Genre",
        data: genreData.length > 0 ? genreData : [1],
        backgroundColor: [
          "#64748b",
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

  const barData = {
    labels: stats.activityHistory.map(h => h.date),
    datasets: [
      {
        label: "Votes cast",
        data: stats.activityHistory.map(h => h.votes),
        backgroundColor: "rgba(100, 116, 139, 0.75)",
        borderColor: "#64748b",
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#a6f3ff] py-16 px-6 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-10 left-[10%] rotate-[15deg] w-32 h-16 bg-[#ffea2a] rounded-full hidden md:block opacity-70 border border-black/10 mix-blend-multiply" />
      <div className="absolute top-[40%] right-[5%] w-48 h-48 bg-[#b268f7] rounded-full hidden xl:block opacity-50 border border-black/10 mix-blend-multiply" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Analytics & Insights</h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            Real-time metrics, genre trends, and voting activities across all your PopcornPolls.
          </p>
        </header>

        {/* Metrics Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white text-center flex flex-col items-center justify-center min-h-[200px] hover:-translate-y-2 transition-transform duration-300">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Polls Created</span>
            <span className="text-6xl font-black text-slate-900">{stats.totalPolls}</span>
          </div>

          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white text-center flex flex-col items-center justify-center min-h-[200px] hover:-translate-y-2 transition-transform duration-300">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Votes Cast</span>
            <span className="text-6xl font-black text-slate-900">{stats.totalVotes}</span>
          </div>

          {stats.mostVotedPoll ? (
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white flex flex-col justify-center min-h-[200px] border-l-[12px] border-l-[#00c9ea] hover:-translate-y-2 transition-transform duration-300">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Most Popular Poll</span>
              <Link 
                to={`/poll/${stats.mostVotedPoll.id}`} 
                className="text-2xl font-bold text-slate-900 hover:text-[#00c9ea] transition-colors leading-tight mb-4"
              >
                {stats.mostVotedPoll.question.length > 50 ? `${stats.mostVotedPoll.question.slice(0, 50)}...` : stats.mostVotedPoll.question}
              </Link>
              <span className="text-lg font-black text-[#00c9ea]">{stats.mostVotedPoll.totalVotes} votes</span>
            </div>
          ) : (
             <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white flex flex-col items-center justify-center min-h-[200px] opacity-70">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Most Popular Poll</span>
              <span className="text-xl font-bold text-slate-300">No polls yet</span>
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-12 mb-16">
          {/* Doughnut distribution */}
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl border border-white flex flex-col items-center">
            <h3 className="text-3xl font-black text-slate-900 mb-8 self-start w-full text-center md:text-left">Vote Distribution by Genre</h3>
            <div className="relative w-full max-w-[400px] aspect-square">
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { padding: 20, font: { weight: "bold", size: 14 } }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* My Polls Section */}
        <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-xl border border-white">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 flex items-center gap-4">
            My Created Polls & Live Results
          </h2>
          
          {loadingUserPolls ? (
            <div className="flex flex-col gap-6">
              <Skeleton className="h-40 w-full bg-slate-100 rounded-2xl" />
              <Skeleton className="h-40 w-full bg-slate-100 rounded-2xl" />
            </div>
          ) : userPolls.length > 0 ? (
            <div className="flex flex-col gap-8">
              {userPolls.map((poll) => {
                const expired = isExpired(poll.expiresAt);
                return (
                  <div 
                    key={poll.id} 
                    className="p-8 border-4 border-slate-100 rounded-3xl bg-slate-50 hover:bg-white hover:border-[#00c9ea] hover:shadow-[0_8px_30px_rgb(0,201,234,0.12)] transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-2 border-slate-200 pb-6">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2">
                          {poll.question}
                        </h3>
                        <span className="text-base font-medium text-slate-500 uppercase tracking-widest">
                          Created {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest shrink-0 ${expired ? "bg-red-100 text-red-600" : "bg-[#00c9ea]/20 text-[#00c9ea]"}`}>
                        {expired ? "Closed" : "Live"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-6 mb-8">
                      {poll.options.map((opt) => {
                        const pct = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;
                        return (
                          <div key={opt.id} className="flex flex-col gap-2 relative">
                            <div className="flex justify-between items-end">
                              <span className="text-lg font-bold text-slate-900 z-10">{opt.title}</span>
                              <span className="text-lg font-black text-slate-900 z-10">
                                {pct}% <span className="text-sm text-slate-500 font-medium">({opt.votes || 0})</span>
                              </span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-900 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border-2 border-slate-100 gap-4">
                      <span className="text-lg font-medium text-slate-500">
                        Total Votes: <strong className="font-black text-2xl text-slate-900 ml-2">{poll.totalVotes || 0}</strong>
                      </span>
                      <Link to={`/poll/${poll.id}`}>
                        <Button 
                          size="lg"
                          className="h-12 px-6 rounded-full font-bold shadow-md bg-[#00c9ea] text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center">
              <p className="text-xl font-medium text-slate-500 mb-6">You haven't created any polls yet.</p>
              <Link to="/poll/create">
                <Button size="lg" className="h-16 px-10 rounded-full bg-black text-white hover:bg-slate-800 text-xl font-bold shadow-xl">
                  Create Your First Poll
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
