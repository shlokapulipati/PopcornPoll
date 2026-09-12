import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { voteOnPoll, checkIfUserVoted, updateUserVotedPoll, getPollDetails, deletePoll } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, getTimeRemaining, isExpired, exportToCSV, exportToJSON } from "../utils/helpers";
import ShareModal from "../Components/Poll/ShareModal";
import { Button } from "@/components/ui/button";

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

  const getVoterId = () => {
    if (user && !user.isAnonymous) return user.uid;
    let anonId = localStorage.getItem("anon_voter_id");
    if (!anonId) {
      anonId = `anonymous-voter-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("anon_voter_id", anonId);
    }
    return anonId;
  };

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
      
      if (result && result.newOptions) {
        setPoll(prev => ({
          ...prev,
          options: result.newOptions,
          totalVotes: result.newTotalVotes
        }));
      }
      
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
      <div className="flex justify-center items-center min-h-[60vh] bg-[#a6f3ff]">
        <h2 className="text-4xl font-black text-slate-800 animate-pulse tracking-tighter">Loading Poll...</h2>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-[#a6f3ff] flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-xl p-12 max-w-2xl w-full rounded-[2rem] shadow-2xl border border-white text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Poll Not Found</h2>
          <p className="text-xl text-slate-500 font-medium max-w-lg mb-4">
            The poll link you followed may be incorrect or the poll was deleted.
          </p>
          <Link to="/">
            <Button size="lg" className="h-16 px-10 rounded-full bg-black text-white hover:bg-slate-800 text-xl font-bold shadow-xl">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const expired = isExpired(poll.expiresAt);
  const showResults = userVotedOption !== null || expired;
  const timeRemaining = getTimeRemaining(poll.expiresAt);

  return (
    <div className="min-h-screen bg-[#a6f3ff] py-16 px-6 relative overflow-hidden flex flex-col items-center">
      {/* Decorative background shapes */}
      <div className="absolute top-20 left-[5%] rotate-[-10deg] w-40 h-16 bg-[#ffea2a] rounded-full hidden md:block opacity-70 border border-black/10" />
      <div className="absolute top-[30%] right-[10%] w-32 h-32 bg-[#00c9ea] rounded-full hidden xl:block opacity-50 border border-black/10 mix-blend-multiply" />
      <div className="absolute bottom-[20%] left-[10%] rotate-[15deg] w-48 h-12 bg-[#b268f7] rounded-full hidden md:block opacity-70 border border-black/10" />

      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 mb-8 max-w-4xl w-full rounded-[2rem] shadow-2xl border border-white relative z-10">
        
        {/* Expiry / Status row */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10 pb-6 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest ${expired ? "bg-red-100 text-red-600" : "bg-[#a6f3ff] text-slate-800 border-2 border-slate-900"}`}>
              {expired ? "Closed" : "Live"}
            </span>
            <span className="text-slate-500 font-bold text-sm tracking-widest uppercase items-center hidden sm:flex">
              Created: {formatDate(poll.createdAt)}
            </span>
          </div>
          <div>
            {!expired && <span className="text-xl font-black text-[#00c9ea]">Time Remaining: {timeRemaining}</span>}
            {expired && <span className="text-xl font-black text-red-500">Ended</span>}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter text-center mb-10 leading-tight">
          {poll.question}
        </h1>

        <div className="flex flex-col gap-5">
          {poll.options.map((opt) => {
            const hasVotedThis = userVotedOption === opt.id;
            const percentage = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;

            return (
              <div 
                key={opt.id}
                onClick={() => !showResults && handleVote(opt.id)}
                className={`relative overflow-hidden flex items-center p-4 rounded-2xl transition-all duration-300 ${
                  showResults 
                    ? "bg-slate-50 border-2 border-slate-100" 
                    : "bg-white border-2 border-slate-200 hover:border-[#00c9ea] hover:shadow-[0_8px_30px_rgb(0,201,234,0.12)] hover:-translate-y-1 cursor-pointer group"
                } ${hasVotedThis ? "!border-4 !border-[#00c9ea] !bg-[#a6f3ff]/10" : ""}`}
                style={{ pointerEvents: showResults ? "none" : "auto" }}
              >
                {/* Results Bar */}
                {showResults && (
                  <div 
                    className={`absolute inset-0 z-0 opacity-20 transition-all duration-1000 ease-out ${hasVotedThis ? "bg-[#00c9ea]" : "bg-slate-300"}`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-6 w-full">
                  {/* Poster */}
                  {opt.poster ? (
                    <div className="w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-md">
                      <img src={opt.poster} alt={opt.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-28 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center shadow-md border-2 border-slate-200">
                      <span className="text-[10px] font-bold text-slate-300">No Image</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-[#00c9ea] transition-colors leading-tight">
                      {opt.title} {hasVotedThis && "(Voted)"}
                    </h3>
                    <p className="text-base text-slate-500 font-medium">Released: {opt.releaseDate || "N/A"}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                    {showResults ? (
                      <>
                        <div className="text-3xl md:text-4xl font-black text-slate-900">{percentage}%</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{opt.votes || 0} votes</div>
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-4 border-slate-200 group-hover:border-[#00c9ea] transition-colors flex items-center justify-center bg-transparent">
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-12 pt-8 border-t-2 border-slate-100 gap-6">
          <div className="text-xl font-medium text-slate-500">
            Total Votes Cast: <strong className="font-black text-slate-900 text-2xl ml-2">{poll.totalVotes || 0}</strong>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline"
              size="lg"
              className="h-12 px-6 rounded-full font-bold border-2 text-slate-700 hover:bg-slate-100 hover:text-black"
              onClick={() => setShareModalOpen(true)}
            >
              🔗 Share
            </Button>
            
            {showResults && (
              <>
                <Button variant="outline" size="lg" className="h-12 rounded-full font-bold border-2 hidden md:flex" onClick={() => exportToJSON(poll)}>
                  📥 JSON
                </Button>
                <Button variant="outline" size="lg" className="h-12 rounded-full font-bold border-2 hidden md:flex" onClick={() => exportToCSV(poll)}>
                  📥 CSV
                </Button>
              </>
            )}

            {user && poll && user.uid === poll.creatorId && (
              <Button 
                variant="destructive"
                size="lg"
                className="h-12 px-6 rounded-full font-bold"
                onClick={handleDeletePoll}
              >
                🗑️ Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center w-full z-10 pb-20">
        <Link to="/">
          <Button variant="outline" size="lg" className="h-14 px-8 rounded-full font-black text-lg border-2 border-slate-800 text-slate-800 bg-[#a6f3ff] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_rgb(15,23,42)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            🏠 Back to Home
          </Button>
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
