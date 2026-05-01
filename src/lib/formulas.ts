import { Nasabah } from '../types';

export const hitungTotalHutang = (uangMuka: number, jumlahAngsuran: number, rpPerAngsuran: number) => {
  return uangMuka + (jumlahAngsuran * rpPerAngsuran);
};

export const hitungSisaHutang = (sisaAngsuran: number, rpPerAngsuran: number) => {
  return sisaAngsuran * rpPerAngsuran;
};

export const hitungProgress = (angsuranTerbayar: number, totalAngsuran: number) => {
  if (totalAngsuran === 0) return 0;
  return Math.round((angsuranTerbayar / totalAngsuran) * 100);
};

export const parseExcelValue = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove currency symbols, commas, and dots but handle Indonesian format where . is thousand and , is decimal potentially
  // For simplicity, we remove everything set except digits and minus
  const cleaned = String(val).replace(/[^0-9-]/g, '');
  return parseInt(cleaned) || 0;
};

export const parseExcelDate = (val: any): string => {
  // Excel date serial number handling
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  if (!val) return new Date().toISOString().split('T')[0];
  
  const str = String(val).trim();
  
  // Handle DD/MM/YYYY format
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  // Handle DD-MM-YYYY format
  if (str.includes('-') && str.split('-')[0].length <= 2) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  return str;
};

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const excelSerialToDate = (serial: number): Date => {
  // Excel serial date: 1 Jan 1900 = 1. Unix timestamp 0 is 25569 days after 1 Jan 1900.
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date;
};

export const formatDisplayDate = (dateVal: any): string => {
  if (!dateVal) return '-';
  
  let date: Date;
  
  if (dateVal instanceof Date) {
    date = dateVal;
  } else if (typeof dateVal === 'number') {
    date = excelSerialToDate(dateVal);
  } else if (typeof dateVal === 'string') {
    // Check if it's a numeric string (excel serial)
    if (!isNaN(Number(dateVal)) && !dateVal.includes('-')) {
      date = excelSerialToDate(Number(dateVal));
    } else {
      date = new Date(dateVal);
    }
  } else if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
    // Firestore Timestamp
    date = dateVal.toDate();
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) return String(dateVal);

  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  
  return `${d}/${m}/${y}`;
};

export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateJadwalAngsuran = (startDate: Date, totalAngsuran: number, rpPerAngsuran: number) => {
  return Array.from({ length: totalAngsuran }, (_, i) => {
    const tgl = new Date(startDate);
    tgl.setDate(tgl.getDate() + (i * 7)); // every 7 days
    const sisaAngsuran = totalAngsuran - (i + 1);
    return {
      angsuranKe: i + 1,
      tanggalRencana: tgl,
      jumlah: rpPerAngsuran,
      sisaSetelah: sisaAngsuran,
      sisaHutang: sisaAngsuran * rpPerAngsuran,
    };
  });
};

export const hitungTotalDipinjamkan = (nasabahList: Nasabah[]) => {
  return nasabahList
    .filter(n => n.status !== 'LUNAS')
    .reduce((total, n) => total + n.sisa_hutang, 0);
};

export const generateWhatsAppMessage = (nasabah: Nasabah, angsuranKe: number) => {
  const sisa = nasabah.sisa_hutang;
  const message = encodeURIComponent(
    `Assalamu'alaikum 🙏\n\n` +
    `Halo *${nasabah.nama}*,\n\n` +
    `Ini adalah informasi tagihan angsuran Anda:\n` +
    `• Barang: *${nasabah.barang}*\n` +
    `• Angsuran ke: *${angsuranKe}*\n` +
    `• Jumlah: *${formatRupiah(nasabah.rp_per_angsuran)}*\n` +
    `• Sisa Hutang: *${formatRupiah(sisa)}*\n` +
    `• Sisa Angsuran: *${nasabah.sisa_angsuran} minggu lagi*\n\n` +
    `Silahkan konfirmasi pembayaran ke nomor ini.\n\n` +
    `Terima kasih 🙏\n*Mitra Finance 99*\n_Berkembang, Bertumbuh, Berinovasi_`
  );
  return `https://wa.me/${nasabah.whatsapp_number}?text=${message}`;
};

export const generateNasabahPaymentMessage = (nasabah: Nasabah) => {
  const angsuranKe = (nasabah.angsuran_terbayar || 0) + 1;
  const message = encodeURIComponent(
    `Halo Admin Mitra Finance 99,\n\n` +
    `Saya *${nasabah.nama}* ingin membayar angsuran ke- *${angsuranKe}* untuk barang *${nasabah.barang}*.\n` +
    `Jumlah: *${formatRupiah(nasabah.rp_per_angsuran)}*.\n\n` +
    `Mohon infonya untuk proses pembayaran. Terima kasih!`
  );
  // Using a fixed admin number for now - in production this would be in env or database
  const adminPhone = '628123456789'; 
  return `https://wa.me/${adminPhone}?text=${message}`;
};
