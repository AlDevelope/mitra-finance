import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Upload, FileBarChart, CheckCircle, AlertCircle, RefreshCcw, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NasabahStatus, Role } from '../types';
import { formatRupiah, formatDateToISO, excelSerialToDate } from '../lib/formulas';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth(); // Get profile here
  const [data, setData] = useState<any[]>([]);
  const [keuanganImport, setKeuanganImport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Helper to get cell value
        const getCell = (r: number, c: number) => {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          return worksheet[cellRef]?.v;
        };

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
        const results: any[] = [];
        const foundKeuangan: any = {};

        // Key labels for financial data
        const finKeys: Record<string, string> = {
          'uang bank neo': 'uang_bank_neo',
          'bank neo': 'uang_bank_neo',
          'uang cash': 'uang_cash',
          'uang tunai': 'uang_cash',
          'uang tanah lama': 'uang_tanah_lama',
          'tanah lama': 'uang_tanah_lama',
          'uang tanah baru': 'uang_tanah_baru',
          'tanah baru': 'uang_tanah_baru',
          'uang stokbit': 'uang_stokbit',
          'stokbit': 'uang_stokbit',
          'uang renov': 'uang_renov',
          'biaya renov': 'uang_renov'
        };

        // Scan for "Card Layout" (Nama, Barang, etc) and global keuangan data
        for (let r = range.s.r; r <= range.e.r; r++) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            const rawVal = String(getCell(r, c) || '').toLowerCase();
            const val = rawVal.trim();
            
            // Look for financial keys globally
            Object.entries(finKeys).forEach(([label, key]) => {
              if (val.includes(label)) {
                const neighborValue = getCell(r, c + 1);
                if (neighborValue !== undefined) {
                  foundKeuangan[key] = cleanImportNumber(neighborValue);
                }
              }
            });

            if (val === 'nama' || val === 'nasabah' || val === 'customer') {
              const name = getCell(r, c + 1);
              if (!name) continue;

              // Found a nasabah block!
              const nasabah: any = {
                nama: String(name),
                history: []
              };

              // Scan downward for related fields
              for (let scanR = r; scanR < r + 15 && scanR <= range.e.r; scanR++) {
                const label = String(getCell(scanR, c) || '').toLowerCase().trim();
                const neighborValue = getCell(scanR, c + 1);

                if (label.includes('barang') || label.includes('diterima') || label.includes('sudah di terima')) nasabah.barang = String(neighborValue || '');
                if (label.includes('muka') || label.includes('dp')) nasabah.uang_muka = cleanImportNumber(neighborValue);
                if (label.includes('jumlah angsuran') || label.includes('tenor')) nasabah.jumlah_angsuran = cleanImportNumber(neighborValue);
                if (label === 'rp' || label.includes('cicilan') || label.includes('angs')) nasabah.rp_per_angsuran = cleanImportNumber(neighborValue);
                if (label.includes('whatsapp') || label.includes('wa') || label.includes('telepon')) nasabah.whatsapp_number = String(neighborValue || '');
                if (label.includes('catatan') || label.includes('keterangan')) nasabah.catatan = String(neighborValue || '');
              }

              // Scan for history table below
              // Look for "Tgl" or "Angsuran" in the vicinity
              let tableHeaderFound = false;
              let tableRow = r + 1;
              while (tableRow < r + 20 && tableRow <= range.e.r && !tableHeaderFound) {
                 const rowVal = String(getCell(tableRow, c) || '').toLowerCase().trim();
                 if (rowVal === 'tgl') {
                   tableHeaderFound = true;
                   // Parse rows below header
                   let dataRow = tableRow + 1;
                   while (dataRow <= range.e.r) {
                     const dateVal = getCell(dataRow, c);
                     const angsuranNo = getCell(dataRow, c + 1);
                     const rpVal = getCell(dataRow, c + 2);
                     const ketVal = getCell(dataRow, c + 4);

                     if (!angsuranNo || isNaN(Number(angsuranNo))) break;

                     nasabah.history.push({
                        angsuran_ke: Number(angsuranNo),
                        tanggal_bayar: typeof dateVal === 'number' ? formatDateToISO(excelSerialToDate(dateVal)) : String(dateVal || ''),
                        jumlah_bayar: cleanImportNumber(rpVal),
                        keterangan: String(ketVal || '')
                     });
                     dataRow++;
                   }
                 }
                 tableRow++;
              }

              if (nasabah.nama) {
                results.push(nasabah);
                // Skip scan to avoid double detection if cards are dense
              }
            }
          }
        }
        
        if (Object.keys(foundKeuangan).length > 0) {
          setKeuanganImport(foundKeuangan);
        }

        // Fallback to standard sheet_to_json if no cards found
        if (results.length === 0) {
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const mapped = jsonData.map((row: any) => {
            const getVal = (keys: string[]) => {
              const foundKey = Object.keys(row).find(k => 
                keys.some(search => k.toLowerCase().trim() === search.toLowerCase())
              );
              return foundKey ? row[foundKey] : undefined;
            };

            return {
              nama: getVal(['Nama', 'Customer', 'Nasabah']) || '',
              barang: getVal(['Sudah di terima', 'Sudah Di terima', 'Diterima', 'Barang', 'Item', 'Produk']) || '',
              uang_muka: cleanImportNumber(getVal(['Uang Muka', 'DP', 'Down Payment'])),
              jumlah_angsuran: cleanImportNumber(getVal(['Jumlah Angsuran', 'Tenor', 'Lama Angsuran'])),
              rp_per_angsuran: cleanImportNumber(getVal(['Rp per Angsuran', 'Angsuran', 'Cicilan'])),
              whatsapp_number: String(getVal(['WhatsApp', 'WA', 'Telepon', 'No HP']) || ''),
              catatan: getVal(['Catatan', 'Note', 'Keterangan']) || '',
              history: []
            };
          }).filter(n => n.nama && n.jumlah_angsuran > 0);
          
          setData(mapped);
        } else {
          setData(results);
        }
        
        setError('');
      } catch (err) {
        console.error(err);
        setError('Gagal membaca file. Pastikan format Excel benar.');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const cleanImportNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove dots and commas (common in ID-ID formatting)
    const clean = String(val).replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false 
  } as any);

  const handleImport = async () => {
    if (data.length === 0) return;
    setLoading(true);
    try {
      const { setDoc, doc, updateDoc } = await import('firebase/firestore');
      const currentUser = profile?.full_name || 'System Import';

      // Update Financial data if found
      if (keuanganImport) {
        await setDoc(doc(db, 'keuangan', 'summary'), {
          ...keuanganImport,
          updated_at: serverTimestamp()
        }, { merge: true });
      }

      for (const item of data) {
        const totalHutang = (item.uang_muka || 0) + ((item.jumlah_angsuran || 0) * (item.rp_per_angsuran || 0));
        const totalTerbayarHistory = item.history.reduce((sum: number, h: any) => sum + h.jumlah_bayar, 0);
        const angsuranTerbayar = item.history.length;
        
        const nasabahRef = await addDoc(collection(db, 'nasabah'), {
          nama: item.nama,
          barang: item.barang || '-',
          uang_muka: item.uang_muka || 0,
          jumlah_angsuran: item.jumlah_angsuran || 0,
          rp_per_angsuran: item.rp_per_angsuran || 0,
          whatsapp_number: item.whatsapp_number || '',
          catatan: item.catatan || '',
          satuan: 'Minggu',
          total_hutang: totalHutang,
          angsuran_terbayar: angsuranTerbayar,
          sisa_angsuran: Math.max(0, (item.jumlah_angsuran || 0) - angsuranTerbayar),
          sisa_hutang: Math.max(0, ((item.jumlah_angsuran || 0) * (item.rp_per_angsuran || 0)) - totalTerbayarHistory),
          progress_persen: item.jumlah_angsuran > 0 ? Math.round((angsuranTerbayar / item.jumlah_angsuran) * 100) : 0,
          status: angsuranTerbayar >= item.jumlah_angsuran ? NasabahStatus.LUNAS : NasabahStatus.AKTIF,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        // Create virtual account profile for nasabah
        // id: nama@mitrafinance.com, pw: nama123
        const nasabahSlug = item.nama.toLowerCase().replace(/\s+/g, '');
        const email = `${nasabahSlug}@mitrafinance.com`;
        const password = `${nasabahSlug}123`;
        
        // We use the nasabahSlug as a unique ID for the profile in this demo logic
        // This is not a standard Firebase User UID but we will handle it in LoginPage
        await setDoc(doc(db, 'profiles', email), {
          full_name: item.nama,
          role: Role.CUSTOMER,
          nasabah_id: nasabahRef.id,
          email: email,
          password: password, // In a real app never store plaintext passwords!
          created_at: new Date().toISOString()
        });

        // Add history records
        for (const h of item.history) {
           await addDoc(collection(db, 'nasabah', nasabahRef.id, 'history'), {
             ...h,
             nasabah_id: nasabahRef.id,
             dibuat_oleh: currentUser,
             sisa_setelah_bayar: 0, // Simplified for import
             created_at: serverTimestamp()
           });
        }
      }
      setSuccess(true);
      setTimeout(() => navigate('/nasabah'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(`Gagal mengimport data ke database: ${err.message || 'Error tidak diketahui'}`);
    } finally {
      setData([]); // Clear data
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <header className="flex items-center gap-4">
        <Link to="/nasabah" className="w-10 h-10 glass flex items-center justify-center rounded-xl hover:bg-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import Nasabah (Data Induk)</h2>
          <p className="text-gray-500">Unggah file Excel untuk pendaftaran massal nasabah dan riwayatnya</p>
        </div>
      </header>

      {!success ? (
        <div className="space-y-6">
          <section className="glass p-10 rounded-[40px] border-2 border-dashed border-primary/20">
             <div 
              {...getRootProps()} 
              className={cn(
                "flex flex-col items-center justify-center py-12 px-6 rounded-[30px] transition-all cursor-pointer",
                isDragActive ? "bg-primary/5 scale-[0.99]" : "hover:bg-gray-50 bg-white shadow-sm"
              )}
             >
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pilih File Excel</h3>
                <p className="text-gray-400 text-sm font-medium text-center max-w-xs">Seret dan lepas file .xlsx, .xls, atau .csv ke sini untuk memulai</p>
             </div>
          </section>

          {data.length > 0 && (
            <section className="glass rounded-[40px] overflow-hidden">
               <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-accent" />
                    Preview Data ({data.length} Nasabah)
                  </h3>
                  <button 
                    onClick={() => { setData([]); setKeuanganImport(null); }}
                    className="text-xs font-bold text-danger hover:underline"
                  >
                    Batal
                  </button>
               </div>
               {keuanganImport && (
                 <div className="p-8 bg-accent/5 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                   {Object.entries(keuanganImport).map(([key, val]: [string, any]) => (
                     <div key={key} className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{key.replace(/_/g, ' ')}</p>
                       <p className="font-bold text-primary text-sm">{formatRupiah(val)}</p>
                     </div>
                   ))}
                 </div>
               )}
               <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Nama</th>
                        <th className="px-6 py-4">Barang</th>
                        <th className="px-6 py-4">Total Hutang</th>
                        <th className="px-6 py-4">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.map((row, i) => (
                        <tr key={i} className="text-xs font-medium">
                          <td className="px-6 py-4 font-bold">{row.nama}</td>
                          <td className="px-6 py-4 text-gray-500">{row.barang}</td>
                          <td className="px-6 py-4 font-bold text-primary">
                             {formatRupiah(row.uang_muka + (row.jumlah_angsuran * row.rp_per_angsuran))}
                          </td>
                          <td className="px-6 py-4 text-gray-400">{row.whatsapp_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               <div className="p-8 bg-gray-50/50 flex justify-end">
                  <button 
                    onClick={handleImport}
                    disabled={loading}
                    className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-3 hover:bg-primary-light transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Konfirmasi Import Data
                  </button>
               </div>
            </section>
          )}

          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded-2xl flex items-center gap-3 border border-danger/20 font-bold text-sm">
               <AlertCircle className="w-5 h-5" />
               {error}
            </div>
          )}
        </div>
      ) : (
        <section className="glass p-20 rounded-[40px] text-center space-y-6">
           <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center mx-auto shadow-xl shadow-success/20">
              <CheckCircle className="w-12 h-12 text-white" />
           </div>
           <h2 className="text-3xl font-bold">Import Berhasil!</h2>
           <p className="text-gray-500 font-medium">{data.length} nasabah telah ditambahkan ke sistem.</p>
           <p className="text-xs text-indicator font-bold uppercase tracking-widest animate-pulse">Mengarahkan ke halaman nasabah...</p>
        </section>
      )}
    </div>
  );
};
