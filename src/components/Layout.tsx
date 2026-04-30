import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { Role } from '../types';
import { Menu, X, LayoutDashboard, Users, Wallet, Home } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Admin access check
  if (profile?.role !== Role.ADMIN) {
    return <Navigate to="/login" replace />;
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={toggleMobileMenu} />
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-bg-dark transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
          <button onClick={toggleMobileMenu} className="absolute top-4 right--12 p-2 bg-accent text-white rounded-full lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="flex-1 lg:ml-64 overflow-y-auto relative h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-accent rounded-lg" />
             <span className="font-black text-primary">M99</span>
           </div>
           <button onClick={toggleMobileMenu} className="p-2 text-gray-500">
             <Menu className="w-6 h-6" />
           </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Bar for Quick Access */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center shadow-2xl">
           {[
             { icon: LayoutDashboard, path: '/dashboard' },
             { icon: Users, path: '/nasabah' },
             { icon: Wallet, path: '/keuangan' },
             { icon: Home, path: '/kosanku' }
           ].map((item, i) => (
             <NavLink 
               key={i} 
               to={item.path} 
               className={({ isActive }) => `p-3 rounded-2xl transition-all ${isActive ? 'bg-accent text-white shadow-lg' : 'text-gray-400'}`}
             >
               <item.icon className="w-6 h-6" />
             </NavLink>
           ))}
        </div>
      </main>
    </div>
  );
};
