import React, { useState, useEffect, useMemo } from 'react';
import { useKeuangan } from '../hooks/useKeuangan';
import { useNasabah } from '../hooks/useNasabah';
import { useSettings } from '../hooks/useSettings';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRupiah } from '../lib/formulas';
import { Settings } from '../types';
import { 
  Save, 
  RefreshCcw, 
  Landmark, 
  Wallet, 
  Map as MapIcon, 
  TrendingUp, 
  Hammer,
  DollarSign,
  Edit2,
  Check,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const KeuanganPage: React.FC = () => {
  const { data: keuangan, loading: loadingKeuangan, error: errorKeuangan } = useKeuangan();
  const { data: nasabahList, loading: loadingNasabah } = useNasabah();
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newLabelText, setNewLabelText] = useState('');

  // Calculate total debt from all customers
  const totalSisaHutangNasabah = useMemo(() => {
    if (!nasabahList) return 0;
    return nasabahList.reduce((acc, curr) => acc + (curr.sisa_hutang || 0), 0);
  }, [nasabahList]);

  useEffect(() => {
    if (keuangan) {
      setForm({ ...keuangan, uang_nasabah: totalSisaHutangNasabah });
    }
  }, [keuangan, totalSisaHutangNasabah]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, 'keuangan', 'summary'), {
        ...form,
        updated_at: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving keuangan:', err);
      alert('Gagal menyimpan data keuangan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!settings) return;
    const label = prompt('Masukkan nama kategori baru:');
    if (!label) return;

    const id = 'custom_' + Date.now();
    const newSettings: Settings = {
      ...settings,
      custom_categories: [...(settings.custom_categories || []), { id, label }]
    };
    
    const ok = await updateSettings(newSettings);
    if (ok) {
      setForm((prev: any) => ({ ...prev, [id]: 0 }));
      await updateDoc(doc(db, 'keuangan', 'summary'), { [id]: 0 });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!settings || !window.confirm('Hapus kategori ini? Data saldo di dalamnya akan hilang.')) return;

    const newSettings: Settings = {
      ...settings,
      custom_categories: settings.custom_categories.filter(c => c.id !== id)
    };

    const ok = await updateSettings(newSettings);
    if (ok) {
      const newForm = { ...form };
      delete newForm[id];
      setForm(newForm);
    }
  };

  const startEditLabel = (id: string, currentLabel: string) => {
    setEditingField(id);
    setNewLabelText(currentLabel);
  };

  const saveNewLabel = async (id: string) => {
    if (!settings) return;

    let newSettings: Settings;
    if (id === 'uang_tanah_lama' || id === 'uang_tanah_baru') {
      newSettings = {
        ...settings,
        category_labels: {
          ...settings.category_labels,
          [id]: newLabelText
        }
      };
    } else {
      newSettings = {
        ...settings,
        custom_categories: settings.custom_categories.map(c => 
          c.id === id ? { ...c, label: newLabelText } : c
        )
      };
    }

    const ok = await updateSettings(newSettings);
    if (ok) setEditingField(null);
  };

  const handleChange = (key: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setForm((prev: any) => ({ ...prev, [key]: num }));
  };

  if (loadingKeuangan || loadingNasabah) return <div className="p-8 text-center text-gray-400 font-bold">Memuat data keuangan...</div>;
  if (errorKeuangan) return <div className="p-8 text-center text-danger font-bold">Error: {errorKeuangan}</div>;
  if (!form) return <div className="p-8 text-center text-gray-400 font-bold">Menyiapkan data...</div>;

  const coreFields = [
    { key: 'uang_nasabah', label: 'Uang Nasabah (Pinjaman)', icon: Landmark, readonly: true },
    { key: 'uang_bank_neo', label: 'Uang Bank Neo', icon: Landmark },
    { key: 'uang_dipinjamkan', label: 'Uang Yang Dipinjamkan', icon: DollarSign, readonly: true },
    { key: 'uang_cash', label: 'Uang Cash', icon: Wallet },
    { key: 'total_keuntungan', label: 'Total Keuntungan', icon: TrendingUp, readonly: true },
    { key: 'uang_tanah_lama', label: settings?.category_labels.uang_tanah_lama || 'Uang Tanah Lama', icon: MapIcon, canEdit: true },
    { key: 'uang_tanah_baru', label: settings?.category_labels.uang_tanah_baru || 'Uang Tanah Baru', icon: MapIcon, canEdit: true },
    { key: 'uang_stokbit', label: 'Uang Stokbit (M3110)', icon: TrendingUp },
    { key: 'uang_renov', label: 'Uang Renov', icon: Hammer },
  ];

  const customFields = (settings?.custom_categories || []).map(c => ({
    key: c.id,
    label: c.label,
    icon: Wallet,
    canEdit: true,
    canDelete: true
  }));

  const allFields = [...coreFields, ...customFields];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Keuangan</h2>
          <p className="text-gray-500 mt-1">Kelola saldo dan kustomisasi kategori keuangan Anda</p>
        </div>
        <button 
          onClick={handleAddCategory}
          type="button"
          className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-[24px] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Tambah Kotak
        </button>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allFields.map((field) => (
          <div key={field.key} className="glass p-8 rounded-[40px] space-y-4 group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
             {field.canDelete && !editingField && (
              <button 
                type="button"
                onClick={() => handleDeleteCategory(field.key)}
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-300 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {editingField === field.key ? (
                  <div className="flex gap-2 mb-2 animate-in slide-in-from-top-1 duration-200">
                    <input 
                      type="text" 
                      autoFocus
                      value={newLabelText}
                      onChange={(e) => setNewLabelText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveNewLabel(field.key)}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-accent/20 rounded-lg text-[10px] font-bold outline-none"
                    />
                    <button type="button" onClick={() => saveNewLabel(field.key)} className="p-1 px-2 bg-accent text-white rounded-lg">
                      <Check className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => setEditingField(null)} className="p-1 px-2 bg-gray-100 text-gray-500 rounded-lg">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{field.label}</label>
                    {field.canEdit && (
                      <button 
                        type="button"
                        onClick={() => startEditLabel(field.key, field.label)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-accent transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                
                <input
                  type="text"
                  readOnly={field.readonly}
                  value={formatRupiah(form?.[field.key] || 0)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={cn(
                    "w-full bg-transparent text-2xl font-black text-gray-900 outline-none border-b-2 border-transparent transition-all",
                    field.readonly ? "cursor-default opacity-60" : "focus:border-accent"
                  )}
                />
              </div>
              <div className={cn(
                "w-12 h-12 rounded-3xl flex items-center justify-center shrink-0",
                field.readonly ? "bg-gray-100 text-gray-400" : "bg-primary/10 text-primary"
              )}>
                <field.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}

        <div className="md:col-span-2 lg:col-span-3 flex justify-end items-center gap-6 sticky bottom-6 z-20 md:relative md:bottom-0 mt-8">
          {success && (
            <motion.p 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-green-500 font-bold bg-green-50 px-6 py-3 rounded-2xl shadow-sm border border-green-100"
            >
              Berhasil diperbarui!
            </motion.p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-12 py-5 bg-accent text-white rounded-[24px] font-black shadow-2xl shadow-accent/30 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {saving ? 'Menyimpan...' : 'TERAPKAN PERUBAHAN'}
          </button>
        </div>
      </form>
    </div>
  );
};
