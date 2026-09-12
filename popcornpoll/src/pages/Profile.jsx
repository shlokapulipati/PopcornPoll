import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchUserCreatedPolls, deletePoll } from "../utils/firebase";
import PollCard from "../Components/Poll/PollCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isExpired } from "../utils/helpers";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [createdPolls, setCreatedPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

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
        
        const uniquePolls = [];
        const seenQuestions = new Set();
        for (const p of activeOnly) {
          const lowerQuestion = (p.question || "").toLowerCase().trim();
          if (!seenQuestions.has(lowerQuestion)) {
            seenQuestions.add(lowerQuestion);
            uniquePolls.push(p);
          }
        }
        
        setCreatedPolls(uniquePolls);
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
    <div className="min-h-screen bg-[#a6f3ff] py-20 px-6 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-20 left-[15%] rotate-[-15deg] w-40 h-16 bg-[#ffea2a] rounded-full hidden md:block opacity-70 border border-black/10 mix-blend-multiply" />
      <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-[#b268f7] rounded-full hidden xl:block opacity-50 border border-black/10 mix-blend-multiply" />
      <div className="absolute top-[50%] left-[5%] rotate-[30deg] w-24 h-12 bg-[#00c9ea] rounded-full hidden lg:block opacity-60 border border-black/10 mix-blend-multiply" />

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
        
        {/* Profile Info panel */}
        <div className="bg-white/95 backdrop-blur-xl p-10 md:p-14 mb-16 w-full max-w-3xl rounded-[3rem] shadow-2xl border border-white flex flex-col items-center text-center transform transition-transform hover:-translate-y-2">
          <div className="relative mb-6">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white shadow-xl bg-slate-50 object-cover"
            />
            <div className="absolute -bottom-4 -right-4 bg-[#ffea2a] w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-lg font-black text-slate-900">
              PRO
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{username}</h2>
          <p className="text-lg md:text-xl font-medium text-slate-500 mb-10 max-w-lg">
            {isAnonymous 
              ? "You are logged in anonymously. Connect your account to sync polls across devices."
              : `Linked Email: ${user.email}`
            }
          </p>

          {isAnonymous ? (
            <Button size="lg" onClick={handleSignIn} className="h-16 px-10 rounded-full bg-black text-white hover:bg-slate-800 text-xl font-bold shadow-xl flex items-center gap-3">
              Sign In / Connect Account
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={handleSignOut} className="h-16 px-10 rounded-full text-slate-900 border-2 border-slate-300 hover:bg-slate-100 hover:text-red-500 text-xl font-bold shadow-md flex items-center gap-3">
              Sign Out
            </Button>
          )}
        </div>

        {/* User Created Polls Section */}
        <div className="w-full">
          <h2 className="text-4xl font-black text-slate-900 mb-10 text-center tracking-tighter">My Created Polls <span className="text-[#00c9ea]">({createdPolls.length})</span></h2>

          {loadingPolls ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white/40 h-64 rounded-[2rem] p-8 flex flex-col gap-4 shadow-sm border-2 border-white">
                  <Skeleton className="h-10 w-3/4 bg-white/60" />
                  <Skeleton className="h-4 w-1/2 bg-white/60" />
                  <Skeleton className="h-20 w-full mt-4 bg-white/60" />
                </div>
              ))}
            </div>
          ) : createdPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {createdPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} onDelete={handleDeletePoll} />
              ))}
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl p-16 rounded-[3rem] shadow-xl border border-white text-center flex flex-col items-center">
               <div className="w-20 h-20 rounded-full bg-slate-100 mb-6 flex items-center justify-center">
                  <span className="text-3xl font-black text-slate-300">0</span>
               </div>
               <p className="text-2xl font-bold text-slate-700 mb-8">You haven't created any polls yet.</p>
               <Button size="lg" onClick={() => navigate("/poll/create")} className="h-14 px-8 rounded-full bg-[#00c9ea] text-slate-900 hover:bg-slate-900 hover:text-white text-lg font-black shadow-lg">
                 Create a Poll
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
