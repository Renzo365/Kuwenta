import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PiggyBank, 
  PieChart, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  Wallet
} from 'lucide-react';

function DashboardLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Savings Goals', path: '/savings', icon: PiggyBank },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="font-extrabold text-sm text-white">K</span>
          </div>
          <span className="font-black text-lg tracking-tight">Kuwenta</span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold uppercase">
            {user?.username?.substring(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-slate-100 truncate">{user?.username}</h4>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}
              `}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Header - Mobile only */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="font-extrabold text-xs text-white">K</span>
          </div>
          <span className="font-black tracking-tight">Kuwenta</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 p-1"
          aria-label="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>

      {/* Mobile Tab Nav Bar - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around py-2.5 px-4 z-25">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-200
              ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name.split(' ')[0]}</span>
          </NavLink>
        ))}
        {/* Additional Mobile link to Profile/Settings combo */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `
            flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-200
            ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}
          `}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default DashboardLayout;
