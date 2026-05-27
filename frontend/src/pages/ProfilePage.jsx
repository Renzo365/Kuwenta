import React from 'react';
import useAuthStore from '../store/authStore';

function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Profile</h1>
        <p className="text-slate-400 mt-1">Manage your credentials and view account settings.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-extrabold uppercase">
            {user?.username?.substring(0, 2)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.username}</h3>
            <p className="text-sm text-slate-400">Account Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</span>
            <span className="text-sm text-slate-200 block mt-1">{user?.username}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</span>
            <span className="text-sm text-slate-200 block mt-1">{user?.email}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Preferred Currency</span>
            <span className="text-sm text-slate-200 block mt-1">{user?.currency || 'USD'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
