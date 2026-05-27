import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar, Target, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, adjustSavingsBalance, deleteSavingsGoal } from '../services/savingsService';
import useAuthStore from '../store/authStore';
import SavingsGoalModal from '../components/SavingsGoalModal';
import SavingsAdjustModal from '../components/SavingsAdjustModal';

function SavingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Queries
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: getSavingsGoals
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setIsGoalModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setIsGoalModalOpen(false);
      setSelectedGoal(null);
    }
  });

  const adjustMutation = useMutation({
    mutationFn: adjustSavingsBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setIsAdjustModalOpen(false);
      setSelectedGoal(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    }
  });

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditModal = (goal, e) => {
    e.stopPropagation();
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleOpenAdjustModal = (goal) => {
    setSelectedGoal(goal);
    setIsAdjustModalOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGoalSubmit = (data) => {
    if (selectedGoal) {
      updateMutation.mutate({ id: selectedGoal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAdjustSubmit = (data) => {
    adjustMutation.mutate({ id: selectedGoal.id, ...data });
  };

  const formatCurrency = (amount) => {
    const symbols = { USD: '$', PHP: '₱', EUR: '€', GBP: '£' };
    return `${symbols[user?.currency] || '$'}${parseFloat(amount).toFixed(2)}`;
  };

  const formatGoalDate = (dateStr) => {
    if (!dateStr) return 'No Deadline';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Savings Goals</h1>
          <p className="text-slate-400 mt-1">Track funds for gadgets, emergency reserves, and milestones.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-indigo-500/20 w-fit"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Savings Goal
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-500 text-sm mt-4 font-medium">Loading goals...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          <p className="text-sm">No savings goals created. Set targets and start saving today!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const target = parseFloat(g.target_amount);
            const current = parseFloat(g.current_amount);
            const percent = Math.min((current / target) * 100, 100);
            const isCompleted = g.status === 'completed' || current >= target;

            return (
              <div 
                key={g.id} 
                onClick={() => handleOpenAdjustModal(g)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-lg leading-tight">{g.name}</h3>
                    {isCompleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-1.5 uppercase">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-1.5 uppercase">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(g, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(g.id, e)}
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
                      Saved: <strong className="text-slate-200">{formatCurrency(current)}</strong> of {formatCurrency(target)}
                    </span>
                    <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    />
                  </div>
                </div>

                {/* Bottom Details */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    {formatGoalDate(g.target_date)}
                  </span>
                  <span className="text-indigo-400 hover:underline">
                    Quick Adjust
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation/Edit Modal */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleGoalSubmit}
        goal={selectedGoal}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Goal Deposit/Withdraw Adjustment Modal */}
      <SavingsAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleAdjustSubmit}
        goal={selectedGoal}
        isLoading={adjustMutation.isPending}
      />
    </div>
  );
}

export default SavingsPage;
