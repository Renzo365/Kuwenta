import React from 'react';
import useAuthStore from '../store/authStore';

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Hello, {user?.username || 'User'}!
        </h1>
        <p className="text-slate-400 mt-1">Here is your financial summary for this month.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Balance</span>
          <h2 className="text-2xl font-black text-white mt-2">$0.00</h2>
          <span className="text-xs text-slate-500 mt-1 block">Base currency: {user?.currency || 'USD'}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Income</span>
          <h2 className="text-2xl font-black text-emerald-400 mt-2">+$0.00</h2>
          <span className="text-xs text-slate-500 mt-1 block">Logged this month</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Expenses</span>
          <h2 className="text-2xl font-black text-rose-400 mt-2">-$0.00</h2>
          <span className="text-xs text-slate-500 mt-1 block">Logged this month</span>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Transactions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-white">Recent Transactions</h3>
            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">View All</button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm">No transactions logged yet.</p>
          </div>
        </div>

        {/* Right column - Budgets & Goals */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white">Active Budgets</h3>
            <div className="flex flex-col items-center justify-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">No active budgets.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white">Savings Goals</h3>
            <div className="flex flex-col items-center justify-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">No savings goals tracked.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
