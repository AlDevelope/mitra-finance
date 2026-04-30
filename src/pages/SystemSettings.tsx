import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Trash2, AlertTriangle, RefreshCcw, ShieldCheck, Image as ImageIcon, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminConfirmModal } from '../components/AdminConfirmModal';
import { useSettings } from '../hooks/useSettings';

export const SystemSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [showResetNasabahModal, setShowResetNasabahModal] = useState(false);
  const [showResetKeuanganModal, setShowResetKeuanganModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (settings?.logo_url) {
      setLogoUrl(settings.logo_url);
    }
  }, [settings]);

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setLoading(true);
    const success = await updateSettings({
      ...settings,
      logo_url: logoUrl
    });
    
    if (success) {
      alert('Logo berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui logo.');
    }
    setLoading(false);
  };

  const handleResetNasabah = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'nasabah'));
      const deletePromises = snap.docs.map(async (d) => {
        // Delete history subcollection
        const histSnap = await getDocs(collection(db, 'nasabah', d.id, 'history'));
        const histPromises = histSnap.docs.map(hd => deleteDoc(hd.ref));
        await Promise.all(histPromises);
        // Delete main doc
        return deleteDoc(d.ref);
      });
      
      await Promise.all(deletePromises);
      alert('Semua data nasabah berhasil dihapus.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data nasabah.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetKeuangan = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'keuangan', 'summary'), {
        uang_cash: 0,
        uang_bank_neo: 0,
        uang_dipinjamkan: 0,
        uang_nasabah: 0,
        uang_stokbit: 0,
        uang_renov: 0,
        uang_tanah_lama: 0,
        uang_tanah_baru: 0,
        total_keuntungan: 0
      });
      alert('Data keuangan berhasil direset.');
    } catch (err) {
      console.error(err);
      alert('Gagal meriset data keuangan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-gray-500 mt-1">Kelola data dan fungsionalitas aplikasi Mitra Finance 99</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass p-8 rounded-[40px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-accent/10 text-accent rounded-2xl">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Identitas Visual</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Branding Perusahaan</p>
            </div>
          </div>

          <form onSubmit={handleUpdateBranding} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Logo URL</label>
              <input 
                type="url" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
              />
              <p className="text-[10px] text-gray-400 italic px-1">Masukkan URL gambar logo (sebaiknya format PNG/SVG transparan).</p>
            </div>

            {logoUrl && (
              <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Logo</p>
                <img src={logoUrl} alt="Logo Preview" className="h-16 object-contain" />
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Simpan Branding
            </button>
          </form>
        </section>

        <section className="glass p-8 rounded-[40px] border-2 border-red-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Manajemen Data</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Zona Berbahaya</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-700">Hapus Semua Nasabah</p>
                  <p className="text-xs text-red-600/70">Menghapus seluruh daftar nasabah, histori cicilan, dan saldo hutang yang sedang berjalan.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetNasabahModal(true)}
                disabled={loading}
                className="w-full mt-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Hapus Seluruh Data Nasabah
              </button>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
               <div className="flex items-start gap-3">
                <RefreshCcw className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-orange-700">Reset Ringkasan Keuangan</p>
                  <p className="text-xs text-orange-600/70">Mengembalikan semua saldo di halaman Keuangan menjadi Rp. 0 (NOL).</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetKeuanganModal(true)}
                disabled={loading}
                className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
              >
                Reset Saldo Keuangan
              </button>
            </div>
          </div>
        </section>

        <AdminConfirmModal
          isOpen={showResetNasabahModal}
          onClose={() => setShowResetNasabahModal(false)}
          onConfirm={handleResetNasabah}
          title="Reset Semua Nasabah"
          message="PERINGATAN: Anda akan menghapus SEMUA data nasabah dan riwayat pembayarannya. Tindakan ini tidak dapat dibatalkan."
        />

        <AdminConfirmModal
          isOpen={showResetKeuanganModal}
          onClose={() => setShowResetKeuanganModal(false)}
          onConfirm={handleResetKeuangan}
          title="Reset Data Keuangan"
          message="Apakah Anda yakin ingin mengembalikan semua saldo keuangan menjadi Rp 0? Ini akan mengubah angka di dashboard utama."
        />

        <section className="glass p-8 rounded-[40px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Informasi Sistem</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Digital Platform</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-500">Versi Aplikasi</span>
                <span className="text-sm font-bold text-primary px-3 py-1 bg-white rounded-full shadow-sm">v2.4.0-digital</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-500">Environtment</span>
                <span className="text-sm font-bold text-gray-700 px-3 py-1 bg-white rounded-full shadow-sm">Production</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-500">Database</span>
                <span className="text-sm font-bold text-gray-700 px-3 py-1 bg-white rounded-full shadow-sm">Google Firestore</span>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-[30px] border border-primary/5">
               <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Catatan Pengembang</p>
               <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                 "Platform ini dirancang khusus untuk kemudahan manajemen keuangan mikro dengan transparansi digital bagi nasabah."
               </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
