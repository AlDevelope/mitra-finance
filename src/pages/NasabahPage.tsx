import React, { useState } from 'react';
import { useNasabah } from '../hooks/useNasabah';
import { formatRupiah } from '../lib/formulas';
import { Search, Plus, Grid, List as ListIcon, MessageCircle, Share2, Eye, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';
import { NasabahStatus } from '../types';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

export const NasabahPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: nasabahList, loading } = useNasabah();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  const filteredList = nasabahList.filter(n => {
    const matchesSearch = n.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.barang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'SEMUA' || n.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const exportData = filteredList.map(n => ({
      'Nama': n.nama,
      'Sudah di terima': n.barang,
      'Uang Muka': n.uang_muka,
      'Jumlah Angsuran': n.jumlah_angsuran,
      'Rp per Angsuran': n.rp_per_angsuran,
      'Angsuran Terbayar': n.angsuran_terbayar,
      'Sisa Angsuran': n.sisa_angsuran,
      'Sisa Hutang': n.sisa_hutang,
      'WhatsApp': n.whatsapp_number,
      'Status': n.status,
      'Catatan': n.catatan
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nasabah');
    XLSX.writeFile(wb, `Data_Nasabah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div>Loading data nasabah...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daftar Nasabah</h2>
          <p className="text-gray-500">Kelola unit angsuran dan pembayaran</p>
        </div>
        <div className="flex items-center gap-3">
           {isAdmin && (
             <>
               <Link to="/nasabah/tambah" className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-light transition-all shadow-lg hover:shadow-primary/20">
                 <Plus className="w-5 h-5" />
                 Tambah Nasabah
               </Link>
               <Link to="/import" className="bg-white text-primary border border-gray-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                 <FileSpreadsheet className="w-5 h-5" />
                 Import Excel
               </Link>
               <button 
                 onClick={handleExport}
                 className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
               >
                 <Download className="w-5 h-5" />
                 Export Excel
               </button>
             </>
           )}
        </div>
      </header>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama nasabah atau barang..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          {['SEMUA', 'AKTIF', 'LUNAS', 'MENUNGGAK'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                filterStatus === s ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <button 
            onClick={() => setView('grid')}
            className={cn("p-2 rounded-lg transition-all", view === 'grid' ? "bg-white text-primary shadow-sm" : "text-gray-400")}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn("p-2 rounded-lg transition-all", view === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-400")}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((nasabah, i) => (
            <motion.div
              key={nasabah.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-3xl group hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                  {nasabah.nama.charAt(0)}
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase",
                  nasabah.status === NasabahStatus.LUNAS ? "bg-success/10 text-success" :
                  nasabah.status === NasabahStatus.MENUNGGAK ? "bg-danger/10 text-danger" :
                  "bg-primary/10 text-primary"
                )}>
                  {nasabah.status}
                </div>
              </div>
              
              <h3 className="font-bold text-xl mb-1 truncate">{nasabah.nama}</h3>
              <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {nasabah.barang}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-gray-400">Progress Pembayaran</span>
                    <span className="text-primary">{nasabah.progress_persen}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${nasabah.progress_persen}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Minggu</p>
                    <p className="font-bold text-gray-700">{nasabah.sisa_angsuran} <span className="text-[10px] text-gray-400">Minggu</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Hutang</p>
                    <p className="font-bold text-danger">{formatRupiah(nasabah.sisa_hutang)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/nasabah/${nasabah.id}`} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-light transition-all">
                    <Eye className="w-4 h-4" /> Detail
                  </Link>
                  <a href={`https://wa.me/${nasabah.whatsapp_number}`} className="w-12 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <button className="w-12 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nama / Barang</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Angsuran / Sisa</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sisa Hutang</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.map((nasabah) => (
                <tr key={nasabah.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-bold text-primary text-xs">
                        {nasabah.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{nasabah.nama}</p>
                        <p className="text-xs text-gray-400 italic">{nasabah.barang}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold",
                      nasabah.status === NasabahStatus.LUNAS ? "bg-success/10 text-success" :
                      "bg-primary/10 text-primary"
                    )}>
                      {nasabah.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold">{nasabah.angsuran_terbayar} / {nasabah.jumlah_angsuran}</p>
                    <p className="text-[10px] text-gray-400">Sisa {nasabah.sisa_angsuran} minggu</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-danger">{formatRupiah(nasabah.sisa_hutang)}</td>
                  <td className="px-6 py-5">
                    <div className="w-24">
                       <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-primary">{nasabah.progress_persen}%</span>
                       </div>
                       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${nasabah.progress_persen}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Link to={`/nasabah/${nasabah.id}`} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all">
                         <Eye className="w-4 h-4" />
                       </Link>
                       <a href={`https://wa.me/${nasabah.whatsapp_number}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all">
                         <MessageCircle className="w-4 h-4" />
                       </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
