import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { NasabahPage } from './pages/NasabahPage';
import { NasabahDetail } from './pages/NasabahDetail';
import { EditNasabah } from './pages/EditNasabah';
import { AddNasabah } from './pages/AddNasabah';
import { KeuanganPage } from './pages/KeuanganPage';
import { ImportPage } from './pages/ImportPage';
import { TagihanPage } from './pages/TagihanPage';
import { SystemSettings } from './pages/SystemSettings';
import { NotificationsPage } from './pages/NotificationsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nasabah" element={<NasabahPage />} />
            <Route path="/nasabah/tambah" element={<AddNasabah />} />
            <Route path="/nasabah/:id" element={<NasabahDetail />} />
            <Route path="/nasabah/:id/edit" element={<EditNasabah />} />
            <Route path="/keuangan" element={<KeuanganPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/tagihan" element={<TagihanPage />} />
          <Route path="/portal/:id" element={<TagihanPage />} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
