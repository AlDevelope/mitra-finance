import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, User, Package, Wallet, Calendar, MessageCircle, FileText, Save } from 'lucide-react';
import { NasabahStatus, NotificationType } from '../types';
import { formatRupiah } from '../lib/formulas';
import { logNotification } from '../lib/notifications';

const AddNasabah: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    barang: '',
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 0,
    whatsapp_number: '',
    catatan: ''
  });

  const formatDisplay = (val: number) => {
    if (!val) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const handleCurrencyChange = (key: string, value: string) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue) || 0;
    setForm({ ...form, [key]: numValue });
  };

  const totalHutang = (form.uang_muka || 0) + (form.jumlah_angsuran * (form.rp_per_angsuran || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'nasabah'), {
        ...form,
        satuan: 'Minggu',
        total_hutang: totalHutang,
        angsuran_terbayar: 0,
        sisa_angsuran: form.jumlah_angsuran,
        sisa_hutang: form.jumlah_angsuran * form.rp_per_angsuran,
        progress_persen: 0,
        status: NasabahStatus.AKTIF,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      await logNotification(
        'Nasabah Baru Terdaftar',
        `Berhasil mendaftarkan nasabah ${form.nama} untuk ${form.barang} dengan tenor ${form.jumlah_angsuran} minggu.`,
        NotificationType.SUCCESS
      );

      navigate(`/nasabah/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('Gagal menambah nasabah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <header className="flex items-center gap-4">
        <Link to="/nasabah" className="w-10 h-10 glass flex items-center justify-center rounded-xl hover:bg-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nasabah Baru</h2>
          <p className="text-gray-500">Daftarkan unit angsuran digital baru</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="glass p-8 rounded-[40px] space-y-6">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
             <User className="w-5 h-5 text-accent" />
             Identitas & Barang
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Nama Lengkap Nasabah</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" required placeholder="Contoh: Budi Santoso"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                    value={form.nama}
                    onChange={(e) => setForm({...form, nama: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Barang Yang Dicicil</label>
                <div className="relative group">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" required placeholder="Contoh: HP Samsung A54"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                    value={form.barang}
                    onChange={(e) => setForm({...form, barang: e.target.value})}
                  />
                </div>
              </div>
           </div>
        </section>

        <section className="glass p-8 rounded-[40px] space-y-6">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
             <Wallet className="w-5 h-5 text-accent" />
             Skema Angsuran
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Uang Muka (Down Payment)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                  <input 
                    type="text" required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                    value={formatDisplay(form.uang_muka)}
                    onChange={(e) => handleCurrencyChange('uang_muka', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Jumlah Angsuran (Minggu)</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="number" required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                    value={form.jumlah_angsuran}
                    onChange={(e) => setForm({...form, jumlah_angsuran: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Rp per Angsuran</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                  <input 
                    type="text" required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                    value={formatDisplay(form.rp_per_angsuran)}
                    onChange={(e) => handleCurrencyChange('rp_per_angsuran', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Nomor WhatsApp</label>
                <div className="relative group">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" placeholder="62812345678"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({...form, whatsapp_number: e.target.value})}
                  />
                </div>
              </div>
           </div>

           <div className="p-6 bg-primary/5 rounded-[30px] border border-primary/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Hutang Nasabah</p>
                <h4 className="text-2xl font-bold text-primary">{formatRupiah(totalHutang)}</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tagihan Mingguan</p>
                <h4 className="text-lg font-bold text-gray-700">{formatRupiah(form.rp_per_angsuran)}</h4>
              </div>
           </div>
        </section>

        <section className="glass p-8 rounded-[40px] space-y-6">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
             <FileText className="w-5 h-5 text-accent" />
             Catatan Tambahan
           </h3>
           <textarea 
            placeholder="Informasi penting lainnya..."
            className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium resize-none h-32"
            value={form.catatan}
            onChange={(e) => setForm({...form, catatan: e.target.value})}
           />
        </section>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white py-5 rounded-[24px] font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-primary-light transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Daftarkan...' : <><Save className="w-6 h-6" /> Daftarkan Nasabah</>}
        </button>
      </form>
    </div>
  );
};

export default AddNasabah;
