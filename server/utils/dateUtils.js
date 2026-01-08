function parseDateFilter(dateFilter, query = {}) {
  const now = new Date();
  let startDate, endDate;

  switch (dateFilter) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = null;
      break;
    case 'last30days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = null;
      break;
    case 'custom':
      if (query.startDate && query.endDate) {
        startDate = new Date(query.startDate);
        endDate = new Date(query.endDate);
        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Fallback to today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      // Default to today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

module.exports = { parseDateFilter };