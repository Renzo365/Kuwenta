import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

import Input from './Input';
import Button from './Button';

const goalFormSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name cannot exceed 100 characters'),
  targetAmount: z.string()
    .min(1, 'Target amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Target must be a positive number greater than 0'
    }),
  currentAmount: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: 'Starting balance must be 0 or greater'
    }),
  targetDate: z.string().optional().or(z.literal(''))
});

function SavingsGoalModal({ isOpen, onClose, onSubmit, goal = null, isLoading = false }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        reset({
          name: goal.name,
          targetAmount: String(goal.target_amount),
          currentAmount: String(goal.current_amount),
          targetDate: goal.target_date ? goal.target_date.split('T')[0] : ''
        });
      } else {
        reset({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: ''
        });
      }
    }
  }, [isOpen, goal, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
      targetDate: data.targetDate || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {goal ? 'Edit Savings Goal' : 'Create Savings Goal'}
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
          
          {/* Goal Name */}
          <Input
            label="Goal Name"
            placeholder="e.g. Macbook Pro, Emergency Fund"
            error={errors.name}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Amount */}
            <Input
              label="Target Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.targetAmount}
              {...register('targetAmount')}
            />

            {/* Starting Balance - disabled on edit */}
            <Input
              label="Starting Balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={!!goal} // Force user to use deposit adjust panel on edit
              error={errors.currentAmount}
              {...register('currentAmount')}
            />
          </div>

          {/* Target Date */}
          <Input
            label="Target Date (Optional)"
            type="date"
            error={errors.targetDate}
            {...register('targetDate')}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Goal
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SavingsGoalModal;
