// Legacy functions for backwards compatibility

// Backwards compatibility - return null since teams are replaced by group model
export async function getTeamForUser() {
  return null
}

// Activity logs - simplified since we removed the table
export async function getActivityLogs() {
  return []
}
