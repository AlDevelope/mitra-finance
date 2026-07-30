import React, { useState, useEffect, useMemo } from 'react';
import { useKeuangan } from '../hooks/useKeuangan';
import { useNasabah } from '../hooks/useNasabah';
import { useSettings } from '../hooks/useSettings';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRupiah } from '../lib/formulas';
import { 
  Wallet, 
  Users, 
  Landmark, 
  TrendingUp, 
  Map as MapIcon, 
  Hammer, 
  Save, 
  Plus, 
  Trash2, 
  Building2,
  X,
  RotateCcw,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function KeuanganPage() {
  const { data: keuangan, loading: loadingKeuangan, error: errorKeuangan } = useKeuangan();
  const { data: nasabahList, loading: loadingNasabah } = useNasabah();
  const { settings, updateSettings } = useSettings();

  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

  // 1. Hitung total sisa hutang nasabah secara otomatis
  const totalSisaHutangNasabah = useMemo(() => {
    if (!nasabahList) return 0;
    return nasabahList.reduce((acc, curr) => acc + (curr.sisa_pinjaman || 0), 0);
  }, [nasabahList]);

  // 2. Inisialisasi data form pertama kali saat data keuangan dimuat
  useEffect(() => {
    if (keuangan && !form) {
      setForm({ 
        uang_cash: Number(keuangan.uang_cash || 0),
        uang_tanah_lama: Number(keuangan.uang_tanah_lama || 0),
        uang_tanah_baru: Number(keuangan.uang_tanah_baru || 0),
        uang_stokbit: Number(keuangan.uang_stokbit || 0),
        uang_renov: Number(keuangan.uang_renov ?? 6000000),
        uang_renov_lama: Number(keuangan.uang_renov_lama ?? 0),
        ...keuangan
      });
    }
  }, [keuangan, form]);

  // 3. Kotakan hijau dijumlahkan hasilnya masuk ke Kotakan Merah (Uang Dipinjamkan)
  const computedDipinjamkan = useMemo(() => {
    if (!form) return 0;
    const tanahLama = Number(form.uang_tanah_lama || 0);
    const tanahBaru = Number(form.uang_tanah_baru || 0);
    const stokbit = Number(form.uang_stokbit || 0);
    const renovBaru = Number(form.uang_renov || 0);
    const renovLama = Number(form.uang_renov_lama || 0);

    const customSum = (settings?.custom_categories || []).reduce((acc, cat) => {
      return acc + Number(form[cat.id] || 0);
    }, 0);

    return tanahLama + tanahBaru + stokbit + renovBaru + renovLama + customSum;
  }, [form, settings?.custom_categories]);

  // 4. Uang Bank Neo = Uang Cash - Uang Dipinjamkan
  const computedBankNeo = useMemo(() => {
    if (!form) return 0;
    const cash = Number(form.uang_cash || 0);
    return cash - computedDipinjamkan;
  }, [form, computedDipinjamkan]);

  // 5. Total Untung = Uang Nasabah + Uang Cash
  const computedTotalUntung = useMemo(() => {
    if (!form) return 0;
    const cash = Number(form.uang_cash || 0);
    return totalSisaHutangNasabah + cash;
  }, [form, totalSisaHutangNasabah]);

  const handleResetData = async () => {
    setSaving(true);
    try {
      const resetForm = { ...form };
      const readonlyKeys = ['uang_nasabah', 'uang_bank_neo', 'uang_dipinjamkan', 'total_keuntungan'];
      Object.keys(resetForm).forEach(key => {
        if (typeof resetForm[key] === 'number' && !readonlyKeys.includes(key)) {
          resetForm[key] = 0;
        }
      });
      setForm(resetForm);
      await handleSave(resetForm);
      setShowDeleteAllModal(false);
      alert('Data keuangan berhasil direset.');
    } catch (err) {
      console.error(err);
      alert('Gagal mereset data.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (formToSave?: any) => {
    const dataToSave = formToSave || form;
    if (!dataToSave) return;

    setSaving(true);
    setSuccess(false);
    
    try {
      const payload = {
        ...dataToSave,
        uang_nasabah: totalSisaHutangNasabah,
        uang_dipinjamkan: computedDipinjamkan,
        uang_bank_neo: computedBankNeo,
        total_keuntungan: computedTotalUntung,
        uang_cash: Number(dataToSave.uang_cash || 0),
        uang_tanah_lama: Number(dataToSave.uang_tanah_lama || 0),
        uang_tanah_baru: Number(dataToSave.uang_tanah_baru || 0),
        uang_stokbit: Number(dataToSave.uang_stokbit || 0),
        uang_renov: Number(dataToSave.uang_renov || 0),
        uang_renov_lama: Number(dataToSave.uang_renov_lama || 0),
        updated_at: serverTimestamp()
      };

      await updateDoc(doc(db, 'keuangan', 'summary'), payload);
      setForm(payload);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving keuangan:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    const categoryId = `custom_${Date.now()}`;
    const amount = parseInt(newCategoryAmount.replace(/[^0-9]/g, '')) || 0;

    const newCategory = {
      id: categoryId,
      label: newCategoryLabel.trim(),
      amount: amount
    };

    const updatedCustom = [...(settings?.custom_categories || []), newCategory];

    try {
      await updateSettings({
        ...settings,
        custom_categories: updatedCustom
      });

      const updatedForm = {
        ...form,
        [categoryId]: amount
      };

      setForm(updatedForm);
      await handleSave(updatedForm);

      setNewCategoryLabel('');
      setNewCategoryAmount('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menambah kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kotak ini?')) return;

    const updatedCustom = (settings?.custom_categories || []).filter(c => c.id !== id);

    try {
      await updateSettings({
        ...settings,
        custom_categories: updatedCustom
      });

      const updatedForm = { ...form };
      delete updatedForm[id];

      setForm(updatedForm);
      await handleSave(updatedForm);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus kategori.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          const row: any = data[0];
          const importedForm = {
            ...form,
            uang_cash: Number(row['Uang Cash'] || row['uang_cash'] || form.uang_cash),
            uang_tanah_lama: Number(row['Uang Tanah Lama'] || row['uang_tanah_lama'] || form.uang_tanah_lama),
            uang_tanah_baru: Number(row['Uang Tanah Baru'] || row['uang_tanah_baru'] || form.uang_tanah_baru),
            uang_stokbit: Number(row['Uang Stokbit'] || row['uang_stokbit'] || form.uang_stokbit),
            uang_renov: Number(row['Uang Renovasi Baru'] || row['uang_renov'] || form.uang_renov),
            uang_renov_lama: Number(row['Uang Renovasi Lama'] || row['uang_renov_lama'] || form.uang_renov_lama),
          };

          setForm(importedForm);
          await handleSave(importedForm);
          alert('Data berhasil diimpor dari Excel.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan format file benar.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleChange = (key: string, value: string) => {
    const readonlyKeys = ['uang_nasabah', 'uang_bank_neo', 'uang_dipinjamkan', 'total_keuntungan'];
    if (readonlyKeys.includes(key)) return;

    const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setForm((prev: any) => ({
      ...prev,
      [key]: num
    }));
  };

  if (loadingKeuangan || loadingNasabah) return <div className="p-8 text-center text-gray-400 font-bold">Memuat data keuangan...</div>;

  const standardFields = [
    { key: 'uang_cash', label: settings?.category_labels?.uang_cash || 'Uang Cash', icon: Wallet, color: 'emerald', canEdit: true },
    { key: 'uang_nasabah', label: settings?.category_labels?.uang_nasabah || 'Uang Nasabah (Nasabah)', icon: Users, color: 'blue', readonly: true, canEdit: true },
    { key: 'uang_bank_neo', label: settings?.category_labels?.uang_bank_neo || 'Uang Bank Neo', icon: Landmark, color: 'indigo', readonly: true, canEdit: true },
    { key: 'uang_dipinjamkan', label: settings?.category_labels?.uang_dipinjamkan || 'Uang Dipinjamkan', icon: Landmark, color: 'amber', readonly: true, canEdit: true },
    { key: 'total_keuntungan', label: settings?.category_labels?.total_keuntungan || 'Total Untung', icon: TrendingUp, color: 'accent', readonly: true, canEdit: true },
    { key: 'uang_tanah_lama', label: settings?.category_labels?.uang_tanah_lama || 'Uang Tanah Lama', icon: MapIcon, color: 'slate', canEdit: true },
    { key: 'uang_tanah_baru', label: settings?.category_labels?.uang_tanah_baru || 'Uang Tanah Baru', icon: MapIcon, color: 'slate', canEdit: true },
    { key: 'uang_stokbit', label: settings?.category_labels?.uang_stokbit || 'Uang Stokbit', icon: Wallet, color: 'slate', canEdit: true },
    { key: 'uang_renov', label: settings?.category_labels?.uang_renov || 'Uang Renovasi Baru', icon: Hammer, color: 'orange', canEdit: true },
    { key: 'uang_renov_lama', label: settings?.category_labels?.uang_renov_lama || 'Uang Renovasi Lama', icon: Hammer, color: 'slate', canEdit: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Mitra Finance 99
          </h1>
          <p className="text-sm text-blue-400/80 italic mt-1 font-medium">
            "Berkembang, Bertumbuh, Berinovasi"
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-200 font-semibold text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Data
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 rounded-xl transition-all duration-200 font-semibold text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Impor
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 font-semibold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kotak
          </button>
        </div>
      </div>

      {errorKeuangan && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {errorKeuangan}
        </div>
      )}

      {/* Grid Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {standardFields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.key}
              className="relative group bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {field.label}
                </span>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-2">
                <input
                  type="text"
                  readOnly={field.readonly}
                  value={
                    field.key === 'uang_nasabah'
                      ? formatRupiah(totalSisaHutangNasabah)
                      : field.key === 'uang_bank_neo'
                      ? formatRupiah(computedBankNeo)
                      : field.key === 'uang_dipinjamkan'
                      ? formatRupiah(computedDipinjamkan)
                      : field.key === 'total_keuntungan'
                      ? formatRupiah(computedTotalUntung)
                      : formatRupiah(form?.[field.key] || 0)
                  }
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full bg-slate-950/80 border text-2xl font-black px-3.5 py-2.5 rounded-xl transition-all ${
                    field.readonly
                      ? 'border-slate-800 text-white cursor-not-allowed opacity-90'
                      : 'border-slate-700/60 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* Custom Category Cards */}
        {(settings?.custom_categories || []).map((cat) => (
          <div
            key={cat.id}
            className="relative group bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 shadow-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {cat.label}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={formatRupiah(form?.[cat.id] || 0)}
                onChange={(e) => handleChange(cat.id, e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/60 text-white text-2xl font-black px-3.5 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all duration-200 cursor-pointer text-base disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Menyimpan...' : success ? 'Tersimpan!' : 'TERAPKAN PERUBAHAN'}
        </button>
      </div>

      {/* Modal Tambah Kotak Kustom */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Tambah Kotak Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nama Kotak / Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tabungan Usaha"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Nominal Awal (Rp)
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formatRupiah(parseInt(newCategoryAmount.replace(/[^0-9]/g, '')) || 0)}
                  onChange={(e) => setNewCategoryAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Data */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-red-400">Konfirmasi Reset Data</h3>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin mereset seluruh nominal angka di halaman Keuangan menjadi Rp 0? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetData}
                disabled={saving}
                className="px-5 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
              >
                {saving ? 'Mereset...' : 'Ya, Reset Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
