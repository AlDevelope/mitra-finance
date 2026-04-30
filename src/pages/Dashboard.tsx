import React, { useEffect, useState } from 'react';
import { useKeuangan } from '../hooks/useKeuangan';
import { formatRupiah } from '../lib/formulas';
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
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Nasabah, NasabahStatus } from '../types';
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

export const Dashboard: React.FC = () => {
  const { data: keuangan, loading: keuanganLoading, error: keuanganError } = useKeuangan();
  const [totalNasabah, setTotalNasabah] = useState(0);
  const [activeNasabah, setActiveNasabah] = useState(0);
  const [lunasNasabah, setLunasNasabah] = useState(0);
  const [totalSisaHutang, setTotalSisaHutang] = useState(0);
  const [nasabahError, setNasabahError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'nasabah'), (snap) => {
      const docs = snap.docs.map(doc => doc.data() as Nasabah);
      setTotalNasabah(snap.size);
      
      const active = docs.filter(d => d.status !== NasabahStatus.LUNAS).length;
      const lunas = docs.filter(d => d.status === NasabahStatus.LUNAS).length;
      const sisaHutang = docs.reduce((acc, curr) => acc + (curr.sisa_hutang || 0), 0);
      
      setActiveNasabah(active);
      setLunasNasabah(lunas);
      setTotalSisaHutang(sisaHutang);
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

  const calculatedUangDipinjamkan = (keuangan?.uang_tanah_lama || 0) + (keuangan?.uang_tanah_baru || 0) + (keuangan?.uang_stokbit || 0) + (keuangan?.uang_renov || 0);
  const calculatedTotalKeuntungan = totalSisaHutang + (keuangan?.uang_bank_neo || 0) + calculatedUangDipinjamkan;

  const stats = [
    { label: 'Uang Cash', value: keuangan?.uang_cash || 0, icon: Wallet, color: 'bg-green-500' },
    { label: 'Total Nasabah', value: totalNasabah, icon: Users, color: 'bg-blue-500', isCurrency: false },
    { label: 'Total Keuntungan', value: calculatedTotalKeuntungan, icon: TrendingUp, color: 'bg-accent' },
    { label: 'Uang Dipinjamkan', value: calculatedUangDipinjamkan, icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Uang Nasabah', value: totalSisaHutang, icon: Landmark, color: 'bg-indigo-500' },
    { label: 'Bank Neo', value: keuangan?.uang_bank_neo || 0, icon: Landmark, color: 'bg-sky-500' },
    { label: 'Tanah Lama', value: keuangan?.uang_tanah_lama || 0, icon: MapIcon, color: 'bg-emerald-500' },
    { label: 'Tanah Baru', value: keuangan?.uang_tanah_baru || 0, icon: MapIcon, color: 'bg-teal-500' },
  ];

  const pieData = [
    { name: 'Aktif', value: activeNasabah, color: '#1B4F72' },
    { name: 'Lunas', value: lunasNasabah, color: '#27AE60' },
  ];

  const barData = [
    { name: 'Cash', value: keuangan?.uang_cash || 0 },
    { name: 'Neo', value: keuangan?.uang_bank_neo || 0 },
    { name: 'Dipinjam', value: calculatedUangDipinjamkan },
  ];

  const landData = [
    { name: 'Tanah Lama', value: keuangan?.uang_tanah_lama || 0 },
    { name: 'Tanah Baru', value: keuangan?.uang_tanah_baru || 0 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
          <p className="text-gray-500 mt-1">Sistem Pemantauan Digital Mitra Finance 99</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-gray-400">Tagline</p>
          <p className="text-primary font-bold italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className={cn("absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10 transition-transform group-hover:scale-110", stat.color)} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-xl font-bold mt-1">
                  {stat.isCurrency === false ? stat.value : formatRupiah(stat.value)}
                </h3>
              </div>
              <div className={cn("p-2.5 rounded-xl text-white shadow-lg", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nasabah Distribution */}
        <section className="glass p-8 rounded-[40px] flex flex-col">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-accent" />
            Distribusi Nasabah
          </h3>
          <div className="h-64 relative">
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
        <section className="glass p-8 rounded-[40px] lg:col-span-2">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-accent" />
            Perbandingan Aset Keuangan
          </h3>
          <div className="h-64">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Land Assets */}
        <section className="glass p-8 rounded-[40px]">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <MapIcon className="w-5 h-5 text-emerald-500" />
            Nilai Aset Properti (Tanah)
          </h3>
          <div className="h-64">
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
        <section className="glass p-8 rounded-[40px] flex flex-col justify-center">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
             <Hammer className="w-5 h-5 text-accent" />
             Pendukung Operasional
           </h3>
           <div className="space-y-4">
              <div className="p-5 bg-gray-50 rounded-3xl flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dana Renovasi</p>
                    <p className="text-xl font-bold text-primary">{formatRupiah(keuangan?.uang_renov || 0)}</p>
                 </div>
                 <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <Hammer className="w-6 h-6 text-accent" />
                 </div>
              </div>
              <div className="p-5 bg-gray-50 rounded-3xl flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aset Stokbit (M3110)</p>
                    <p className="text-xl font-bold text-primary">{formatRupiah(3110000)}</p>
                 </div>
                 <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <TrendingUp className="w-6 h-6 text-sky-500" />
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};
