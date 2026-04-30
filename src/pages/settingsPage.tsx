import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Trash2, AlertTriangle, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetNasabah = async () => {
    if (!window.confirm('PERINGATAN: Anda akan menghapus SEMUA data nasabah dan riwayat pembayarannya. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return;
    
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
    if (!window.confirm('Reset data ringkasan keuangan menjadi nol?')) return;
    
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
                onClick={handleResetNasabah}
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
                onClick={handleResetKeuangan}
                disabled={loading}
                className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
              >
                Reset Saldo Keuangan
              </button>
            </div>
          </div>
        </section>

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
