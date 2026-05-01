import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Role } from '../types';
import { Menu, X, LayoutDashboard, Users, Wallet, Home, Building2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export const Layout: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-dark">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== Role.ADMIN) {
    return <Navigate to="/login" replace />;
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0A1628] overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden xl:block">
        <Sidebar onClose={() => {}} />
      </div>

      {/* Mobile/Tablet Drawer */}
      <div className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu} />
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-bg-dark transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={toggleMobileMenu} />
          <button onClick={toggleMobileMenu} className="absolute top-4 -right-12 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="flex-1 xl:ml-64 overflow-y-auto relative h-screen custom-scrollbar">
        {/* Mobile Header */}
        <div className="xl:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 p-4 px-6 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-primary leading-none">M99</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Digital System</span>
              </div>
           </div>
           <button onClick={toggleMobileMenu} className="p-2.5 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all">
             <Menu className="w-6 h-6" />
           </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-10 pb-24 xl:pb-10">
          <Outlet />
        </div>

        {/* Mobile Bottom Bar */}
        <div className="xl:hidden fixed bottom-6 left-6 right-6 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 px-6 py-4 flex justify-between items-center rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
           <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 pointer-events-none" />
           {[
             { icon: LayoutDashboard, path: '/dashboard' },
             { icon: Users, path: '/nasabah' },
             { icon: Wallet, path: '/keuangan' },
             { icon: Home, path: '/kosanku' }
           ].map((item, i) => (
             <NavLink 
               key={i} 
               to={item.path} 
               className={({ isActive }) => `relative z-10 p-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
             >
               <item.icon className="w-6 h-6" />
             </NavLink>
           ))}
        </div>
      </main>
    </div>
  );
};
