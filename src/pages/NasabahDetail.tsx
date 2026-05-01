import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Nasabah, Angsuran, NasabahStatus, NotificationType } from '../types';
import { formatRupiah, generateWhatsAppMessage, formatDisplayDate } from '../lib/formulas';
import { ArrowLeft, MessageCircle, Share2, Edit, Trash2, CheckCircle2, Plus, Calendar, Wallet, Clock, History, Camera, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { NasabahShareCard } from '../components/NasabahShareCard';
import { AdminConfirmModal } from '../components/AdminConfirmModal';

const NasabahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [history, setHistory] = useState<Angsuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showLunasModal, setShowLunasModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Payment Form State
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const nasabahUnsub = onSnapshot(doc(db, 'nasabah', id), (doc) => {
      if (doc.exists()) {
        setNasabah({ id: doc.id, ...doc.data() } as Nasabah);
      } else {
        // If not found, it might have been auto-deleted on lunas
        // We'll let the user navigate back if they were looking at it
         if (!loading) navigate('/nasabah');
      }
    }, (err) => {
       console.error("Nasabah detail error:", err);
       setLoading(false);
    });

    const historyUnsub = onSnapshot(
      query(collection(db, 'nasabah', id, 'history'), orderBy('angsuran_ke', 'desc')),
      (snap) => {
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Angsuran)));
        setLoading(false);
      }
    );

    return () => {
      nasabahUnsub();
      historyUnsub();
    };
  }, [id, navigate, loading]);

  const createNotification = async (title: string, message: string, type: NotificationType) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        type,
        is_read: false,
        created_at: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nasabah || !id) return;

    setPayLoading(true);
    try {
      const nextAngsuran = (nasabah.angsuran_terbayar || 0) + 1;
      const sisa = nasabah.jumlah_angsuran - nextAngsuran;
      
      // 1. Add to history
      await addDoc(collection(db, 'nasabah', id, 'history'), {
        nasabah_id: id,
        angsuran_ke: nextAngsuran,
        tanggal_bayar: payDate,
        jumlah_bayar: nasabah.rp_per_angsuran,
        sisa_setelah_bayar: sisa,
        keterangan: payNote || 'Pembayaran angsuran',
        created_at: serverTimestamp(),
      });

      // 2. Update nasabah document
      if (sisa === 0) {
        setShowLunasModal(true);
      } else {
        await updateDoc(doc(db, 'nasabah', id), {
          angsuran_terbayar: nextAngsuran,
          sisa_angsuran: sisa,
          sisa_hutang: sisa * nasabah.rp_per_angsuran,
          progress_persen: Math.round((nextAngsuran / nasabah.jumlah_angsuran) * 100),
          status: NasabahStatus.AKTIF,
          updated_at: serverTimestamp()
        });
        setPayNote('');
      }
    } catch (error: any) {
      alert(`Gagal mencatat pembayaran: ${error.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  const handleFinalizeLunas = async () => {
    if (!nasabah || !id) return;
    setPayLoading(true);
    try {
      // 1. Send notification
      await createNotification(
        'Nasabah Telah Lunas!',
        `Nasabah ${nasabah.nama} untuk barang ${nasabah.barang} telah menyelesaikan seluruh angsuran.`,
        NotificationType.SUCCESS
      );
      
      // 2. Hide modal first
      setShowLunasModal(false);
      
      // 3. Navigate away FIRST before deleting to avoid listener conflicts
      // We use a small timeout to let the navigation settle
      navigate('/nasabah', { replace: true });
      
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, 'nasabah', id));
        } catch (delErr) {
          console.error("Delayed delete error:", delErr);
        }
      }, 500);

    } catch (err: any) {
      console.error("Lunas final error:", err);
      alert(`Gagal menyelesaikan pelunasan: ${err.message}`);
      setPayLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!id || !nasabah) return;
    try {
      await deleteDoc(doc(db, 'nasabah', id));
      navigate('/nasabah');
    } catch (err: any) {
      alert(`Gagal menghapus nasabah: ${err.message}`);
    }
  };

  const handleDeleteHistory = async (record: Angsuran) => {
    if (!id || !nasabah || !window.confirm(`Hapus histori pembayaran MGU ke-${record.angsuran_ke}? Stats nasabah akan dikembalikan.`)) return;
    
    setDeletingHistoryId(record.id);
    try {
      // 1. Delete record
      await deleteDoc(doc(db, 'nasabah', id, 'history', record.id));

      // 2. Rollback nasabah stats
      const prevTerbayar = record.angsuran_ke - 1;
      const sisa = nasabah.jumlah_angsuran - prevTerbayar;
      
      await updateDoc(doc(db, 'nasabah', id), {
        angsuran_terbayar: prevTerbayar,
        sisa_angsuran: sisa,
        sisa_hutang: sisa * nasabah.rp_per_angsuran,
        progress_persen: Math.round((prevTerbayar / nasabah.jumlah_angsuran) * 100),
        updated_at: serverTimestamp()
      });
      
      alert('Histori pembayaran berhasil dihapus dan stats nasabah telah dikembalikan.');
    } catch (err: any) {
      alert(`Gagal menghapus riwayat: ${err.message}`);
    } finally {
      setDeletingHistoryId(null);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-400">Memuat detail nasabah...</div>;
  if (!nasabah) return <div className="p-8 text-center font-bold text-gray-400">Nasabah tidak ditemukan (mungkin sudah lunas/dihapus)</div>;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/nasabah" className="w-10 h-10 glass flex items-center justify-center rounded-xl hover:bg-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Detail Nasabah</h2>
        </div>
        <div className="flex gap-2">
           {isAdmin && (
             <>
               <button 
                 onClick={() => setShowShareCard(true)}
                 className="px-4 h-10 bg-accent text-white rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all font-bold text-xs"
               >
                 <Camera className="w-4 h-4" />
                 Bagikan Status
               </button>
               <button 
                 onClick={() => setShowDeleteModal(true)} 
                 className="w-10 h-10 bg-white border border-gray-100 text-danger rounded-xl flex items-center justify-center hover:bg-danger/5 transition-all"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
               <Link to={`/nasabah/${id}/edit`} className="w-10 h-10 bg-white border border-gray-100 text-primary rounded-xl flex items-center justify-center hover:bg-primary/5 transition-all">
                 <Edit className="w-5 h-5" />
               </Link>
             </>
           )}
        </div>
      </header>

      {nasabah && (
        <AdminConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Hapus Nasabah"
          message={`Apakah Anda yakin ingin menghapus nasabah ${nasabah.nama}? Seluruh data riwayat pembayaran akan ikut terhapus selamanya.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass p-8 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -mr-10 -mt-10 blur-3xl" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-24 h-24 rounded-3xl bg-primary text-white flex items-center justify-center text-4xl font-bold shadow-xl">
                {nasabah.nama.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold">{nasabah.nama}</h1>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase",
                    nasabah.status === NasabahStatus.LUNAS ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                  )}>
                    {nasabah.status}
                  </span>
                </div>
                <p className="text-gray-500 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {nasabah.barang}
                </p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                     <button 
                      onClick={() => setShowShareCard(true)}
                      className="bg-green-500 text-white px-8 py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all"
                     >
                       <MessageCircle className="w-6 h-6" /> WhatsApp
                     </button>
                     <button 
                      onClick={() => setShowShareCard(true)}
                      className="bg-accent text-white px-8 py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
                     >
                       <Share2 className="w-6 h-6" /> Bagikan Status
                     </button>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uang Muka</p>
                <p className="font-bold text-gray-700">{formatRupiah(nasabah.uang_muka)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rp/Angsuran</p>
                <p className="font-bold text-primary">{formatRupiah(nasabah.rp_per_angsuran)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Hutang</p>
                <p className="font-bold text-gray-700">{formatRupiah(nasabah.total_hutang)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Sisa Hutang</p>
                <p className="font-bold text-accent">{formatRupiah(nasabah.sisa_hutang)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total MGU</p>
                <p className="font-bold text-gray-700">{nasabah.jumlah_angsuran} <span className="text-[10px] text-gray-400 uppercase">MGU</span></p>
              </div>
            </div>
          </section>

          <section className="glass p-8 rounded-[40px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Progress Pembayaran
              </h3>
              <p className="text-sm font-bold text-primary">{nasabah.progress_persen}% Selesai</p>
            </div>
            
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8">
              <motion.div 
                className="h-full bg-accent relative"
                initial={{ width: 0 }}
                animate={{ width: `${nasabah.progress_persen}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-shimmer" />
              </motion.div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: nasabah.jumlah_angsuran }).map((_, idx) => {
                const step = idx + 1;
                const isPaid = step <= nasabah.angsuran_terbayar;
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                      isPaid ? "bg-success text-white" : "bg-gray-100 text-gray-300"
                    )}
                  >
                    {isPaid ? <CheckCircle2 className="w-3 h-3" /> : step}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass rounded-[40px] overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center">
               <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                Histori Pembayaran
              </h3>
            </div>
            
            <div className="p-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-4">No</th>
                    <th className="pb-4">Tanggal</th>
                    <th className="pb-4">MGU Ke</th>
                    <th className="pb-4">Jumlah</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((record, i) => (
                    <tr key={record.id} className="text-sm font-medium text-gray-700">
                      <td className="py-4">{history.length - i}</td>
                      <td className="py-4">{formatDisplayDate(record.tanggal_bayar)}</td>
                      <td className="py-4 text-accent font-bold">MGU {record.angsuran_ke}</td>
                      <td className="py-4 font-bold text-primary">{formatRupiah(record.jumlah_bayar)}</td>
                      <td className="py-4">
                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded-full uppercase">VERIFIED</span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDeleteHistory(record)}
                          disabled={deletingHistoryId === record.id}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all disabled:opacity-30"
                          title="Hapus Pembayaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">Belum ada riwayat pembayaran</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass p-8 rounded-[40px] bg-primary text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-accent" />
              Sisa Hutang
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Total Rupiah</p>
              <h4 className="text-3xl font-bold">{formatRupiah(nasabah.sisa_hutang)}</h4>
            </div>
            <div className="mt-8 flex justify-between items-end">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Sisa Angsuran</p>
                <p className="text-xl font-bold">{nasabah.sisa_angsuran} <span className="text-xs text-white/40">MGU</span></p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                 <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </section>

          {isAdmin && nasabah.status !== NasabahStatus.LUNAS && (
            <section className="glass p-8 rounded-[40px] border-2 border-accent/20">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                <Plus className="w-6 h-6 text-accent" />
                Catat Pembayaran
              </h3>
              
              <form onSubmit={handlePayment} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Tanggal Bayar</label>
                  <p className="text-[10px] text-accent font-bold px-1 mb-1 italic">* Bisa diubah jika bayar kemarin/telat</p>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="date" 
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-gray-700"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Jumlah Bayar</label>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">MGU ke-{nasabah.angsuran_terbayar + 1}</p>
                    <p className="text-xl font-bold text-primary">{formatRupiah(nasabah.rp_per_angsuran)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Catatan Tambahan</label>
                  <textarea 
                    placeholder="Contoh: Titipan tetangga"
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium resize-none h-24"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={payLoading}
                  className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all active:scale-95 disabled:grayscale"
                >
                  {payLoading ? 'Menyimpan...' : 'Bayar Sekarang'}
                </button>
              </form>
            </section>
          )}

          <section className="glass p-8 rounded-[40px]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Catatan Nasabah</h3>
            <div className="p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 italic">
              {nasabah.catatan || 'Tidak ada catatan khusus untuk nasabah ini.'}
            </div>
          </section>
        </div>
      </div>

      {showLunasModal && nasabah && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
           >
              {/* Confetti-like decor */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-success" />
              
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              
              <h2 className="text-3xl font-black text-primary dark:text-sky-400 mb-2">SELAMAT!</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                Nasabah <span className="font-bold text-gray-900 dark:text-white">{nasabah.nama}</span> telah melunasi seluruh angsuran untuk <span className="font-bold text-gray-900 dark:text-white">{nasabah.barang}</span>.
              </p>
              
              <div className="space-y-4">
                 <button 
                  onClick={() => setShowShareCard(true)}
                  className="w-full bg-green-500 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all"
                 >
                   <Share2 className="w-6 h-6" /> Bagikan Bukti Lunas
                 </button>
                 <button 
                  onClick={handleFinalizeLunas}
                  className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 py-4 rounded-[24px] font-bold hover:bg-gray-200 transition-all"
                 >
                   Hanya Selesai & Hapus Data
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {showShareCard && nasabah && (
        <NasabahShareCard 
          nasabah={nasabah} 
          history={history}
          isLunas={nasabah.sisa_angsuran === 0 || (nasabah.angsuran_terbayar + 1 === nasabah.jumlah_angsuran)}
          onClose={() => {
            setShowShareCard(false);
          }} 
        />
      )}
    </div>
  );
};

export default NasabahDetail;
