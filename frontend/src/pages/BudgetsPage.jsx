import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import useAuthStore from '../store/authStore';
import BudgetModal from '../components/BudgetModal';

function BudgetsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Queries
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      setEditingBudget(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalSubmit = (data) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (amount) => {
    const symbols = { USD: '$', PHP: '₱', EUR: '€', GBP: '£' };
    return `${symbols[user?.currency] || '$'}${parseFloat(amount).toFixed(2)}`;
  };

  const formatDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const e = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return `${s} - ${e}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Budgets</h1>
          <p className="text-slate-400 mt-1">Set monthly limits by category to control your spending.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-indigo-500/20 w-fit"
        >
          <Plus className="h-4.5 w-4.5" />
          Set Budget Limit
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-500 text-sm mt-4 font-medium">Loading budgets...</span>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          <p className="text-sm">No monthly budgets configured. Set limits on categories to keep track of your cash flow!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const limit = parseFloat(b.limit_amount);
            const spent = parseFloat(b.spent_amount);
            const percent = Math.min((spent / limit) * 100, 100);
            const rawPercent = (spent / limit) * 100;
            const remaining = limit - spent;
            const isOverBudget = spent > limit;
            const isNearLimit = spent >= limit * 0.8 && spent <= limit;

            // Define semantic colors for progress bar and icons
            let progressColor = 'bg-emerald-500';
            let progressBg = 'bg-emerald-500/10 border-emerald-500/20';
            let textColor = 'text-emerald-400';
            let AlertIcon = CheckCircle;

            if (isOverBudget) {
              progressColor = 'bg-red-500';
              progressBg = 'bg-red-500/10 border-red-500/20';
              textColor = 'text-red-400';
              AlertIcon = AlertOctagon;
            } else if (isNearLimit) {
              progressColor = 'bg-amber-500';
              progressBg = 'bg-amber-500/10 border-amber-500/20';
              textColor = 'text-amber-400';
              AlertIcon = AlertTriangle;
            }

            return (
              <div 
                key={b.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: `${b.category_color}15`, color: b.category_color }} 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    >
                      {b.category_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-100">{b.category_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatDateRange(b.start_date, b.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">
                      Spent: <strong className="text-slate-200">{formatCurrency(spent)}</strong> of {formatCurrency(limit)}
                    </span>
                    <span className={`font-bold ${textColor}`}>
                      {rawPercent.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    />
                  </div>
                </div>

                {/* Footer Remaining calculations */}
                <div className={`mt-5 p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${progressBg} ${textColor}`}>
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  <span>
                    {isOverBudget 
                      ? `${formatCurrency(Math.abs(remaining))} over budget limit!`
                      : `${formatCurrency(remaining)} remaining allowance.`
                    }
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        budget={editingBudget}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

export default BudgetsPage;
