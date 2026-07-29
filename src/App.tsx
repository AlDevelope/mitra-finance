import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import Dashboard from './pages/Dashboard';
import NasabahPage from './pages/NasabahPage';
import NasabahDetail from './pages/NasabahDetail';
import EditNasabah from './pages/EditNasabah';
import AddNasabah from './pages/AddNasabah';
import KeuanganPage from './pages/KeuanganPage';
import ImportPage from './pages/ImportPage';
import KosankuPage from './pages/KosankuPage';
import AngsuranLogPage from './pages/AngsuranLogPage';
import SimulasiPage from './pages/SimulasiPage';
import SystemSettings from './pages/SystemSettings';
import NotificationsPage from './pages/NotificationsPage';
import RemindersPage from './pages/RemindersPage';
import LaporanPage from './pages/LaporanPage';
import DendaPage from './pages/DendaPage';
import PembayaranSebagianPage from './pages/PembayaranSebagianPage';
import DokumenPage from './pages/DokumenPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nasabah" element={<NasabahPage />} />
            <Route path="/nasabah/tambah" element={<AddNasabah />} />
            <Route path="/nasabah/:id" element={<NasabahDetail />} />
            <Route path="/nasabah/:id/edit" element={<EditNasabah />} />
            <Route path="/tagihan" element={<RemindersPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/denda" element={<DendaPage />} />
            <Route path="/pembayaran-sebagian" element={<PembayaranSebagianPage />} />
            <Route path="/dokumen" element={<DokumenPage />} />
            <Route path="/keuangan" element={<KeuanganPage />} />
            
            {/* Rute Kosanku D1 dan D2 */}
            <Route path="/kosanku" element={<Navigate to="/kosanku/d1" replace />} />
            <Route path="/kosanku/d1" element={<KosankuPage />} />
            <Route path="/kosanku/d2" element={<KosankuPage />} />
            
            <Route path="/angsuran" element={<AngsuranLogPage />} />
            <Route path="/simulasi" element={<SimulasiPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
