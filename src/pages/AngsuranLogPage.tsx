import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AngsuranLog, NotificationType } from '../types';
import { formatRupiah, formatDisplayDate, parseExcelValue, parseExcelDate } from '../lib/formulas';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Banknote, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { logNotification } from '../lib/notifications';

const AngsuranLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AngsuranLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', masuk: 0, keluar: 0 });
  const [localMasuk, setLocalMasuk] = useState('0');
  const [localKeluar, setLocalKeluar] = useState('0');

  useEffect(() => {
    const q = query(collection(db, 'angsuran_logs'), orderBy('tanggal', 'asc'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let runningTotal = 0;
      const data = snap.docs.map(doc => {
        const d = doc.data();
        runningTotal += (Number(d.masuk) || 0) - (Number(d.keluar) || 0);
        return { id: doc.id, ...d, total: runningTotal } as AngsuranLog;
      });
      setLogs([...data].reverse());
      setLoading(false);
    }, (error) => {
      console.error("Error loading logs:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totals = useMemo(() => {
    const masuk = logs.reduce((acc, curr) => acc + (Number(curr.masuk) || 0), 0);
    const keluar = logs.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [logs]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        masuk: Number(form.masuk),
        keluar: Number(form.keluar),
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, 'angsuran_logs'), data);
      
      // Log Notification
      const type = data.masuk > 0 ? 'Pemasukan' : 'Pengeluaran';
      const amount = data.masuk > 0 ? data.masuk : data.keluar;
      await logNotification(
        `Catat ${type} Baru`,
        `Berhasil mencatat ${type.toLowerCase()} sebesar ${formatRupiah(amount)}: ${data.keterangan}`,
        data.masuk > 0 ? NotificationType.SUCCESS : NotificationType.WARNING
      );

      setShowAdd(false);
      setForm({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', masuk: 0, keluar: 0 });
      setLocalMasuk('0');
      setLocalKeluar('0');
    } catch (err) {
      alert('Gagal menambah log');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus log ini?')) {
      const logToDelete = logs.find(l => l.id === id);
      await deleteDoc(doc(db, 'angsuran_logs', id));
      
      if (logToDelete) {
        await logNotification(
          'Log Keuangan Dihapus',
          `Menghapus catatan keuangan: ${logToDelete.keterangan}`,
          NotificationType.ERROR
        );
      }
    }
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames.find(n => n.toLowerCase().includes('angsuran')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays to handle snaked layout manually
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        let count = 0;
        // The screenshot shows data starts from row 4 (index 3)
        // Group 1: Cols B(1), C(2), D(3), E(4)
        // Group 2: Cols H(7), I(8), J(9), K(10)
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;

          // Helper to check if a cell looks like a "Date" header
          const isHeader = (cell: any) => {
            if (!cell) return false;
            const s = String(cell).toUpperCase();
            return s.includes('TGL') || s.includes('TANGGAL') || s.includes('NO');
          };

          const isTitle = (cell: any) => {
            if (!cell) return false;
            return String(cell).includes('Keterangan Keuangan') || String(cell).includes('Multi Kredit');
          };

          // Parse Group 1 (B, C, D, E)
          if (row[1] && !isHeader(row[1]) && !isTitle(row[1])) {
            const tanggal = parseExcelDate(row[1]);
            const keterangan = row[2] || '';
            const masuk = parseExcelValue(row[3]);
            const keluar = parseExcelValue(row[4]);
            
            // Validate it's actually a data row (has either income/expense OR a valid date string with /)
            const hasAmount = masuk > 0 || keluar > 0;
            const hasDesc = String(keterangan).trim().length > 0;

            if (hasDesc && hasAmount) {
              await addDoc(collection(db, 'angsuran_logs'), {
                tanggal,
                keterangan: String(keterangan),
                masuk,
                keluar,
                created_at: serverTimestamp()
              });
              count++;
            }
          }

          // Parse Group 2 (H, I, J, K)
          if (row[7] && !isHeader(row[7]) && !isTitle(row[7])) {
            const tanggal = parseExcelDate(row[7]);
            const keterangan = row[8] || '';
            const masuk = parseExcelValue(row[9]);
            const keluar = parseExcelValue(row[10]);

            const hasAmount = masuk > 0 || keluar > 0;
            const hasDesc = String(keterangan).trim().length > 0;

            if (hasDesc && hasAmount) {
              await addDoc(collection(db, 'angsuran_logs'), {
                tanggal,
                keterangan: String(keterangan),
                masuk,
                keluar,
                created_at: serverTimestamp()
              });
              count++;
            }
          }
        }
        
        alert(`Berhasil impor ${count} data angsuran`);
      } catch (err: any) {
        console.error('Import Error:', err);
        alert('Gagal mengimpor file: ' + err.message);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold">Memuat histori log...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Keterangan Angsuran</h2>
          <p className="text-gray-500 font-medium italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold text-sm cursor-pointer hover:bg-gray-50 transition-all">
            <Download className="w-5 h-5" /> Import Angsuran
            <input type="file" hidden onChange={importExcel} accept=".xlsx, .xls" />
          </label>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-[24px] font-bold text-sm shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" /> Catat Log Baru
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="glass p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-green-500 text-white relative overflow-hidden shadow-lg shadow-green-500/10">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full -mr-4 -mt-4 md:-mr-8 md:-mt-8" />
          <TrendingUp className="w-4 h-4 md:w-6 md:h-6 mb-2 md:mb-4 text-white/50" />
          <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/70">Total Masuk</p>
          <h3 className="text-sm md:text-2xl font-black mt-1 leading-none">{formatRupiah(totals.masuk)}</h3>
        </div>
        <div className="glass p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-red-500 text-white relative overflow-hidden shadow-lg shadow-red-500/10">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full -mr-4 -mt-4 md:-mr-8 md:-mt-8" />
          <TrendingDown className="w-4 h-4 md:w-6 md:h-6 mb-2 md:mb-4 text-white/50" />
          <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/70">Total Keluar</p>
          <h3 className="text-sm md:text-2xl font-black mt-1 leading-none">{formatRupiah(totals.keluar)}</h3>
        </div>
        <div className="glass p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-primary text-white relative overflow-hidden shadow-lg shadow-primary/10 col-span-2 md:col-span-1">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full -mr-4 -mt-4 md:-mr-8 md:-mt-8" />
          <Wallet className="w-4 h-4 md:w-6 md:h-6 mb-2 md:mb-4 text-white/50" />
          <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/70">Sisa Saldo</p>
          <h3 className="text-sm md:text-2xl lg:text-3xl font-black mt-1 leading-none">{formatRupiah(totals.saldo)}</h3>
        </div>
      </div>

      {showAdd && (
        <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-[40px] border-2 border-accent/10">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tanggal</label>
              <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" />
            </div>
            <div className="md:col-span-1 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Keterangan</label>
              <input type="text" required value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" placeholder="Cicilan ke-X Nama..." />
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-1">
               <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Masuk</label>
                <input 
                  type="text" 
                  value={localMasuk} 
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(raw) || 0;
                    setLocalMasuk(formatRupiah(num));
                    setForm({...form, masuk: num});
                  }} 
                  className="w-full px-3 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Keluar</label>
                <input 
                  type="text" 
                  value={localKeluar} 
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(raw) || 0;
                    setLocalKeluar(formatRupiah(num));
                    setForm({...form, keluar: num});
                  }} 
                  className="w-full px-3 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" 
                />
              </div>
            </div>
            <button type="submit" className="bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20">Simpan Log</button>
          </form>
        </motion.section>
      )}

      <div className="glass rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-slate-800/50 border-b dark:border-white/5">
                <th className="px-6 py-5">Tgl No</th>
                <th className="px-6 py-5">Keterangan</th>
                <th className="px-6 py-5">Masuk</th>
                <th className="px-6 py-5">Keluar</th>
                <th className="px-6 py-5">Total</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${l.masuk > 0 ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {l.masuk > 0 ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">{formatDisplayDate(l.tanggal)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium text-gray-900 dark:text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{l.keterangan}</td>
                  <td className="px-6 py-5 font-bold text-success text-xs">{l.masuk > 0 ? formatRupiah(l.masuk) : '-'}</td>
                  <td className="px-6 py-5 font-bold text-danger text-xs">{l.keluar > 0 ? formatRupiah(l.keluar) : '-'}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Balance</span>
                       <span className="font-black text-primary dark:text-sky-400 text-base leading-tight">{formatRupiah(l.total)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => handleDelete(l.id)} className="p-2 text-gray-300 hover:text-danger hover:bg-danger/5 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                     <div className="flex flex-col items-center gap-3">
                        <Banknote className="w-12 h-12 opacity-20" />
                        <p>Belum ada histori log keuangan tercatat</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AngsuranLogPage;
