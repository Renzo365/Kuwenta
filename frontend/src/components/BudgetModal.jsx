import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { getCategories } from '../services/categoryService';
import Input from './Input';
import Button from './Button';

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  limitAmount: z.string()
    .min(1, 'Limit is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Limit must be a positive number greater than 0'
    }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required')
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate']
});

function BudgetModal({ isOpen, onClose, onSubmit, budget = null, isLoading = false }) {
  // Helper to get first and last day of current month in local YYYY-MM-DD
  const getMonthDateBoundaries = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0]; // simple offset
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const { firstDay, lastDay } = getMonthDateBoundaries();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: '',
      limitAmount: '',
      startDate: firstDay,
      endDate: lastDay
    }
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: isOpen
  });

  // Filter only expense categories for budgets
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');

  useEffect(() => {
    if (isOpen) {
      if (budget) {
        reset({
          categoryId: String(budget.category_id),
          limitAmount: String(budget.limit_amount),
          startDate: budget.start_date.split('T')[0],
          endDate: budget.end_date.split('T')[0]
        });
      } else {
        reset({
          categoryId: expenseCategories[0] ? String(expenseCategories[0].id) : '',
          limitAmount: '',
          startDate: firstDay,
          endDate: lastDay
        });
      }
    }
  }, [isOpen, budget, reset]);

  // Set default category when categories load
  useEffect(() => {
    if (expenseCategories.length > 0 && !budget) {
      setValue('categoryId', String(expenseCategories[0].id));
    }
  }, [categories, setValue, budget]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      categoryId: parseInt(data.categoryId, 10),
      limitAmount: parseFloat(data.limitAmount)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {budget ? 'Edit Budget Limit' : 'Set Category Budget'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          
          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">Target Category</label>
            <select
              disabled={loadingCategories || !!budget} // Category is immutable on edit
              className="w-full px-4 py-2.5 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              {...register('categoryId')}
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span className="text-xs text-red-500 font-medium">{errors.categoryId.message}</span>
            )}
          </div>

          {/* Amount limit */}
          <Input
            label="Monthly Limit Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.limitAmount}
            {...register('limitAmount')}
          />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              error={errors.startDate}
              {...register('startDate')}
            />
            <Input
              label="End Date"
              type="date"
              error={errors.endDate}
              {...register('endDate')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Limit
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default BudgetModal;
