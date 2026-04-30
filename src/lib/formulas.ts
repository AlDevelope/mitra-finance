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

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const excelSerialToDate = (serial: number): Date => {
  // Excel serial date: 1 Jan 1900 = 1. Unix timestamp 0 is 25569 days after 1 Jan 1900.
  const date = new Date((serial - 25569) * 86400 * 1000);
  return date;
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
  const adminPhone = '+62895412697000'; 
  return `https://wa.me/${adminPhone}?text=${message}`;
};
