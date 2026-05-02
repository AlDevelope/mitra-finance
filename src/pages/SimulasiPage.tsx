import React, { useState, useMemo, useEffect } from 'react';
import { formatRupiah } from '../lib/formulas';
import { Calculator, TrendingUp, Calendar, Clock, DollarSign, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../hooks/useSettings';

const SimulasiPage: React.FC = () => {
  const { settings } = useSettings();
  const [harga, setHarga] = useState(1650000);
  const [uangMuka, setUangMuka] = useState(300000);
  
  // Local state for smooth typing without cursor jumps
  const [localHarga, setLocalHarga] = useState(formatRupiah(1650000));
  const [localUangMuka, setLocalUangMuka] = useState(formatRupiah(300000));

  useEffect(() => {
    if (settings) {
      if (settings.simulasi_harga !== undefined) {
        setHarga(settings.simulasi_harga);
        setLocalHarga(formatRupiah(settings.simulasi_harga));
      }
      if (settings.simulasi_dp !== undefined) {
        setUangMuka(settings.simulasi_dp);
        setLocalUangMuka(formatRupiah(settings.simulasi_dp));
      }
    }
  }, [settings]);

  const pendanaan = useMemo(() => Math.max(0, harga - uangMuka), [harga, uangMuka]);

  // Configurations from Image 3
  const weeklyTenors = [
    { label: '8 Minggu', masa: '(8X)', interest: 0.30, tenor: 8 },
    { label: '10 Minggu', masa: '(10X)', interest: 0.32, tenor: 10 },
    { label: '12 Minggu', masa: '(12X)', interest: 0.34, tenor: 12 },
    { label: '15 Minggu', masa: '(15X)', interest: 0.35, tenor: 15 },
  ];

  const monthlyTenors = [
    { label: '4 Bulan', masa: '(4X)', interest: 0.35, tenor: 4 },
    { label: '5 Bulan', masa: '(5X)', interest: 0.36, tenor: 5 },
    { label: '6 Bulan', masa: '(6X)', interest: 0.38, tenor: 6 },
    { label: '10 Bulan', masa: '(10X)', interest: 0.40, tenor: 10 },
  ];

  const calculateCicilan = (principal: number, interest: number, tenor: number) => {
    const total = principal + (principal * interest);
    return Math.round(total / tenor);
  };

  const calculateTotal = (principal: number, interest: number) => {
    return Math.round(principal + (principal * interest));
  };

  const calculateProfit = (principal: number, interest: number) => {
    return Math.round(principal * interest);
  };

  const handleChangeHarga = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw) || 0;
    setLocalHarga(formatRupiah(num));
    setHarga(num);
  };

  const handleChangeDP = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw) || 0;
    setLocalUangMuka(formatRupiah(num));
    setUangMuka(num);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary dark:text-sky-400">Simulasi Mitra Finance 99</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
      </header>

      {/* Inputs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] border-2 border-primary/10 dark:border-white/5 space-y-4 group">
           <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Barang</label>
           </div>
           <input 
              type="text" 
              value={localHarga} 
              onChange={e => handleChangeHarga(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-primary dark:text-white outline-none focus:text-accent transition-colors"
           />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contoh: 1.500.000</p>
        </div>
        <div className="glass p-8 rounded-[40px] border-2 border-primary/10 dark:border-white/5 space-y-4 group">
           <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-accent" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uang Muka (DP)</label>
           </div>
           <input 
              type="text" 
              value={localUangMuka} 
              onChange={e => handleChangeDP(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-primary dark:text-white outline-none focus:text-accent transition-colors"
           />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DP awal transaksi</p>
        </div>
        <div className="glass p-8 rounded-[40px] bg-primary text-white space-y-4 shadow-xl shadow-primary/20">
           <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <label className="text-xs font-black text-white/50 uppercase tracking-widest">Total Pendanaan</label>
           </div>
           <h3 className="text-3xl font-black">{formatRupiah(pendanaan)}</h3>
           <p className="text-xs font-bold text-white/40">Hasil: Harga - Uang Muka</p>
        </div>
      </section>

      {/* Weekly Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <section className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
              <Calendar className="w-6 h-6 text-accent" />
              SIMULASI MINGGUAN (8X - 15X)
            </h3>
            <div className="glass rounded-[40px] overflow-hidden overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-gray-50/50 dark:bg-white/5">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Tenor</th>
                      <th className="px-6 py-4">Interest</th>
                      <th className="px-6 py-4 text-accent">Cicilan/MGU</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {weeklyTenors.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-all font-bold">
                        <td className="px-6 py-5 text-gray-900 dark:text-white text-xs">{t.label} <span className="text-[9px] text-gray-400 font-bold ml-1">{t.masa}</span></td>
                        <td className="px-6 py-5 text-primary dark:text-sky-400 text-xs">{(t.interest * 100)}%</td>
                        <td className="px-6 py-5 text-accent text-base font-black">{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</td>
                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(calculateTotal(pendanaan, t.interest))}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </section>

         <section className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
              <Clock className="w-6 h-6 text-accent" />
              SIMULASI BULANAN (4X - 10X)
            </h3>
            <div className="glass rounded-[40px] overflow-hidden overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-gray-50/50 dark:bg-white/5">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Tenor</th>
                      <th className="px-6 py-4">Interest</th>
                      <th className="px-6 py-4 text-accent">Cicilan/Bulan</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {monthlyTenors.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-all font-bold">
                        <td className="px-6 py-5 text-gray-900 dark:text-white text-xs">{t.label} <span className="text-[9px] text-gray-400 font-bold ml-1">{t.masa}</span></td>
                        <td className="px-6 py-5 text-primary dark:text-sky-400 text-xs">{(t.interest * 100)}%</td>
                        <td className="px-6 py-5 text-accent text-base font-black">{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</td>
                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(calculateTotal(pendanaan, t.interest))}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </section>
      </div>

      {/* Profit Analysis */}
      <section className="space-y-6">
         <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
            <TrendingUp className="w-6 h-6 text-accent" />
            ANALISIS KEUNTUNGAN (PROFIT)
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[40px] space-y-6">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-white/5 pb-4">Profit Mingguan</h4>
               <div className="space-y-4">
                  {weeklyTenors.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t.label}</p>
                          <p className="font-bold text-gray-700 dark:text-white">{formatRupiah(calculateProfit(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-success uppercase">Per Cicilan</p>
                          <p className="font-black text-primary dark:text-sky-400">{formatRupiah(calculateProfit(pendanaan, t.interest) / t.tenor)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="glass p-8 rounded-[40px] space-y-6">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-white/5 pb-4">Profit Bulanan</h4>
               <div className="space-y-4">
                  {monthlyTenors.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t.label}</p>
                          <p className="font-bold text-gray-700 dark:text-white">{formatRupiah(calculateProfit(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-success uppercase">Per Cicilan</p>
                          <p className="font-black text-primary dark:text-sky-400">{formatRupiah(calculateProfit(pendanaan, t.interest) / t.tenor)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default SimulasiPage;
import React, { useState, useMemo, useEffect } from 'react';
import { formatRupiah } from '../lib/formulas';
import { Calculator, TrendingUp, Calendar, Clock, DollarSign, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../hooks/useSettings';

const SimulasiPage: React.FC = () => {
  const { settings } = useSettings();
  const [harga, setHarga] = useState(1650000);
  const [uangMuka, setUangMuka] = useState(300000);
  
  // Local state for smooth typing without cursor jumps
  const [localHarga, setLocalHarga] = useState(formatRupiah(1650000));
  const [localUangMuka, setLocalUangMuka] = useState(formatRupiah(300000));

  useEffect(() => {
    if (settings) {
      if (settings.simulasi_harga !== undefined) {
        setHarga(settings.simulasi_harga);
        setLocalHarga(formatRupiah(settings.simulasi_harga));
      }
      if (settings.simulasi_dp !== undefined) {
        setUangMuka(settings.simulasi_dp);
        setLocalUangMuka(formatRupiah(settings.simulasi_dp));
      }
    }
  }, [settings]);

  const pendanaan = useMemo(() => Math.max(0, harga - uangMuka), [harga, uangMuka]);

  // Configurations from Image 3
  const weeklyTenors = [
    { label: '8 Minggu', masa: '(8X)', interest: 0.30, tenor: 8 },
    { label: '10 Minggu', masa: '(10X)', interest: 0.32, tenor: 10 },
    { label: '12 Minggu', masa: '(12X)', interest: 0.34, tenor: 12 },
    { label: '15 Minggu', masa: '(15X)', interest: 0.35, tenor: 15 },
  ];

  const monthlyTenors = [
    { label: '4 Bulan', masa: '(4X)', interest: 0.35, tenor: 4 },
    { label: '5 Bulan', masa: '(5X)', interest: 0.36, tenor: 5 },
    { label: '6 Bulan', masa: '(6X)', interest: 0.38, tenor: 6 },
    { label: '10 Bulan', masa: '(10X)', interest: 0.40, tenor: 10 },
  ];

  const calculateCicilan = (principal: number, interest: number, tenor: number) => {
    const total = principal + (principal * interest);
    return Math.round(total / tenor);
  };

  const calculateTotal = (principal: number, interest: number) => {
    return Math.round(principal + (principal * interest));
  };

  const calculateProfit = (principal: number, interest: number) => {
    return Math.round(principal * interest);
  };

  const handleChangeHarga = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw) || 0;
    setLocalHarga(formatRupiah(num));
    setHarga(num);
  };

  const handleChangeDP = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw) || 0;
    setLocalUangMuka(formatRupiah(num));
    setUangMuka(num);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary dark:text-sky-400">Simulasi Mitra Finance 99</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
      </header>

      {/* Inputs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] border-2 border-primary/10 dark:border-white/5 space-y-4 group">
           <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Barang</label>
           </div>
           <input 
              type="text" 
              value={localHarga} 
              onChange={e => handleChangeHarga(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-primary dark:text-white outline-none focus:text-accent transition-colors"
           />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contoh: 1.500.000</p>
        </div>
        <div className="glass p-8 rounded-[40px] border-2 border-primary/10 dark:border-white/5 space-y-4 group">
           <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-accent" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uang Muka (DP)</label>
           </div>
           <input 
              type="text" 
              value={localUangMuka} 
              onChange={e => handleChangeDP(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-primary dark:text-white outline-none focus:text-accent transition-colors"
           />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DP awal transaksi</p>
        </div>
        <div className="glass p-8 rounded-[40px] bg-primary text-white space-y-4 shadow-xl shadow-primary/20">
           <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <label className="text-xs font-black text-white/50 uppercase tracking-widest">Total Pendanaan</label>
           </div>
           <h3 className="text-3xl font-black">{formatRupiah(pendanaan)}</h3>
           <p className="text-xs font-bold text-white/40">Hasil: Harga - Uang Muka</p>
        </div>
      </section>

      {/* Weekly Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <section className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
              <Calendar className="w-6 h-6 text-accent" />
              SIMULASI MINGGUAN (8X - 15X)
            </h3>
            <div className="glass rounded-[40px] overflow-hidden overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-gray-50/50 dark:bg-white/5">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Tenor</th>
                      <th className="px-6 py-4">Interest</th>
                      <th className="px-6 py-4 text-accent">Cicilan/MGU</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {weeklyTenors.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-all font-bold">
                        <td className="px-6 py-5 text-gray-900 dark:text-white text-xs">{t.label} <span className="text-[9px] text-gray-400 font-bold ml-1">{t.masa}</span></td>
                        <td className="px-6 py-5 text-primary dark:text-sky-400 text-xs">{(t.interest * 100)}%</td>
                        <td className="px-6 py-5 text-accent text-base font-black">{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</td>
                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(calculateTotal(pendanaan, t.interest))}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </section>

         <section className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
              <Clock className="w-6 h-6 text-accent" />
              SIMULASI BULANAN (4X - 10X)
            </h3>
            <div className="glass rounded-[40px] overflow-hidden overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-gray-50/50 dark:bg-white/5">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Tenor</th>
                      <th className="px-6 py-4">Interest</th>
                      <th className="px-6 py-4 text-accent">Cicilan/Bulan</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {monthlyTenors.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-all font-bold">
                        <td className="px-6 py-5 text-gray-900 dark:text-white text-xs">{t.label} <span className="text-[9px] text-gray-400 font-bold ml-1">{t.masa}</span></td>
                        <td className="px-6 py-5 text-primary dark:text-sky-400 text-xs">{(t.interest * 100)}%</td>
                        <td className="px-6 py-5 text-accent text-base font-black">{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</td>
                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(calculateTotal(pendanaan, t.interest))}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </section>
      </div>

      {/* Profit Analysis */}
      <section className="space-y-6">
         <h3 className="text-xl font-black flex items-center gap-2 text-primary dark:text-sky-400">
            <TrendingUp className="w-6 h-6 text-accent" />
            ANALISIS KEUNTUNGAN (PROFIT)
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[40px] space-y-6">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-white/5 pb-4">Profit Mingguan</h4>
               <div className="space-y-4">
                  {weeklyTenors.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t.label}</p>
                          <p className="font-bold text-gray-700 dark:text-white">{formatRupiah(calculateProfit(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-success uppercase">Per Cicilan</p>
                          <p className="font-black text-primary dark:text-sky-400">{formatRupiah(calculateProfit(pendanaan, t.interest) / t.tenor)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="glass p-8 rounded-[40px] space-y-6">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-white/5 pb-4">Profit Bulanan</h4>
               <div className="space-y-4">
                  {monthlyTenors.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t.label}</p>
                          <p className="font-bold text-gray-700 dark:text-white">{formatRupiah(calculateProfit(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-success uppercase">Per Cicilan</p>
                          <p className="font-black text-primary dark:text-sky-400">{formatRupiah(calculateProfit(pendanaan, t.interest) / t.tenor)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default SimulasiPage;
