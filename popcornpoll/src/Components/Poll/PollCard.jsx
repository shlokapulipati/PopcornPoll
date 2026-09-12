import React from "react";
import { Link } from "react-router-dom";
import { formatDate, getTimeRemaining, isExpired } from "../../utils/helpers";
import { Button } from "@/components/ui/button";

const PollCard = ({ poll, onDelete }) => {
  const expired = isExpired(poll.expiresAt);
  const timeRemaining = getTimeRemaining(poll.expiresAt);

  return (
    <div className="bg-white/95 backdrop-blur-xl border-4 border-slate-100 rounded-[2rem] p-6 hover:border-[#00c9ea] hover:shadow-[0_8px_30px_rgb(0,201,234,0.12)] transition-all duration-300 relative group flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${expired ? "bg-red-100 text-red-600 border border-red-200" : "bg-black text-[#a6f3ff] border border-black"}`}>
          {expired ? "Closed" : "Active"}
        </span>
        <span className="text-sm font-bold text-slate-500 tracking-widest">{formatDate(poll.createdAt)}</span>
      </div>
      
      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-6 line-clamp-2 min-h-[4rem]">
        {poll.question}
      </h3>
      
      <div className="flex-1 flex gap-3 mb-6 overflow-hidden">
        {poll.options.slice(0, 4).map((opt) => (
          <div key={opt.id} className="flex flex-col items-center flex-1 max-w-[80px]">
            {opt.poster ? (
              <img src={opt.poster} alt={opt.title} className="w-16 h-24 object-cover rounded-xl shadow-md border-2 border-slate-100 mb-2" />
            ) : (
              <div className="w-16 h-24 bg-slate-100 rounded-xl shadow-md border-2 border-slate-200 flex flex-col items-center justify-center mb-2 overflow-hidden px-1">
                <span className="text-[10px] font-bold text-slate-300">No Image</span>
              </div>
            )}
            <span className="text-xs font-bold text-slate-700 truncate w-full text-center" title={opt.title}>{opt.title}</span>
            <span className="text-[10px] uppercase font-black text-slate-400">{opt.votes || 0} votes</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-auto border-t-2 border-slate-100 pt-4">
        <div className="flex justify-between items-center text-sm font-bold text-slate-500">
          <span><strong className="text-slate-900">{poll.totalVotes || 0}</strong> votes</span>
          <span className="truncate max-w-[120px]">By {poll.creatorName}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {onDelete && (
            <Button 
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(poll.id);
              }}
              className="h-12 px-4 font-bold rounded-full shrink-0"
              title="Delete Poll"
            >
              Delete
            </Button>
          )}
          <Link to={`/poll/${poll.id}`} className="flex-1">
             <Button className="w-full h-12 rounded-full font-black bg-[#a6f3ff] text-slate-900 hover:bg-black hover:text-white border-2 border-slate-900 hover:border-black transition-all">
               {expired ? "View Results" : "Vote Now"}
             </Button>
          </Link>
        </div>
      </div>
      
      {!expired && (
        <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#ffea2a] border-2 border-slate-900 px-3 py-1 rounded-full text-xs font-black shadow-md z-10">
          {timeRemaining}
        </div>
      )}
    </div>
  );
};

export default PollCard;
