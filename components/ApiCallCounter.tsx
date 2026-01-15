'use client';

import { useEffect, useState } from 'react';

export default function ApiCallCounter() {
  const [callCount, setCallCount] = useState(0);
  const [lastReset, setLastReset] = useState<string>('');

  useEffect(() => {
    // Load from localStorage on mount
    const loadCounter = () => {
      const storedCount = localStorage.getItem('listenNotesCallCount');
      const storedReset = localStorage.getItem('listenNotesResetDate');

      if (storedCount) {
        setCallCount(parseInt(storedCount, 10));
      }

      if (storedReset) {
        setLastReset(storedReset);
        // Check if we need to reset (new month)
        const resetDate = new Date(storedReset);
        const now = new Date();
        if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
          // New month - reset counter
          setCallCount(0);
          localStorage.setItem('listenNotesCallCount', '0');
          const newResetDate = now.toISOString();
          localStorage.setItem('listenNotesResetDate', newResetDate);
          setLastReset(newResetDate);
        }
      } else {
        // First time - set reset date
        const now = new Date().toISOString();
        localStorage.setItem('listenNotesResetDate', now);
        setLastReset(now);
      }
    };

    // Load on mount
    loadCounter();

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'listenNotesCallCount') {
        loadCounter();
      }
    };

    // Poll localStorage every 500ms to detect changes in same tab
    const interval = setInterval(() => {
      const storedCount = localStorage.getItem('listenNotesCallCount');
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (count !== callCount) {
          setCallCount(count);
        }
      }
    }, 500);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [callCount]);

  const freeLimit = 100;
  const percentage = (callCount / freeLimit) * 100;
  const isNearLimit = callCount >= 80;
  const isAtLimit = callCount >= freeLimit;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border-2 border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Listen Notes API Calls</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          isAtLimit ? 'bg-red-100 text-red-700' :
          isNearLimit ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {callCount} / {freeLimit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-red-600' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="text-xs text-gray-600">
        Free tier: {freeLimit} calls/month • Resets {new Date(lastReset).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>

      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-700 mt-2 font-medium">
          ⚠️ Approaching limit ({freeLimit - callCount} calls remaining)
        </p>
      )}

      {isAtLimit && (
        <p className="text-xs text-red-700 mt-2 font-medium">
          🚫 Free tier limit reached. Episode durations will default to 1 hour.
        </p>
      )}
    </div>
  );
}
