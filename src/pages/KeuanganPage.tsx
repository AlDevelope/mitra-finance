import React, { useState, useEffect, useMemo } from 'react';
import { useKeuangan } from '../hooks/useKeuangan';
import { useNasabah } from '../hooks/useNasabah';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRupiah } from '../lib/formulas';
import { 
  Save, 
  RefreshCcw, 
  Landmark, 
  Wallet, 
  Map as MapIcon, 
  TrendingUp, 
  Hammer,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const KeuanganPage: React.FC = () => {
  const { data: keuangan, loading: loadingKeuangan, error: errorKeuangan } = useKeuangan();
  const { data: nasabahList, loading: loadingNasabah } = useNasabah();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calculate total debt from all customers
  const totalSisaHutangNasabah = useMemo(() => {
    if (!nasabahList) return 0;
    return nasabahList.reduce((acc, curr) => acc + (curr.sisa_hutang || 0), 0);
  }, [nasabahList]);

  useEffect(() => {
    if (keuangan) {
      setForm({ ...keuangan });
    }
  }, [keuangan]);

  // Handle automatic updates for restricted fields
  useEffect(() => {
    if (form) {
      const newUangDipinjamkan = 
        (form.uang_tanah_lama || 0) + 
        (form.uang_tanah_baru || 0) + 
        (form.uang_stokbit || 0) + 
        (form.uang_renov || 0);
      
      const newTotalKeuntungan = 
        (totalSisaHutangNasabah || 0) + 
        (form.uang_bank_neo || 0) + 
        (newUangDipinjamkan || 0);

      if (
        form.uang_dipinjamkan !== newUangDipinjamkan || 
        form.uang_nasabah !== totalSisaHutangNasabah ||
        form.total_keuntungan !== newTotalKeuntungan
      ) {
        setForm((prev: any) => ({
          ...prev,
          uang_dipinjamkan: newUangDipinjamkan,
          uang_nasabah: totalSisaHutangNasabah,
          total_keuntungan: newTotalKeuntungan
        }));
      }
    }
  }, [
    form?.uang_tanah_lama, 
    form?.uang_tanah_baru, 
    form?.uang_stokbit, 
    form?.uang_renov, 
    form?.uang_bank_neo,
    totalSisaHutangNasabah
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'keuangan', 'summary'), {
        ...form,
        updated_at: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui data keuangan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setForm((prev: any) => ({ ...prev, [key]: num }));
  };

  if (loadingKeuangan || loadingNasabah) return <div className="p-8 text-center text-gray-400 font-bold">Memuat data keuangan...</div>;
  if (errorKeuangan) return <div className="p-8 text-center text-danger font-bold">Error: {errorKeuangan}</div>;
  if (!form) return <div className="p-8 text-center text-gray-400 font-bold">Menyiapkan data...</div>;

  const fields = [
    { key: 'uang_nasabah', label: 'Uang Yang Ada (Nasabah)', icon: Landmark, readonly: true },
    { key: 'uang_bank_neo', label: 'Uang Yang Ada (Bank Neo)', icon: Landmark },
    { key: 'uang_dipinjamkan', label: 'Uang Yang Dipinjamkan', icon: DollarSign, readonly: true },
    { key: 'uang_cash', label: 'Uang Cash', icon: Wallet },
    { key: 'total_keuntungan', label: 'Total Keuntungan', icon: TrendingUp, readonly: true },
    { key: 'uang_tanah_lama', label: 'Uang Tanah Lama', icon: MapIcon },
    { key: 'uang_tanah_baru', label: 'Uang Tanah Baru', icon: MapIcon },
    { key: 'uang_stokbit', label: 'Uang Stokbit (M3110)', icon: TrendingUp },
    { key: 'uang_renov', label: 'Uang Renov', icon: Hammer },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Keuangan</h2>
          <p className="text-gray-500 mt-1">Perbarui angka ringkasan keuangan dashboard</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.key} className="glass p-8 rounded-[40px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                <field.icon className="w-6 h-6" />
              </div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{field.label}</label>
            </div>
            <div className="relative">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
               <input 
                type="text" 
                readOnly={field.readonly}
                className={cn(
                  "w-full pl-14 pr-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-xl font-bold text-primary",
                  field.readonly ? "bg-gray-100 opacity-80 cursor-not-allowed" : "bg-gray-50"
                )}
                value={form[field.key].toLocaleString('id-ID')}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic">Format: {formatRupiah(form[field.key])}</p>
          </div>
        ))}

        <div className="md:col-span-2 flex justify-end pt-4">
           <button 
            type="submit" 
            disabled={saving}
            className="bg-primary text-white px-10 py-5 rounded-[24px] font-bold shadow-xl shadow-primary/20 flex items-center gap-3 hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {success ? 'Berhasil Disimpan!' : 'Simpan Seluruh Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
