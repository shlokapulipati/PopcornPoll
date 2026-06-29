/**
 * Calculates aggregate stats from a list of polls
 */
export const calculateAnalytics = (polls) => {
  if (!polls || polls.length === 0) {
    return {
      totalPolls: 0,
      totalVotes: 0,
      mostVotedPoll: null,
      genreDistribution: {},
      activityHistory: []
    };
  }

  let totalVotes = 0;
  let mostVotedPoll = polls[0];
  const genreCount = {};
  const dateVoteCount = {};

  polls.forEach(poll => {
    // 1. Sum up votes
    const votes = poll.totalVotes || 0;
    totalVotes += votes;

    // 2. Track most voted poll
    if (votes > (mostVotedPoll.totalVotes || 0)) {
      mostVotedPoll = poll;
    }

    // 3. Extract genres from options
    poll.options.forEach(opt => {
      const genres = opt.genres || [];
      genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + opt.votes;
      });
    });

    // 4. Group activity by date (createdAt)
    if (poll.createdAt) {
      const date = poll.createdAt.toDate ? poll.createdAt.toDate() : new Date(poll.createdAt);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateVoteCount[dateStr] = (dateVoteCount[dateStr] || 0) + votes;
    }
  });

  // Convert dateVoteCount to a sorted array for charts
  const activityHistory = Object.keys(dateVoteCount).map(date => ({
    date,
    votes: dateVoteCount[date]
  })).slice(-7); // Last 7 days with activity

  return {
    totalPolls: polls.length,
    totalVotes,
    mostVotedPoll,
    genreDistribution: genreCount,
    activityHistory
  };
};
