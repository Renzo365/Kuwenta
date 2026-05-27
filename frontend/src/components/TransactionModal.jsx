import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { getCategories } from '../services/categoryService';
import Input from './Input';
import Button from './Button';

// Form Validation Schema
const transactionFormSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number greater than 0'
    }),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category is required'),
  transactionDate: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  description: z.string().max(255, 'Description cannot exceed 255 characters').optional()
});

function TransactionModal({ isOpen, onClose, onSubmit, transaction = null, isLoading = false }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: '',
      type: 'expense',
      categoryId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      description: ''
    }
  });

  // Watch type changes to filter categories
  const selectedType = watch('type');

  // Fetch categories using React Query
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: isOpen
  });

  // Filter categories by selected transaction type (income vs expense)
  const filteredCategories = categories.filter((cat) => cat.type === selectedType);

  // Prepopulate form when editing
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        reset({
          amount: String(transaction.amount),
          type: transaction.type,
          categoryId: String(transaction.category_id || ''),
          transactionDate: transaction.transaction_date.split('T')[0],
          paymentMethod: transaction.payment_method,
          description: transaction.description || ''
        });
      } else {
        reset({
          amount: '',
          type: 'expense',
          categoryId: '',
          transactionDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          description: ''
        });
      }
    }
  }, [isOpen, transaction, reset]);

  // Adjust category selection if the transaction type changes
  useEffect(() => {
    if (filteredCategories.length > 0 && !transaction) {
      // Don't auto-set if editing because we want to preserve original category if type matches
      setValue('categoryId', String(filteredCategories[0].id));
    }
  }, [selectedType, categories, setValue, transaction]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    // Format values (convert amount string to number, and categoryId to integer)
    const formattedData = {
      ...data,
      amount: parseFloat(data.amount),
      categoryId: parseInt(data.categoryId, 10)
    };
    onSubmit(formattedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden transform scale-100 transition-transform duration-300"
        role="dialog" 
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          
          {/* Transaction Type Selector (Tabs) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setValue('type', 'expense')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'income')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount Field */}
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount}
              {...register('amount')}
            />

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">Category</label>
              <select
                disabled={loadingCategories}
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                {...register('categoryId')}
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                {filteredCategories.length === 0 && !loadingCategories && (
                  <option value="" disabled>No categories available</option>
                )}
              </select>
              {errors.categoryId && (
                <span className="text-xs text-red-500 font-medium">{errors.categoryId.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Field */}
            <Input
              label="Date"
              type="date"
              error={errors.transactionDate}
              {...register('transactionDate')}
            />

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">Payment Method</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                {...register('paymentMethod')}
              >
                <option value="cash">Cash</option>
                <option value="debit_card">Debit Card</option>
                <option value="credit_card">Credit Card</option>
                <option value="digital_wallet">Digital Wallet (GCash/Maya)</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              {errors.paymentMethod && (
                <span className="text-xs text-red-500 font-medium">{errors.paymentMethod.message}</span>
              )}
            </div>
          </div>

          {/* Description Field */}
          <Input
            label="Description (Optional)"
            placeholder="e.g. Weekly grocery run"
            error={errors.description}
            {...register('description')}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isLoading}
            >
              Save Transaction
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TransactionModal;
