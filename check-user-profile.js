// Check localStorage for user profile
const profile = localStorage.getItem('userProfile');
console.log('UserProfile in localStorage:', profile);
if (profile) {
  const parsed = JSON.parse(profile);
  console.log('Reset Date:', parsed.budgetResetDate);
}
