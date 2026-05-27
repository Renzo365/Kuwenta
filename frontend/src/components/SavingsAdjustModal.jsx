import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

import Input from './Input';
import Button from './Button';

const adjustFormSchema = (currentBalance) => z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be greater than 0'
    }),
  action: z.enum(['deposit', 'withdraw'])
}).refine((data) => {
  if (data.action === 'withdraw' && parseFloat(data.amount) > currentBalance) {
    return false;
  }
  return true;
}, {
  message: 'Cannot withdraw more than your current goal balance',
  path: ['amount']
});

function SavingsAdjustModal({ isOpen, onClose, onSubmit, goal = null, isLoading = false }) {
  const currentBalance = goal ? parseFloat(goal.current_amount) : 0;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(adjustFormSchema(currentBalance)),
    defaultValues: {
      amount: '',
      action: 'deposit'
    }
  });

  const selectedAction = watch('action');

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: '',
        action: 'deposit'
      });
    }
  }, [isOpen, reset]);

  if (!isOpen || !goal) return null;

  const handleFormSubmit = (data) => {
    onSubmit({
      amount: parseFloat(data.amount),
      action: data.action
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            Adjust Savings: {goal.name}
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
          
          {/* Current balance indicator */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between text-xs">
            <span className="text-slate-400">Current Savings Balance:</span>
            <strong className="text-slate-200">${currentBalance.toFixed(2)}</strong>
          </div>

          {/* Action Tabs selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setValue('action', 'deposit')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                selectedAction === 'deposit'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setValue('action', 'withdraw')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                selectedAction === 'withdraw'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Withdraw
            </button>
          </div>

          {/* Amount field */}
          <Input
            label="Transaction Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount}
            {...register('amount')}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Confirm
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SavingsAdjustModal;
