import React from 'react';
import useAuthStore from '../store/authStore';

function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Configure your personal preferences and regionalizations.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">General Preferences</h3>

        <div className="space-y-6">
          {/* Currency Selection */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Base Currency</h4>
              <p className="text-xs text-slate-400">All transactions will compile under this currency symbol.</p>
            </div>
            <select 
              defaultValue={user?.currency || 'USD'}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="PHP">PHP (₱)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Theme Toggling */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Appearance Mode</h4>
              <p className="text-xs text-slate-400">Toggle between dark and light color modes.</p>
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 rounded-xl transition-all">
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
