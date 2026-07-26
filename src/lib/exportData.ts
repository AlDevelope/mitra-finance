import * as XLSX from 'xlsx';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// =============================================================
// Util Backup / Export data.
// CATATAN PENTING: seluruh fungsi di sini HANYA MEMBACA data
// dari Firestore (getDocs / getDoc). Tidak ada operasi tulis,
// update, atau hapus apa pun ke database.
// =============================================================

export interface BackupData {
  meta: {
    app: string;
    version: string;
    exported_at: string;
  };
  nasabah: any[];
  history: any[];
  angsuran_logs: any[];
  kosanku: any[];
  keuangan: any | null;
  settings: any | null;
  profiles: any[];
  notifications: any[];
}

// Ambil semua dokumen dari sebuah koleksi (read-only).
const fetchCollection = async (path: string): Promise<any[]> => {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Ambil satu dokumen tunggal (read-only).
const fetchDocument = async (path: string, id: string): Promise<any | null> => {
  const snap = await getDoc(doc(db, path, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Kumpulkan SELURUH data aplikasi dari Firestore tanpa mengubah apa pun.
export const collectAllData = async (): Promise<BackupData> => {
  const nasabah = await fetchCollection('nasabah');

  // Ambil subkoleksi history (riwayat cicilan) tiap nasabah.
  const history: any[] = [];
  for (const n of nasabah) {
    const snap = await getDocs(collection(db, 'nasabah', n.id, 'history'));
    snap.docs.forEach((h) => {
      history.push({ id: h.id, nasabah_id: n.id, nasabah_nama: n.nama, ...h.data() });
    });
  }

  const angsuran_logs = await fetchCollection('angsuran_logs');
  const kosanku = await fetchCollection('kosanku');
  const keuangan = await fetchDocument('keuangan', 'summary');
  const settings = await fetchDocument('settings', 'app');
  const profiles = await fetchCollection('profiles');
  const notifications = await fetchCollection('notifications');

  return {
    meta: {
      app: 'Mitra Finance 99',
      version: 'v2.4.0-digital',
      exported_at: new Date().toISOString(),
    },
    nasabah,
    history,
    angsuran_logs,
    kosanku,
    keuangan,
    settings,
    profiles,
    notifications,
  };
};

// Picu unduhan file di browser.
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Penanda waktu untuk nama file: YYYYMMDD-HHmm
const stamp = (): string => {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
};

// Ubah nilai non-primitif (Firestore Timestamp, objek, array) jadi teks
// agar rapi di dalam sel Excel.
const sanitizeRow = (row: any): any => {
  const out: any = {};
  Object.keys(row || {}).forEach((k) => {
    const v = row[k];
    if (v == null) {
      out[k] = '';
      return;
    }
    if (typeof v === 'object') {
      if (typeof v.toDate === 'function') {
        out[k] = v.toDate().toISOString();
        return;
      }
      if (typeof v.seconds === 'number') {
        out[k] = new Date(v.seconds * 1000).toISOString();
        return;
      }
      out[k] = JSON.stringify(v);
      return;
    }
    out[k] = v;
  });
  return out;
};

// Backup penuh ke JSON. Format paling lengkap & cocok untuk restore.
// Mengembalikan jumlah nasabah yang ter-backup.
export const downloadBackupJson = async (): Promise<number> => {
  const data = await collectAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, 'mitra-finance-backup-' + stamp() + '.json');
  return data.nasabah.length;
};

// Export ke Excel multi-sheet agar mudah dibaca manusia.
// Mengembalikan jumlah nasabah yang ter-export.
export const downloadBackupExcel = async (): Promise<number> => {
  const data = await collectAllData();
  const wb = XLSX.utils.book_new();

  const addSheet = (name: string, rows: any[]): void => {
    const safeRows = rows && rows.length > 0 ? rows.map(sanitizeRow) : [{ info: 'Tidak ada data' }];
    const ws = XLSX.utils.json_to_sheet(safeRows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  addSheet('Nasabah', data.nasabah);
  addSheet('Riwayat Cicilan', data.history);
  addSheet('Log Angsuran', data.angsuran_logs);
  addSheet('Kosanku', data.kosanku);
  addSheet('Keuangan', data.keuangan ? [data.keuangan] : []);
  addSheet('Pengaturan', data.settings ? [data.settings] : []);
  addSheet('Profiles', data.profiles);
  addSheet('Notifications', data.notifications);

  XLSX.writeFile(wb, 'mitra-finance-backup-' + stamp() + '.xlsx');
  return data.nasabah.length;
};
