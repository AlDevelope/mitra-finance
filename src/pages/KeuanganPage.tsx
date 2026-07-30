import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Wallet, Users, TrendingUp, AlertCircle, 
  MapIcon, Hammer, Plus, Trash2, RotateCcw, Check, RefreshCw 
} from 'lucide-react';
import { useKeuangan } from '../hooks/useKeuangan';
import { useNasabah } from '../hooks/useNasabah';
import { useSettings } from '../hooks/useSettings';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function KeuanganPage() {
  const { data: keuangan, loading: loadingKeuangan, error: errorKeuangan } = useKeuangan();
  const { data: nasabahList, loading: loadingNasabah } = useNasabah();
  const { settings, updateSettings } = useSettings();

  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // 1. Hitung total sisa hutang nasabah secara otomatis
  const totalSisaHutangNasabah = useMemo(() => {
    if (!nasabahList) return 0;
    return nasabahList.reduce((acc, curr) => acc + (curr.sisa_hutang || 0), 0);
  }, [nasabahList]);

  // Inisialisasi form dari data Firestore (hanya saat pertama kali muat)
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

  // 2. Kotakan Merah (Uang Dipinjamkan) = Penjumlahan Kotakan Hijau
  // (Tanah Lama + Tanah Baru + Stokbit + Renov Baru + Renov Lama + kategori custom)
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

  // 3. Uang Bank Neo = Uang Cash - Uang Dipinjamkan
  const computedBankNeo = useMemo(() => {
    if (!form) return 0;
    const cash = Number(form.uang_cash || 0);
    return cash - computedDipinjamkan;
  }, [form, computedDipinjamkan]);

  // 4. Total Untung = Uang Nasabah + Uang Cash
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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving summary:', err);
      alert('Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim() || !settings) return;
    
    const categoryId = `custom_${Date.now()}`;
    const newCategories = [
      ...(settings.custom_categories || []),
      { id: categoryId, label: newCategoryLabel.trim() }
    ];

    try {
      await updateSettings({
        ...settings,
        custom_categories: newCategories
      });

      setForm({
        ...form,
        [categoryId]: 0
      });

      setNewCategoryLabel('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menambah kotak baru');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!settings) return;
    if (!confirm('Apakah Anda yakin ingin menghapus kotak ini?')) return;

    const newCategories = (settings.custom_categories || []).filter(c => c.id !== id);
    try {
      await updateSettings({
        ...settings,
        custom_categories: newCategories
      });

      const newForm = { ...form };
      delete newForm[id];
      setForm(newForm);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus kotak');
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
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

  const defaultFields = [
    { key: 'uang_cash', label: settings?.category_labels?.uang_cash || 'Uang Cash', icon: Wallet, color: 'emerald', canEdit: true },
    { key: 'uang_nasabah', label: settings?.category_labels?.uang_nasabah || 'Uang Nasabah (Nasabah)', icon: Users, color: 'blue', readonly: true, canEdit: true },
    { key: 'uang_bank_neo', label: settings?.category_labels?.uang_bank_neo || 'Uang Bank Neo', icon: Building2, color: 'cyan', readonly: true, canEdit: true },
    { key: 'uang_dipinjamkan', label: settings?.category_labels?.uang_dipinjamkan || 'Uang Dipinjamkan', icon: AlertCircle, color: 'amber', readonly: true, canEdit: true },
    { key: 'total_keuntungan', label: settings?.category_labels?.total_keuntungan || 'Total Untung', icon: TrendingUp, color: 'accent', readonly: true, canEdit: true },
    { key: 'uang_tanah_lama', label: settings?.category_labels?.uang_tanah_lama || 'Uang Tanah Lama', icon: MapIcon, color: 'slate', canEdit: true },
    { key: 'uang_tanah_baru', label: settings?.category_labels?.uang_tanah_baru || 'Uang Tanah Baru', icon: MapIcon, color: 'slate', canEdit: true },
    { key: 'uang_stokbit', label: settings?.category_labels?.uang_stokbit || 'Uang Stokbit', icon: Wallet, color: 'slate', canEdit: true },
    { key: 'uang_renov', label: settings?.category_labels?.uang_renov || 'Uang Renovasi Baru', icon: Hammer, color: 'orange', canEdit: true },
    { key: 'uang_renov_lama', label: settings?.category_labels?.uang_renov_lama || 'Uang Renovasi Lama', icon: Hammer, color: 'slate', canEdit: true },
  ];

  const customFields = (settings?.custom_categories || []).map(cat => ({
    key: cat.id,
    label: cat.label,
    icon: Wallet,
    color: 'slate',
    isCustom: true,
    canEdit: true
  }));

  const allFields = [...defaultFields, ...customFields];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Mitra Finance 99
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">
            "Berkembang, Bertumbuh, Berinovasi"
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Data
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Kotak
          </button>
        </div>
      </div>

      {errorKeuangan && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Gagal memuat data keuangan: {errorKeuangan.message}</span>
        </div>
      )}

      {/* Grid Kotak Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allFields.map((field) => {
          const Icon = field.icon;

          return (
            <div
              key={field.key}
              className={`relative group p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${
                field.key === 'uang_dipinjamkan'
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : field.key === 'uang_bank_neo' && computedBankNeo < 0
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60 shadow-lg shadow-amber-950/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                    {field.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {field.isCustom && (
                    <button
                      onClick={() => handleDeleteCategory(field.key)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Hapus Kotak"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
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
                  className={`w-full bg-slate-950/60 border rounded-xl px-4 py-3 font-extrabold text-xl tracking-tight transition-all outline-none ${
                    field.readonly
                      ? 'border-slate-800/60 text-slate-300 cursor-not-allowed bg-slate-900/20'
                      : 'border-slate-700/80 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Simpan */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : success ? (
            <>
              <Check className="w-5 h-5 text-emerald-400" />
              Tersimpan!
            </>
          ) : (
            'TERAPKAN PERUBAHAN'
          )}
        </button>
      </div>

      {/* Modal Tambah Kotak */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Tambah Kotak Kategori Baru</h3>
              <p className="text-sm text-slate-400 mt-1">
                Buat kotak baru untuk mencatat posisi keuangan tambahan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nama Kategori
              </label>
              <input
                type="text"
                placeholder="Contoh: Uang Operasional"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddCategory}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Data */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Reset Semua Data Keuangan?</h3>
              <p className="text-sm text-slate-400 mt-1">
                Tindakan ini akan mengosongkan semua nominal input keuangan menjadi Rp 0. Data nasabah tidak akan terhapus.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleResetData}
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
