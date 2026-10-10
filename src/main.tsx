import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runRecurrenceEngineTests } from './lib/recurrence/__tests__/recurrenceEngine.test.ts';

// Run and verify recurrence engine tests
const testResults = runRecurrenceEngineTests();
if (testResults.failed === 0) {
  console.log(`[RecurrenceEngine] Passed all ${testResults.passed} automated tests successfully.`);
} else {
  console.error(`[RecurrenceEngine] Failed ${testResults.failed} tests:`, testResults.errors);
}

// Clean up any legacy demo data from prior sessions
try {
  const legacyUser = localStorage.getItem('cleartasks_auth_user');
  if (legacyUser && (legacyUser.includes('demo-user') || legacyUser.includes('alex.rivers'))) {
    localStorage.removeItem('cleartasks_auth_user');
    localStorage.removeItem('cleartasks_tasks_v1');
    localStorage.removeItem('cleartasks_subtasks_v1');
    localStorage.removeItem('cleartasks_recurrences_v1');
    localStorage.removeItem('cleartasks_occurrences_v1');
  }
} catch {
  // ignore
}

// Initial theme check
const savedTheme = localStorage.getItem('cleartasks_theme');
if (
  savedTheme === 'dark' ||
  (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')!).render(<App />);
