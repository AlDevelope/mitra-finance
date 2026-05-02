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
import { KosanRecord } from '../types';
import { formatRupiah, parseExcelValue } from '../lib/formulas';
import { Plus, Trash2, TrendingUp, Wallet, Home, Download, Edit2, Check, X as XIcon } from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';

const KosankuPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<KosanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ bulan: '', masuk: 0, keluar: 0, keterangan: '' });
  const [localMasuk, setLocalMasuk] = useState('0');
  const [localKeluar, setLocalKeluar] = useState('0');
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [newModalVal, setNewModalVal] = useState(settings?.kosan_modal?.toString() || '15000000');

  useEffect(() => {
    const q = query(collection(db, 'kosanku'), orderBy('created_at', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let runningTotal = 0;
      const data = snap.docs.map(doc => {
        const d = doc.data();
        runningTotal += (Number(d.masuk) || 0) - (Number(d.keluar) || 0);
        return { id: doc.id, ...d, jumlah: runningTotal } as KosanRecord;
      });
      setRecords(data);
      setLoading(false);
    }, (err) => {
      console.error("Kosan load error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateModal = async () => {
    if (!settings) return;
    const ok = await updateSettings({ ...settings, kosan_modal: Number(newModalVal) });
    if (ok) setIsEditingModal(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'kosanku'), {
        ...form,
        masuk: Number(form.masuk),
        keluar: Number(form.keluar),
        created_at: serverTimestamp()
      });
      setShowAdd(false);
      setForm({ bulan: '', masuk: 0, keluar: 0, keterangan: '' });
      setLocalMasuk('0');
      setLocalKeluar('0');
    } catch (err) {
      alert('Gagal menambah data');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus record ini?')) {
      await deleteDoc(doc(db, 'kosanku', id));
    }
  };

  const [isImporting, setImporting] = useState(false);

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames.find(n => n.toLowerCase().includes('kosan')) || 
                       wb.SheetNames.find(n => n.toLowerCase().includes('pemasukan')) || 
                       wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Use range: 1 to start from Row 2 (the header row in screenshot)
        const data = XLSX.utils.sheet_to_json(ws, { range: 1 });

        let count = 0;
        for (const row of data as any[]) {
          const bulan = row.Bulan || row.bulan || row.Month || '';
          
          // Skip summary rows or empty rows
          if (!bulan || String(bulan).toLowerCase().includes('jumlah') || String(bulan).toLowerCase().includes('modal') || String(bulan).toLowerCase().includes('sisa')) {
            continue;
          }

          const masuk = parseExcelValue(row.Masuk || row.masuk || row['Uang Masuk'] || 0);
          const keluar = parseExcelValue(row.Keluar || row.keluar || row['Uang Keluar'] || 0);
          const keterangan = row.Keterangan || row.keterangan || row.Ket || 'Import';

          await addDoc(collection(db, 'kosanku'), {
            bulan: String(bulan),
            masuk,
            keluar,
            keterangan: String(keterangan),
            created_at: serverTimestamp()
          });
          count++;
        }
        alert(`Berhasil impor ${count} data kosanku`);
      } catch (err: any) {
        console.error('Import Error:', err);
        alert('Gagal mengimpor file kosan: ' + err.message);
      } finally {
        setImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const totals = useMemo(() => {
    const terkumpul = records.reduce((acc, curr) => acc + (curr.masuk || 0), 0);
    const pengeluaran = records.reduce((acc, curr) => acc + (curr.keluar || 0), 0);
    const modalRenov = settings?.kosan_modal || 15000000;
    return { terkumpul, pengeluaran, modalRenov, sisa: modalRenov - terkumpul + pengeluaran };
  }, [records, settings?.kosan_modal]);

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold">Memuat data kosan...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Keterangan Uang Kosan</h2>
          <p className="text-gray-500 font-medium italic">"Berkembang, Bertumbuh, Berinovasi"</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-600 rounded-[24px] font-bold text-sm cursor-pointer hover:bg-gray-50 transition-all">
            <Download className="w-5 h-5" /> Import XLSX
            <input type="file" hidden onChange={importExcel} accept=".xlsx, .xls" />
          </label>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-[24px] font-bold text-sm shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" /> Tambah Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] bg-green-500 text-white relative overflow-hidden shadow-xl shadow-green-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <TrendingUp className="w-6 h-6 mb-4 text-white/50" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pemasukan Terkumpul</p>
          <h3 className="text-2xl font-black mt-1">{formatRupiah(totals.terkumpul)}</h3>
        </div>
        <div className="glass p-8 rounded-[40px] bg-sky-500 text-white relative overflow-hidden shadow-xl shadow-sky-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="flex justify-between items-start mb-4">
            <Home className="w-6 h-6 text-white/50" />
            {isAdmin && (
              <button 
                onClick={() => { setIsEditingModal(true); setNewModalVal(totals.modalRenov.toString()); }}
                className="p-1 hover:bg-white/20 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Modal Renovasi</p>
          {isEditingModal ? (
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                value={formatRupiah(Number(newModalVal) || 0)}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setNewModalVal(raw);
                }}
                className="bg-white/10 border-none outline-none text-white font-bold p-1 rounded w-full"
                autoFocus
              />
              <button onClick={handleUpdateModal} className="p-1 bg-white/20 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setIsEditingModal(false)} className="p-1 bg-white/20 rounded"><XIcon className="w-4 h-4" /></button>
            </div>
          ) : (
            <h3 className="text-2xl font-black mt-1">{formatRupiah(totals.modalRenov)}</h3>
          )}
        </div>
        <div className="glass p-8 rounded-[40px] bg-accent text-white relative overflow-hidden shadow-xl shadow-accent/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <Wallet className="w-6 h-6 mb-4 text-white/50" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Sisa Belum Kembali</p>
          <h3 className="text-2xl font-black mt-1">{formatRupiah(totals.sisa)}</h3>
        </div>
      </div>

      {showAdd && (
        <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-[40px] border-2 border-primary/10">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Bulan</label>
              <input type="text" required value={form.bulan} onChange={e => setForm({...form, bulan: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" placeholder="Contoh: Januari" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Keluar</label>
              <input 
                type="text" 
                required 
                value={localKeluar} 
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  const num = parseInt(raw) || 0;
                  setLocalKeluar(formatRupiah(num));
                  setForm({...form, keluar: num});
                }} 
                className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Masuk</label>
              <input 
                type="text" 
                required 
                value={localMasuk} 
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  const num = parseInt(raw) || 0;
                  setLocalMasuk(formatRupiah(num));
                  setForm({...form, masuk: num});
                }} 
                className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl outline-none font-medium" 
              />
            </div>
            <button type="submit" className="bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20">Simpan Data</button>
          </form>
        </motion.section>
      )}

      <div className="glass rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-8 py-5">Bulan</th>
                <th className="px-8 py-5">Keluar</th>
                <th className="px-8 py-5">Masuk</th>
                <th className="px-8 py-5">Jumlah</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-gray-900">{r.bulan}</td>
                  <td className="px-8 py-6 font-bold text-danger">{formatRupiah(r.keluar)}</td>
                  <td className="px-8 py-6 font-bold text-success">{formatRupiah(r.masuk)}</td>
                  <td className="px-8 py-6 font-black text-primary">{formatRupiah(r.jumlah)}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-300 hover:text-danger hover:bg-danger/5 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium italic">Belum ada data kosan tercatat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KosankuPage;
