import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { Calendar, Download, TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';

import { getSummary, getCategoryBreakdown, getMonthlyTrends } from '../services/analyticsService';
import { getTransactions } from '../services/transactionService';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AnalyticsPage() {
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState(false);

  // Filters State (default to current month bounds)
  const getMonthBoundaries = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const { firstDay, lastDay } = getMonthBoundaries();

  const [dateRange, setDateRange] = useState({
    startDate: firstDay,
    endDate: lastDay
  });

  // Queries
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analyticsSummary', dateRange],
    queryFn: () => getSummary(dateRange)
  });

  const { data: categoryData = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['analyticsCategories', dateRange],
    queryFn: () => getCategoryBreakdown(dateRange)
  });

  const { data: monthlyTrends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ['analyticsTrends'],
    queryFn: getMonthlyTrends
  });

  // Formatting Helpers
  const formatCurrency = (amount) => {
    const symbols = { USD: '$', PHP: '₱', EUR: '€', GBP: '£' };
    return `${symbols[user?.currency] || '$'}${parseFloat(amount).toFixed(2)}`;
  };

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // CSV Exporter Action
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Query all transactions for user
      const response = await getTransactions({ limit: 1000 }); // fetch up to 1000
      const txns = response.transactions || [];

      if (txns.length === 0) {
        alert('No transactions logged yet to export.');
        setExporting(false);
        return;
      }

      // Format CSV string
      const headers = ['Date', 'Type', 'Category', 'Description', 'Method', 'Amount'];
      const rows = txns.map(t => [
        t.transaction_date.split('T')[0],
        t.type,
        t.category_name || 'Uncategorized',
        t.description || '',
        t.payment_method,
        t.amount
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `kuwenta_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV Export failed:', error);
      alert('Failed to export transaction data.');
    } finally {
      setExporting(false);
    }
  };

  // --- Chart.js Data Formulations ---

  // 1. Expense Breakdown Doughnut
  const hasCategoryData = categoryData.length > 0;
  const doughnutData = {
    labels: categoryData.map(c => c.category_name),
    datasets: [
      {
        data: categoryData.map(c => c.total_amount),
        backgroundColor: categoryData.map(c => c.category_color),
        borderColor: '#1e293b', // slate-800 boundary lines
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1', // slate-300
          font: { family: 'Inter', size: 12, weight: 'semibold' },
          boxWidth: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw;
            return ` ${context.label}: ${formatCurrency(val)}`;
          }
        }
      }
    }
  };

  // 2. Monthly Trend Cash Flow Area Chart
  const trendLabels = monthlyTrends.map(t => {
    const [year, month] = t.month.split('-');
    const date = new Date(year, parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  });

  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        fill: true,
        label: 'Income',
        data: monthlyTrends.map(t => t.income),
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#10b981'
      },
      {
        fill: true,
        label: 'Expense',
        data: monthlyTrends.map(t => t.expense),
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#ef4444'
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 12, weight: 'semibold' }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94a3b8', // slate-400
          font: { family: 'Inter', size: 11 },
          callback: (value) => formatCurrency(value).split('.')[0] // omit cents
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-400 mt-1">Visualize income-to-expense trends and category allocations.</p>
        </div>
        <Button
          onClick={handleExportCSV}
          isLoading={exporting}
          variant="secondary"
          className="inline-flex items-center gap-2 border border-slate-700 hover:bg-slate-800 text-slate-200"
        >
          <Download className="h-4.5 w-4.5" />
          Export Ledger (CSV)
        </Button>
      </div>

      {/* Date Range Selection Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Calendar className="h-4 w-4" />
          <span>Reporting Range</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Start:</span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">End:</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/80 rounded-xl text-slate-100 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics Summary Boxes */}
      {loadingSummary ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Balance</span>
            <h2 className="text-2xl font-black text-white mt-2">
              {formatCurrency(summary?.netBalance || 0)}
            </h2>
            <div className="absolute right-4 bottom-4 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>

          {/* Card: Income */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Income (Range)</span>
            <h2 className="text-2xl font-black text-emerald-400 mt-2">
              {formatCurrency(summary?.totalIncome || 0)}
            </h2>
            <div className="absolute right-4 bottom-4 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Card: Expense */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Expenses (Range)</span>
            <h2 className="text-2xl font-black text-rose-400 mt-2">
              {formatCurrency(summary?.totalExpense || 0)}
            </h2>
            <div className="absolute right-4 bottom-4 w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>

          {/* Card: Savings Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Savings Rate</span>
            <h2 className="text-2xl font-black text-indigo-400 mt-2">
              {summary?.savingsRate?.toFixed(1) || '0.0'}%
            </h2>
            <div className="absolute right-4 bottom-4 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cash Flow Area Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-white text-base">Cash Flow Trend (Last 6 Months)</h3>
          <div className="h-72 w-full relative">
            {loadingTrends ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-slate-500 text-sm">Loading trend metrics...</span>
              </div>
            ) : monthlyTrends.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                No historical cash flow data found.
              </div>
            ) : (
              <Line data={trendData} options={trendOptions} />
            )}
          </div>
        </div>

        {/* Expenses Allocation Pie/Doughnut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-white text-base">Expense Allocation</h3>
          <div className="h-72 w-full relative flex items-center justify-center">
            {loadingCategories ? (
              <span className="text-slate-500 text-sm">Loading category allocations...</span>
            ) : !hasCategoryData ? (
              <span className="text-slate-500 text-sm text-center px-4">
                No expense records logged within selected date range.
              </span>
            ) : (
              <div className="w-full h-full p-2 relative">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsPage;
