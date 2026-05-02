import React, { useEffect, useState } from 'react';
import { useKeuangan } from '../hooks/useKeuangan';
import { useSettings } from '../hooks/useSettings';
import { formatRupiah, formatDisplayDate, formatDateToISO, excelSerialToDate } from '../lib/formulas';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Landmark, 
  Map as MapIcon, 
  Hammer,
  Wallet,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Nasabah, NasabahStatus, NotificationType } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { data: keuangan, loading: keuanganLoading, error: keuanganError } = useKeuangan();
  const { settings } = useSettings();
  const [totalNasabah, setTotalNasabah] = useState(0);
  const [activeNasabah, setActiveNasabah] = useState(0);
  const [lunasNasabah, setLunasNasabah] = useState(0);
  const [totalSisaHutang, setTotalSisaHutang] = useState(0);
  const [nasabahError, setNasabahError] = useState<string | null>(null);
  

  const labels = {
    uang_tanah_lama: settings?.category_labels?.uang_tanah_lama || 'Tanah Lama',
    uang_tanah_baru: settings?.category_labels?.uang_tanah_baru || 'Tanah Baru',
    uang_cash: settings?.category_labels?.uang_cash || 'Uang Cash',
    uang_nasabah: settings?.category_labels?.uang_nasabah || 'Uang Nasabah',
    uang_bank_neo: settings?.category_labels?.uang_bank_neo || 'Uang Bank Neo',
    uang_dipinjamkan: settings?.category_labels?.uang_dipinjamkan || 'Uang Dipinjamkan',
    total_keuntungan: settings?.category_labels?.total_keuntungan || 'Total Untung',
    uang_stokbit: settings?.category_labels?.uang_stokbit || 'Aset Stokbit (M3110)',
    uang_renov: settings?.category_labels?.uang_renov || 'Dana Renovasi'
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'nasabah'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Nasabah));
      setTotalNasabah(snap.size);
      
      const active = docs.filter(d => d.status !== NasabahStatus.LUNAS).length;
      const lunas = docs.filter(d => d.status === NasabahStatus.LUNAS).length;
      const sisaHutang = docs.reduce((acc, curr) => acc + (curr.sisa_hutang || 0), 0);
      
      setActiveNasabah(active);
      setLunasNasabah(lunas);
      setTotalSisaHutang(sisaHutang);

      // Dynamic Check for Due Dates (Notifications)
      docs.forEach(async (n) => {
        if (n.status === NasabahStatus.AKTIF) {
          const lastUpdate = n.updated_at?.toDate() || n.created_at?.toDate() || new Date();
          const diffDays = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays >= 7) {
             const todayStr = new Date().toISOString().split('T')[0];
             const notifId = `due_${n.id}_${todayStr}`;
             
             // Check if already notified today using a dummy doc or just checking notifications collection
             // For simplicity, we can just check if any notification with this title exists
             try {
                // We'll use a fixed ID for today's notification per user to avoid duplicates
                await setDoc(doc(db, 'notifications', notifId), {
                  title: 'Waktunya Bayar!',
                  message: `Nasabah ${n.nama} (${n.barang}) sudah masuk waktu bayar mingguan (Sudah ${diffDays} hari sejak transaksi terakhir).`,
                  type: NotificationType.WARNING,
                  is_read: false,
                  created_at: serverTimestamp()
                }, { merge: true });
             } catch (e) {
                console.error("Error creating due notification", e);
             }
          }
        }
      });
    }, (err) => {
      console.error("Dashboard Nasabah Error:", err);
      setNasabahError(err.message);
    });
    return unsub;
  }, []);

  if (keuanganLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-bold">Memuat dashboard...</p>
    </div>
  );

  if (keuanganError || nasabahError) return (
    <div className="p-8 glass rounded-[40px] text-center space-y-4">
      <h3 className="text-xl font-bold text-danger">Akses Database Terbatas</h3>
      <p className="text-gray-500 max-w-lg mx-auto">
        Database menolak akses. Ini biasanya terjadi jika:
      </p>
      <ul className="text-left text-xs text-gray-500 space-y-2 max-w-sm mx-auto list-disc">
        <li>Fitur <b>"Email/Password"</b> belum diaktifkan di Firebase Console.</li>
        <li>Anda belum masuk (Login) dengan akun yang valid.</li>
        <li>Koneksi internet terputus.</li>
      </ul>
      <div className="text-[10px] text-gray-400 bg-gray-50 p-4 rounded-xl font-mono text-left overflow-auto max-h-32">
        Error Log: {keuanganError || nasabahError}
      </div>
      <div className="flex gap-4 justify-center">
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm">Refresh Halaman</button>
        <button onClick={() => { localStorage.removeItem('MF99_DEMO_MODE'); window.location.href = '/login'; }} className="px-6 py-3 border border-gray-200 rounded-2xl font-bold text-sm">Kembali ke Login</button>
      </div>
    </div>
  );

  const calculatedUangDipinjamkan = (keuangan?.uang_tanah_lama || 0) + 
                                    (keuangan?.uang_tanah_baru || 0) + 
                                    (keuangan?.uang_stokbit || 0) + 
                                    (keuangan?.uang_renov || 0);

  // Bank Neo derived: Uang Cash - Uang yang dipinjamkan
  const calculatedBankNeo = (keuangan?.uang_cash || 0) - calculatedUangDipinjamkan;

  // Total Untung: Uang Nasabah + Uang Bank Neo + Uang Dipinjamkan
  const calculatedTotalUntung = totalSisaHutang + calculatedBankNeo + calculatedUangDipinjamkan;

  const stats = [
    { label: labels.uang_cash, value: keuangan?.uang_cash || 0, icon: Wallet, color: 'bg-green-500' },
    { label: labels.uang_nasabah, value: totalSisaHutang, icon: Landmark, color: 'bg-indigo-500' },
    { label: labels.uang_bank_neo, value: calculatedBankNeo, icon: Landmark, color: 'bg-sky-500' },
    { label: labels.uang_dipinjamkan, value: calculatedUangDipinjamkan, icon: DollarSign, color: 'bg-purple-500' },
    { label: labels.total_keuntungan, value: calculatedTotalUntung, icon: TrendingUp, color: 'bg-accent' },
    { label: 'Total Nasabah', value: totalNasabah, icon: Users, color: 'bg-blue-500', isCurrency: false },
    { label: labels.uang_tanah_lama, value: keuangan?.uang_tanah_lama || 0, icon: MapIcon, color: 'bg-emerald-500' },
    { label: labels.uang_tanah_baru, value: keuangan?.uang_tanah_baru || 0, icon: MapIcon, color: 'bg-teal-500' },
    ...(settings?.custom_categories || []).map(c => ({
      label: c.label,
      value: keuangan?.[c.id] || 0,
      icon: Wallet,
      color: 'bg-blue-500'
    }))
  ];

  const pieData = [
    { name: 'Aktif', value: activeNasabah, color: '#1B4F72' },
    { name: 'Lunas', value: lunasNasabah, color: '#27AE60' },
  ];

  const barData = [
    { name: 'Cash', value: keuangan?.uang_cash || 0 },
    { name: 'Neo', value: calculatedBankNeo },
    { name: 'Dipinjam', value: calculatedUangDipinjamkan },
  ];

  const landData = [
    { name: labels.uang_tanah_lama, value: keuangan?.uang_tanah_lama || 0 },
    { name: labels.uang_tanah_baru, value: keuangan?.uang_tanah_baru || 0 },
    { name: 'Stokbit', value: keuangan?.uang_stokbit || 0 },
    { name: 'Renov', value: keuangan?.uang_renov || 0 }
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-xl md:rounded-2xl" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-bold tracking-tight text-primary">Dashboard Admin</h2>
            <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 font-medium italic">Sistem Pemantauan Digital Mitra Finance 99</p>
          </div>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-primary font-bold italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group border border-white/10"
          >
            <div className={cn("absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 -mr-3 -mt-3 md:-mr-6 md:-mt-6 rounded-full opacity-10 transition-transform group-hover:scale-110", stat.color)} />
            <div className="flex flex-col md:flex-row md:items-start justify-between relative z-10 gap-1 md:gap-0">
              <div className="order-2 md:order-1">
                <p className="text-[7px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                <h3 className="text-[11px] md:text-xl font-black mt-0.5 md:mt-1 truncate text-slate-900 dark:text-slate-100">
                  {stat.isCurrency === false ? stat.value : formatRupiah(stat.value)}
                </h3>
              </div>
              <div className={cn("p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-white shadow-lg self-start md:self-auto order-1 md:order-2", stat.color)}>
                <stat.icon className="w-3 md:w-5 h-3 md:h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Nasabah Distribution */}
        <section className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 mb-4 md:mb-6">
            <PieIcon className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            Distribusi Nasabah
          </h3>
          <div className="h-48 md:h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-primary">{totalNasabah}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
             </div>
          </div>
          <div className="flex justify-center gap-8 mt-4">
             {pieData.map(item => (
               <div key={item.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-xs font-bold text-gray-600">{item.name}: {item.value}</span>
               </div>
             ))}
          </div>
        </section>

        {/* Financial Distribution */}
        <section className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] lg:col-span-2">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 mb-4 md:mb-6">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            Perbandingan Aset Keuangan
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-50">
                          <p className="text-xs font-bold text-gray-400 mb-1 uppercase">{payload[0].payload.name}</p>
                          <p className="text-sm font-bold text-primary">{formatRupiah(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#1B4F72" 
                  radius={[10, 10, 10, 10]} 
                  barSize={40}
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Land Assets */}
        <section className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px]">
           <h3 className="text-base md:text-lg font-bold flex items-center gap-2 mb-4 md:mb-6">
            <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            Nilai Aset Properti (Tanah)
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={landData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-50">
                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-emerald-600">{formatRupiah(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} barSize={25} />
               </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Other Updates */}
        <section className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-center gap-4">
           <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
             <Hammer className="w-4 h-4 md:w-5 md:h-5 text-accent" />
             Pendukung Operasional
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 md:block space-y-0 md:space-y-4">
              <div className="p-4 md:p-5 bg-gray-50 dark:bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-between">
                 <div>
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.uang_renov}</p>
                    <p className="text-sm md:text-xl font-black text-primary dark:text-sky-400">{formatRupiah(keuangan?.uang_renov || 0)}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm">
                    <Hammer className="w-4 h-4 md:w-6 md:h-6 text-accent" />
                 </div>
              </div>
              <div className="p-4 md:p-5 bg-gray-50 dark:bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-between">
                 <div>
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.uang_stokbit}</p>
                    <p className="text-sm md:text-xl font-black text-primary dark:text-sky-400">{formatRupiah(keuangan?.uang_stokbit || 0)}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm">
                    <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-sky-500" />
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
