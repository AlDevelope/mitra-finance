import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Upload, 
  Settings, 
  LogOut,
  TrendingUp,
  Landmark,
  Hammer
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Nasabah', path: '/nasabah' },
  { icon: Wallet, label: 'Keuangan', path: '/keuangan' },
  { icon: Upload, label: 'Import Excel', path: '/import' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { profile } = useAuth();
  
  const handleLogout = () => {
    signOut(auth);
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 h-screen glass-dark text-white flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-xl">
            M99
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Mitra Finance</h1>
            <p className="text-xs text-white/50">Digital System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10",
                isActive ? "bg-accent text-white shadow-lg" : "text-white/70"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-1">Signed in as</p>
          <p className="font-medium truncate">{profile?.full_name || 'Admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
