/**
 * Format a Firebase Timestamp or Date into a readable string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Checks if a date has expired
 */
export const isExpired = (timestamp) => {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date < new Date();
};

/**
 * Get time remaining description
 */
export const getTimeRemaining = (timestamp) => {
  if (!timestamp) return "Never expires";
  const end = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = end - new Date();

  if (diff <= 0) return "Expired";

  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  if (hours > 0) return `${hours}h ${mins % 60}m remaining`;
  if (mins > 0) return `${mins}m remaining`;
  return "Expiring soon";
};

/**
 * Copies text to clipboard and resolves with success boolean
 */
export const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  }
  
  // Fallback
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand("copy");
    document.body.removeChild(el);
    return success;
  } catch (err) {
    console.error("Fallback copy failed", err);
    return false;
  }
};

/**
 * Exports poll results as JSON download
 */
export const exportToJSON = (poll) => {
  if (!poll) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(poll, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `poll_${poll.id}_results.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
};

/**
 * Exports poll results as CSV download
 */
export const exportToCSV = (poll) => {
  if (!poll) return;
  
  const headers = ["Option ID", "Movie Title", "Release Date", "Votes", "Percentage"];
  const rows = poll.options.map(opt => {
    const percentage = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;
    return [
      opt.id,
      `"${opt.title.replace(/"/g, '""')}"`,
      opt.releaseDate || "N/A",
      opt.votes,
      `${percentage}%`
    ];
  });

  const csvContent = [
    `"Question", "${poll.question.replace(/"/g, '""')}"`,
    `"Total Votes", ${poll.totalVotes}`,
    `"Created At", "${formatDate(poll.createdAt)}"`,
    "",
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `poll_${poll.id}_results.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
};
