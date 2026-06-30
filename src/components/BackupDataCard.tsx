import React, { useState } from 'react';
import { DatabaseBackup, FileJson, FileSpreadsheet } from 'lucide-react';
import { downloadBackupJson, downloadBackupExcel } from '../lib/exportData';

// Kartu untuk mengunduh cadangan (backup) seluruh data aplikasi.
// Operasi di sini sepenuhnya read-only: hanya membaca lalu mengunduh file.
export const BackupDataCard: React.FC = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runExport = async (kind: 'json' | 'excel'): Promise<void> => {
    setBusy(kind);
    setMessage(null);
    try {
      const count = kind === 'json'
        ? await downloadBackupJson()
        : await downloadBackupExcel();
      setMessage('Backup berhasil diunduh (' + count + ' nasabah).');
    } catch (err) {
      console.error('Gagal membuat backup:', err);
      setMessage('Gagal membuat backup. Silakan coba lagi.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="glass p-8 rounded-[40px] border-2 border-emerald-50/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
          <DatabaseBackup className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Backup &amp; Cadangan Data</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Unduh Salinan Data</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <p className="text-xs text-emerald-700/80 leading-relaxed">
            Unduh seluruh data (nasabah, riwayat cicilan, log angsuran, kosanku, keuangan, dan pengaturan) sebagai cadangan. Proses ini hanya membaca data dan <span className="font-bold">tidak mengubah apa pun</span> di database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => runExport('json')}
            disabled={busy !== null}
            className="py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <FileJson className="w-5 h-5" />
            {busy === 'json' ? 'Menyiapkan...' : 'Backup JSON'}
          </button>
          <button
            onClick={() => runExport('excel')}
            disabled={busy !== null}
            className="py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {busy === 'excel' ? 'Menyiapkan...' : 'Export Excel'}
          </button>
        </div>

        {message && (
          <p className="text-xs font-bold text-gray-500 px-1">{message}</p>
        )}

        <p className="text-[10px] text-gray-400 italic px-1">
          Simpan file JSON di tempat aman \u2014 berguna untuk memulihkan data bila diperlukan. Disarankan melakukan backup secara rutin.
        </p>
      </div>
    </section>
  );
};

export default BackupDataCard;
