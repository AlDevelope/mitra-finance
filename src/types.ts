export enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export enum NasabahStatus {
  AKTIF = 'AKTIF',
  LUNAS = 'LUNAS',
  MENUNGGAK = 'MENUNGGAK',
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  phone_number?: string;
  nasabah_id?: string;
  avatar_url?: string;
  created_at: any;
}

export interface Nasabah {
  id: string;
  nama: string;
  barang: string;
  uang_muka: number;
  jumlah_angsuran: number;
  rp_per_angsuran: number;
  satuan: string;
  total_hutang: number;
  angsuran_terbayar: number;
  sisa_angsuran: number;
  sisa_hutang: number;
  progress_persen: number;
  status: NasabahStatus;
  whatsapp_number?: string;
  catatan?: string;
  created_at: any;
  updated_at: any;
}

export interface Angsuran {
  id: string;
  nasabah_id: string;
  angsuran_ke: number;
  tanggal_bayar: string;
  jumlah_bayar: number;
  sisa_setelah_bayar: number;
  keterangan?: string;
  dibuat_oleh: string;
  created_at: any;
}

export interface Keuangan {
  uang_nasabah: number;
  uang_bank_neo: number;
  uang_dipinjamkan: number;
  uang_cash: number;
  total_keuntungan: number;
  uang_tanah_lama: number;
  uang_tanah_baru: number;
  uang_stokbit: number;
  uang_renov: number;
  updated_at: any;
  updated_by?: string;
}

export interface Settings {
  logo_url?: string;
  category_labels: {
    uang_tanah_lama: string;
    uang_tanah_baru: string;
  };
  custom_categories: { id: string; label: string }[];
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: any;
}
