import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { safeJSONParse } from "../../utils/safeStorage";
import logo from "../../assets/popcornpoll.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, setAuthModalOpen } = useAuth();
  const [draftCount, setDraftCount] = useState(0);

  const updateDraftCount = () => {
    const draft = safeJSONParse("draft_poll_movies", [], sessionStorage);
    setDraftCount(draft.length);
  };

  useEffect(() => {
    updateDraftCount();
    window.addEventListener("draftPollUpdated", updateDraftCount);
    return () => {
      window.removeEventListener("draftPollUpdated", updateDraftCount);
    };
  }, []);

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };

  const username = user && !user.isAnonymous ? user.displayName : "Guest";
  const avatarUrl = user && user.photoURL 
    ? user.photoURL 
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "guest"}`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/95 backdrop-blur-md text-slate-900 transition-colors duration-300 dark:bg-slate-950/95 dark:text-white dark:border-white/10 shadow-sm">
      <div className="container flex h-24 items-center justify-between mx-auto px-6 md:px-12">
        {/* Left Side (Logo) */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="inline-flex items-center gap-4">
            <img src={logo} alt="PopcornPoll logo" className="h-12 w-12 hover:scale-110 transition-transform" />
            <h1 className="text-3xl font-black font-heading tracking-tighter hidden sm:block">Popcorn<span className="text-[#00c9ea]">Poll</span></h1>
          </Link>
        </div>
        
        {/* Center (Links) */}
        <ul className="hidden lg:flex items-center justify-center gap-10 text-lg font-black tracking-tight flex-none">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "text-[#00c9ea]" : "hover:text-[#00c9ea] transition-colors")}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? "text-[#b268f7]" : "hover:text-[#b268f7] transition-colors")}>
              Browse
            </NavLink>
          </li>
          <li>
            <NavLink to="/poll/create" className={({ isActive }) => (isActive ? "flex items-center gap-2 text-orange-500" : "flex items-center gap-2 hover:text-orange-500 transition-colors")}>
              Create Poll {draftCount > 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs text-white pb-[2px] shadow-sm">{draftCount}</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "text-green-500" : "hover:text-green-500 transition-colors")}>
              Dashboard
            </NavLink>
          </li>
        </ul>

        {/* Right Side (Auth/Avatar) */}
        <div className="flex-1 flex justify-end items-center gap-6">
          <div className="flex items-center">
            {user ? (
              <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity bg-slate-50 hover:bg-slate-100 pr-4 rounded-full border-2 border-slate-100" title="View Profile">
                <Avatar className="h-12 w-12 border-2 border-black/10 dark:border-white/10 shrink-0">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback className="font-bold text-sm bg-white">{username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden xl:block text-lg font-black truncate max-w-[120px]">{username}</span>
              </Link>
            ) : (
              <Button onClick={handleSignIn} size="lg" className="h-12 rounded-full px-8 text-lg font-black bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-xl hover:-translate-y-1 transition-all">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;