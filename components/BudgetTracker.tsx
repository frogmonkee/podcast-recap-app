'use client';

import { useEffect, useState } from 'react';
import { getBudgetInfo, WARNING_THRESHOLD, MONTHLY_LIMIT } from '@/lib/cost-calculator';
import { formatCost } from '@/lib/utils';

export default function BudgetTracker() {
  const [budgetInfo, setBudgetInfo] = useState({
    monthlySpend: 0,
    monthlyLimit: MONTHLY_LIMIT,
    lastResetDate: new Date().toISOString(),
    perRequestLimit: 5.0,
  });

  useEffect(() => {
    // Load budget info on mount and set up interval to refresh
    const loadBudget = () => {
      const info = getBudgetInfo();
      setBudgetInfo(info);
    };

    loadBudget();

    // Refresh every 5 seconds to catch updates
    const interval = setInterval(loadBudget, 5000);

    return () => clearInterval(interval);
  }, []);

  const percentageUsed = (budgetInfo.monthlySpend / budgetInfo.monthlyLimit) * 100;
  const isWarning = budgetInfo.monthlySpend >= WARNING_THRESHOLD;
  const isOverLimit = budgetInfo.monthlySpend >= budgetInfo.monthlyLimit;

  // Get color based on usage
  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-600';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900">Monthly Budget</h2>
        <span className={`text-2xl font-bold ${getTextColor()}`}>
          {formatCost(budgetInfo.monthlySpend)} / {formatCost(budgetInfo.monthlyLimit)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
        />
      </div>

      {/* Status Messages */}
      {isOverLimit && (
        <div className="p-3 bg-red-100 border border-red-400 rounded-md mb-2">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Monthly limit reached! No more summaries until next month.
          </p>
        </div>
      )}

      {isWarning && !isOverLimit && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded-md mb-2">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Approaching monthly limit ({formatCost(budgetInfo.monthlyLimit - budgetInfo.monthlySpend)} remaining)
          </p>
        </div>
      )}

      {/* Budget Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Per-request limit</p>
          <p className="font-semibold text-gray-900">{formatCost(budgetInfo.perRequestLimit)}</p>
        </div>
        <div>
          <p className="text-gray-600">Remaining</p>
          <p className="font-semibold text-gray-900">
            {formatCost(Math.max(0, budgetInfo.monthlyLimit - budgetInfo.monthlySpend))}
          </p>
        </div>
      </div>

      {/* Reset Date */}
      <p className="text-xs text-gray-500 mt-4">
        Budget resets on the 1st of each month
      </p>
    </div>
  );
}
