import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Nasabah, Angsuran, NasabahStatus } from '../types';
import { formatRupiah, generateNasabahPaymentMessage } from '../lib/formulas';
import { signOut } from 'firebase/auth';
import { LogOut, MessageCircle, TrendingUp, CheckCircle2, History, Package, Wallet, Clock, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { useParams } from 'react-router-dom';

export const TagihanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [history, setHistory] = useState<Angsuran[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveNasabahId = id || profile?.nasabah_id;

  useEffect(() => {
    if (!effectiveNasabahId) {
       setLoading(false);
       return;
    }
    
    const nasabahUnsub = onSnapshot(doc(db, 'nasabah', effectiveNasabahId), (doc) => {
      if (doc.exists()) {
        setNasabah({ id: doc.id, ...doc.data() } as Nasabah);
      } else {
        setNasabah(null);
      }
      setLoading(false);
    });

    const historyUnsub = onSnapshot(
      query(collection(db, 'nasabah', effectiveNasabahId, 'history'), orderBy('angsuran_ke', 'desc')),
      (snap) => {
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Angsuran)));
      }
    );

    return () => {
      nasabahUnsub();
      historyUnsub();
    };
  }, [profile?.nasabah_id]);

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Memuat tagihan Anda...</div>;

  if (!nasabah) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Belum Ada Data Tagihan</h2>
        <p className="text-gray-500 text-center max-w-xs">Akun Anda belum ditautkan ke data nasabah. Silahkan hubungi admin Mitra Finance 99.</p>
        <button onClick={handleLogout} className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 pb-24">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Halo, {profile?.full_name}! 👋</h2>
          <p className="text-gray-500 mt-1">Status tagihan angsuran Anda hari ini</p>
        </div>
        <button onClick={handleLogout} className="w-12 h-12 glass flex items-center justify-center rounded-2xl text-danger hover:bg-danger/5">
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <section className="glass p-8 rounded-[40px] relative overflow-hidden bg-primary text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Barang Yang Dicicil</p>
                <h3 className="text-2xl font-bold">{nasabah.barang}</h3>
              </div>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase",
                nasabah.status === NasabahStatus.LUNAS ? "bg-success text-white" : "bg-white/20 text-white"
              )}>
                {nasabah.status}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
               <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="80" cy="80" r="70" 
                      fill="transparent" 
                      stroke="rgba(255,255,255,0.1)" 
                      strokeWidth="12" 
                    />
                    <motion.circle 
                      cx="80" cy="80" r="70" 
                      fill="transparent" 
                      stroke="#F39C12" 
                      strokeWidth="12" 
                      strokeDasharray="440"
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * (nasabah.progress_persen / 100)) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold">{nasabah.progress_persen}%</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Lunas</p>
                  </div>
               </div>

               <div className="flex-1 space-y-6">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Sisa Hutang Berjalan</p>
                    <h4 className="text-4xl font-bold">{formatRupiah(nasabah.sisa_hutang)}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/10 rounded-2xl">
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Minggu Lagi</p>
                        <p className="text-xl font-bold">{nasabah.sisa_angsuran}</p>
                     </div>
                     <div className="p-4 bg-white/10 rounded-2xl">
                        <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Per Minggu</p>
                        <p className="text-xl font-bold">{formatRupiah(nasabah.rp_per_angsuran)}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section className="glass p-8 rounded-[40px]">
           <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Timeline Angsuran
          </h3>
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
            {Array.from({ length: nasabah.jumlah_angsuran }).map((_, idx) => {
               const step = idx + 1;
               const isPaid = step <= nasabah.angsuran_terbayar;
               return (
                 <div key={idx} className="flex flex-col items-center min-w-[70px] space-y-2">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all",
                      isPaid ? "bg-success text-white shadow-lg shadow-success/20" : "bg-gray-100 text-gray-400"
                    )}>
                      {isPaid ? <CheckCircle2 className="w-6 h-6" /> : step}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Mg {step}</span>
                 </div>
               );
            })}
          </div>
        </section>

        <div className="flex gap-4">
           <a 
            href={generateNasabahPaymentMessage(nasabah)}
            target="_blank"
            className="flex-1 bg-accent text-white p-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
           >
             <CreditCard className="w-6 h-6" /> Bayar Sekarang
           </a>
        </div>

        <section className="space-y-4">
           <h3 className="text-xl font-bold flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-accent" />
            Riwayat Pembayaran
          </h3>
          <div className="space-y-3">
             {history.map((record) => (
               <div key={record.id} className="glass p-5 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-bold text-sm">Minggu ke-{record.angsuran_ke}</p>
                        <p className="text-xs text-gray-400">{record.tanggal_bayar}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-primary">{formatRupiah(record.jumlah_bayar)}</p>
                     <p className="text-[10px] text-success font-bold uppercase tracking-wider">LUNA S</p>
                  </div>
               </div>
             ))}
             {history.length === 0 && (
               <div className="bg-gray-100 p-8 rounded-[40px] text-center text-gray-400 font-medium">
                  Belum ada catatan pembayaran.
               </div>
             )}
          </div>
        </section>
      </div>

      <footer className="mt-12 text-center text-gray-400 text-xs font-medium max-w-xs mx-auto space-y-1">
        <p>Mitra Finance 99</p>
        <p className="italic">"Berkembang, Bertumbuh, Berinovasi"</p>
      </footer>
    </div>
  );
};
