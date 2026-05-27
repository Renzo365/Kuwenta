import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Calendar,
  DollarSign
} from 'lucide-react';

import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactionService';
import { getCategories } from '../services/categoryService';
import useAuthStore from '../store/authStore';
import TransactionModal from '../components/TransactionModal';

function TransactionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Filters State
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 10
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Queries
  const { data: transactionData, isLoading: loadingTxns, isPlaceholderData } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => getTransactions(filters),
    placeholderData: (prev) => prev
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      setEditingTransaction(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  // Event Handlers
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn) => {
    setEditingTransaction(txn);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalSubmit = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= (transactionData?.pagination?.totalPages || 1)) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (amount) => {
    const currencyMap = {
      USD: '$',
      PHP: '₱',
      EUR: '€',
      GBP: '£'
    };
    const symbol = currencyMap[user?.currency] || '$';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    // Converts UTC DB date string to user local date format representation
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC' // DB dates stored in UTC format
    });
  };

  const transactions = transactionData?.transactions || [];
  const pagination = transactionData?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 mt-1">Track and filter your financial ledger entries.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-indigo-500/20 w-fit"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Transaction
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Filter className="h-4 w-4" />
          <span>Filters & Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          {/* Type selector */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          {/* Category Selector */}
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="px-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loadingTxns ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-500 text-sm mt-4 font-medium">Fetching transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 px-4">
            <p className="text-sm text-center">No transactions match your filter criteria.</p>
            {(filters.type || filters.categoryId || filters.search || filters.startDate || filters.endDate) && (
              <button
                onClick={() => setFilters({ type: '', categoryId: '', startDate: '', endDate: '', search: '', page: 1, limit: 10 })}
                className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300 font-medium whitespace-nowrap">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {txn.category_name ? (
                        <span 
                          style={{ 
                            backgroundColor: `${txn.category_color}15`, 
                            borderColor: `${txn.category_color}30`,
                            color: txn.category_color 
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                        >
                          {txn.category_name}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs font-medium">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200 font-medium max-w-xs truncate">
                      {txn.description || <span className="text-slate-600 font-normal italic">No note</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 capitalize whitespace-nowrap">
                      {txn.payment_method?.replace('_', ' ')}
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                      txn.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(txn)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                          title="Edit transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/20">
            <span className="text-xs text-slate-400">
              Showing page <strong className="text-slate-200">{pagination.page}</strong> of <strong className="text-slate-200">{pagination.totalPages}</strong>
            </span>
            <div className="inline-flex gap-2">
              <button
                disabled={pagination.page <= 1 || isPlaceholderData}
                onClick={() => changePage(pagination.page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || isPlaceholderData}
                onClick={() => changePage(pagination.page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        transaction={editingTransaction}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

export default TransactionsPage;
