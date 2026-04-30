import { collection, getDocs, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { excelSerialToDate, formatDateToISO } from './formulas';
import { NasabahStatus } from '../types';

const INITIAL_NASABAH = [
  {
    nama: "Yuli",
    barang: "Kompor & Payung",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 117000,
    payments: [46073, 46080, 46087, 46094, 46101, 46108, 46115, 46122, 46129, 46136]
  },
  {
    nama: "Sifa",
    barang: "Online Shop",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 82000,
    payments: [46087, 46094, 46101, 46108, 46122, 46122, 46136, 46136]
  },
  {
    nama: "Sulistiawan Sugeng",
    barang: "Cucak Ijo",
    uang_muka: 550000,
    jumlah_angsuran: 15,
    rp_per_angsuran: 54000,
    payments: [46031, 46038, 46045, 46052, 46059, 46066, 46073, 46080, 46087, 46094, 46115, 46122, 46129, 46136]
  },
  {
    nama: "Nadya II",
    barang: "Kompor Satu Seat",
    uang_muka: 0,
    jumlah_angsuran: 12,
    rp_per_angsuran: 86000,
    payments: [46124, 46129, 46136]
  },
  {
    nama: "Hilda",
    barang: "Minyak Goreng",
    uang_muka: 0,
    jumlah_angsuran: 4,
    rp_per_angsuran: 65000,
    payments: [46080]
  },
  {
    nama: "Erwan",
    barang: "Ban Motor",
    uang_muka: 0,
    jumlah_angsuran: 10,
    rp_per_angsuran: 30000,
    payments: [46094, 46101, 46115, 46122, 46129, 46136]
  },
  {
    nama: "Hana",
    barang: "Hp Poco C75",
    uang_muka: 300000,
    jumlah_angsuran: 8,
    rp_per_angsuran: 123000,
    payments: [45982, 46003, 46017]
  },
  {
    nama: "Ranti",
    barang: "Kompor",
    uang_muka: 0,
    jumlah_angsuran: 10,
    rp_per_angsuran: 36000,
    payments: [46129, 46136]
  },
  {
    nama: "Bpk Bokir",
    barang: "Paket Sembako",
    uang_muka: 0,
    jumlah_angsuran: 12,
    rp_per_angsuran: 128000,
    payments: [46059, 46066, 46073, 46080, 46087, 46094, 46111, 46115, 46122, 46129, 46136]
  },
  {
    nama: "Nadiya",
    barang: "Indomie 2 Dus",
    uang_muka: 0,
    jumlah_angsuran: 12,
    rp_per_angsuran: 27000,
    payments: [46066, 46073, 46080, 46087, 46094, 46111, 46115, 46122, 46129, 46136]
  },
  {
    nama: "Ati",
    barang: "Kipas Angin 2 Unit",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 64000,
    payments: [46115, 46122, 46129, 46136]
  },
  {
    nama: "Agus Riyadi",
    barang: "Samsung A07",
    uang_muka: 500000,
    jumlah_angsuran: 12,
    rp_per_angsuran: 202000,
    payments: [46080, 46087, 46094, 46111, 46111, 46111, 46129, 46129, 46136]
  },
  {
    nama: "Sutik",
    barang: "Hp Oppo A6T",
    uang_muka: 150000,
    jumlah_angsuran: 15,
    rp_per_angsuran: 257000,
    payments: [46136]
  },
  {
    nama: "Ida Farida",
    barang: "Minyak 1 Dus",
    uang_muka: 0,
    jumlah_angsuran: 4,
    rp_per_angsuran: 65000,
    payments: []
  },
  {
    nama: "Dimas",
    barang: "Sperpat Motor",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 147000,
    payments: [46017, 46023, 46031, 46038, 46045, 46052, 46066, 46082, 46087, 46101, 46108, 46084, 46129, 46136]
  },
  {
    nama: "Sulistiawan Sugeng II",
    barang: "Burung",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 45000,
    payments: [46122, 46129, 46136]
  },
  {
    nama: "Mama Ceca",
    barang: "CCTV + Pasang",
    uang_muka: 0,
    jumlah_angsuran: 10,
    rp_per_angsuran: 46000,
    payments: [46129, 46136]
  },
  {
    nama: "Yuli II",
    barang: "Meja Kursi Dua Seat",
    uang_muka: 0,
    jumlah_angsuran: 15,
    rp_per_angsuran: 55000,
    payments: [46122, 46129, 46136]
  }
];

export const seedDatabase = async () => {
  try {
    const nasabahSnapshot = await getDocs(collection(db, 'nasabah'));
    if (!nasabahSnapshot.empty) return;

    console.log("Seeding initial data...");

    // 1. Seed Keuangan Summary
    await setDoc(doc(db, 'keuangan', 'summary'), {
      uang_nasabah: 10270000,
      uang_bank_neo: 5790000,
      uang_dipinjamkan: 54010000,
      uang_cash: 59800000,
      total_keuntungan: 70070000,
      uang_tanah_lama: 20000000,
      uang_tanah_baru: 18000000,
      uang_stokbit: 3110000,
      uang_renov: 12900000,
      updated_at: serverTimestamp()
    });

    // 2. Seed Nasabah and their History
    for (const data of INITIAL_NASABAH) {
      const nasabahRef = doc(collection(db, 'nasabah'));
      const totalHutang = data.uang_muka + (data.jumlah_angsuran * data.rp_per_angsuran);
      const angsuranTerbayar = data.payments.length;
      const sisaAngsuran = data.jumlah_angsuran - angsuranTerbayar;
      const sisaHutang = sisaAngsuran * data.rp_per_angsuran;
      const progress = data.jumlah_angsuran === 0 ? 0 : Math.round((angsuranTerbayar / data.jumlah_angsuran) * 100);

      await setDoc(nasabahRef, {
        nama: data.nama,
        barang: data.barang,
        uang_muka: data.uang_muka,
        jumlah_angsuran: data.jumlah_angsuran,
        rp_per_angsuran: data.rp_per_angsuran,
        satuan: 'Minggu',
        total_hutang: totalHutang,
        angsuran_terbayar: angsuranTerbayar,
        sisa_angsuran: sisaAngsuran,
        sisa_hutang: sisaHutang,
        progress_persen: progress,
        status: sisaAngsuran === 0 ? NasabahStatus.LUNAS : NasabahStatus.AKTIF,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Seed history
      const batch = writeBatch(db);
      data.payments.forEach((p, index) => {
        const historyRef = doc(collection(nasabahRef, 'history'));
        const date = excelSerialToDate(p);
        batch.set(historyRef, {
          nasabah_id: nasabahRef.id,
          angsuran_ke: index + 1,
          tanggal_bayar: formatDateToISO(date),
          jumlah_bayar: data.rp_per_angsuran,
          sisa_setelah_bayar: data.jumlah_angsuran - (index + 1),
          keterangan: 'Pembayaran awal (migrated)',
          created_at: serverTimestamp()
        });
      });
      await batch.commit();
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};
