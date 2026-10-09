export const formatTime = (dateString) => {
  if (!dateString) return 'Unknown';
  if (dateString.toLowerCase() === 'now') return 'Now';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    
    if (diffSec < 5) return 'Now';
    if (diffSec < 60) return `${diffSec} sec ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};
