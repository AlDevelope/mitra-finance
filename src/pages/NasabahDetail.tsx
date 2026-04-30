import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Nasabah, Angsuran, NasabahStatus } from '../types';
import { formatRupiah, generateWhatsAppMessage } from '../lib/formulas';
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Calendar,
  Wallet,
  Clock,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const NasabahDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [history, setHistory] = useState<Angsuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  
  // Payment Form State
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const nasabahUnsub = onSnapshot(doc(db, 'nasabah', id), (doc) => {
      if (doc.exists()) {
        setNasabah({ id: doc.id, ...doc.data() } as Nasabah);
      } else {
        navigate('/nasabah');
      }
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
  }, [id, navigate]);

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    return errInfo.error;
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
      await updateDoc(doc(db, 'nasabah', id), {
        angsuran_terbayar: nextAngsuran,
        sisa_angsuran: sisa,
        sisa_hutang: sisa * nasabah.rp_per_angsuran,
        progress_persen: Math.round((nextAngsuran / nasabah.jumlah_angsuran) * 100),
        status: sisa === 0 ? NasabahStatus.LUNAS : NasabahStatus.AKTIF,
        updated_at: serverTimestamp()
      });

      setShowPayForm(false);
      setPayNote('');
    } catch (error) {
      const msg = handleFirestoreError(error, 'WRITE', `nasabah/${id}`);
      alert(`Gagal mencatat pembayaran: ${msg}`);
    } finally {
      setPayLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus nasabah ini beserta seluruh riwayatnya?')) return;
    try {
      await deleteDoc(doc(db, 'nasabah', id));
      navigate('/nasabah');
    } catch (err) {
      const msg = handleFirestoreError(err, 'DELETE', `nasabah/${id}`);
      alert(`Gagal menghapus nasabah: ${msg}`);
    }
  };

  if (loading || !nasabah) return <div className="p-8 text-center font-bold text-gray-400">Memuat detail nasabah...</div>;

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
               <button onClick={handleDelete} className="w-10 h-10 bg-white border border-gray-100 text-danger rounded-xl flex items-center justify-center hover:bg-danger/5 transition-all">
                 <Trash2 className="w-5 h-5" />
               </button>
               <Link to={`/nasabah/${id}/edit`} className="w-10 h-10 bg-white border border-gray-100 text-primary rounded-xl flex items-center justify-center hover:bg-primary/5 transition-all">
                 <Edit className="w-5 h-5" />
               </Link>
             </>
           )}
        </div>
      </header>

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
                <div className="mt-4 flex gap-3">
                   <a 
                    href={generateWhatsAppMessage(nasabah, nasabah.angsuran_terbayar + 1)}
                    target="_blank"
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all"
                   >
                     <MessageCircle className="w-4 h-4" /> WhatsApp
                   </a>
                   <button 
                     onClick={() => {
                        const link = `${window.location.origin}/portal/${id}`;
                        navigator.clipboard.writeText(link);
                        alert('Link portal disalin ke clipboard!');
                     }}
                     className="bg-white border border-gray-100 text-gray-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
                   >
                     <Share2 className="w-4 h-4" /> Share Link
                   </button>
                   <Link 
                     to={`/portal/${id}`}
                     target="_blank"
                     className="bg-white border border-gray-100 text-accent px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent/5 transition-all"
                   >
                     <TrendingUp className="w-4 h-4" /> Preview Portal
                   </Link>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Minggu</p>
                <p className="font-bold text-gray-700">{nasabah.jumlah_angsuran} <span className="text-[10px] text-gray-400 uppercase">Weeks</span></p>
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
                    <th className="pb-4">Minggu Ke</th>
                    <th className="pb-4">Jumlah</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((record, i) => (
                    <tr key={record.id} className="text-sm font-medium text-gray-700">
                      <td className="py-4">{history.length - i}</td>
                      <td className="py-4">{record.tanggal_bayar}</td>
                      <td className="py-4">Minggu {record.angsuran_ke}</td>
                      <td className="py-4 font-bold text-primary">{formatRupiah(record.jumlah_bayar)}</td>
                      <td className="py-4">
                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded-full uppercase">VERIFIED</span>
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
                <p className="text-xl font-bold">{nasabah.sisa_angsuran} <span className="text-xs text-white/40">Minggu</span></p>
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
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Minggu ke-{nasabah.angsuran_terbayar + 1}</p>
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
    </div>
  );
};

function TrendingUp({ className }: { className?: string }) { return <TrendingUpIcon className={className} />; }
import { TrendingUp as TrendingUpIcon } from 'lucide-react';
