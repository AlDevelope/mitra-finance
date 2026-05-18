import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { formatRupiah } from '../lib/formulas';
import { Building2, Share2, MessageCircle, X as XIcon, Calculator } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface SimulasiShareCardProps {
  harga: number;
  uangMuka: number;
  pendanaan: number;
  weeklyTenors: any[];
  monthlyTenors: any[];
  calculateCicilan: (p: number, i: number, t: number) => number;
  calculateTotal: (p: number, i: number) => number;
  onClose: () => void;
}

export const SimulasiShareCard: React.FC<SimulasiShareCardProps> = ({
  harga,
  uangMuka,
  pendanaan,
  weeklyTenors,
  monthlyTenors,
  calculateCicilan,
  calculateTotal,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const [isProcessing, setIsProcessing] = React.useState(false);

  const shareToWA = async () => {
    if (cardRef.current === null) return;
    setIsProcessing(true);
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Simulasi-MitraFinance99.png`, { type: 'image/png' });

      // Build text for WA
      let text = `*SIMULASI ANGSURAN MITRA FINANCE 99*\n\n`;
      text += `Harga Barang: ${formatRupiah(harga)}\n`;
      text += `Uang Muka (DP): ${formatRupiah(uangMuka)}\n`;
      text += `Total Pendanaan: ${formatRupiah(pendanaan)}\n\n`;

      text += `*MINGGUAN*\n`;
      weeklyTenors.forEach(t => {
        text += `- ${t.label}: ${formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}/mgu\n`;
      });

      text += `\n*BULANAN*\n`;
      monthlyTenors.forEach(t => {
        text += `- ${t.label}: ${formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}/bln\n`;
      });

      text += `\nTerima kasih! Silakan hubungi kami untuk proses selanjutnya.`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Simulasi Angsuran',
          text: text
        });
      } else {
        const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waLink, '_blank');
        
        const link = document.createElement('a');
        link.download = `Simulasi-MitraFinance99.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to share/generate image', err);
      alert('Gagal memproses gambar untuk dibagikan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Simulasi-MitraFinance99.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white tracking-tight">Bagikan Simulasi</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Preview Gambar Bagikan</p>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} 
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-danger"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-gray-200/50">
          {/* Card to Capture */}
          <div ref={cardRef} className={`${isDarkMode ? 'bg-[#0A1628]' : 'bg-white'} p-8 md:p-10 ${isDarkMode ? 'text-white' : 'text-gray-900'} w-full sm:w-[450px] mx-auto rounded-[48px] flex flex-col relative overflow-hidden shadow-2xl`}>
             <div className={`absolute top-[-50px] right-[-100px] w-80 h-80 ${isDarkMode ? 'bg-primary/10' : 'bg-primary/5'} rounded-full blur-[100px] pointer-events-none`} />
             <div className={`absolute bottom-[-50px] left-[-100px] w-80 h-80 ${isDarkMode ? 'bg-accent/10' : 'bg-accent/5'} rounded-full blur-[100px] pointer-events-none`} />
             
             {/* Header */}
             <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-4">
                 {settings?.logo_url ? (
                   <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-2xl" />
                 ) : (
                   <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                     <Building2 className="w-7 h-7 text-white" />
                   </div>
                 )}
                 <div>
                   <h1 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'} leading-none`}>Mitra Finance 99</h1>
                   <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium italic mt-1.5`}>Sistem Pembiayaan Digital</p>
                 </div>
               </div>
             </div>

             {/* Main Info */}
             <div className={`${isDarkMode ? 'bg-[#15233D]' : 'bg-gray-50'} rounded-[32px] p-6 relative z-10 border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} shadow-sm mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                     <Calculator className="w-5 h-5 text-accent" />
                     <h2 className={`text-sm font-black ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} tracking-widest uppercase`}>Simulasi Harga</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                       <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-1`}>Harga Barang</p>
                       <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-primary'} leading-none`}>{formatRupiah(harga)}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                     <div>
                       <p className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-1`}>Uang Muka</p>
                       <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-none`}>{formatRupiah(uangMuka)}</p>
                     </div>
                     <div className="text-right">
                       <p className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest mb-1`}>Pendanaan</p>
                       <p className={`text-lg font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'} leading-none`}>{formatRupiah(pendanaan)}</p>
                     </div>
                  </div>
                </div>
             </div>

             {/* Pilihan Tenor Mingguan */}
             <div className="mb-6 relative z-10">
               <h3 className={`text-[11px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-3 px-2`}>Opsi Cicilan Mingguan</h3>
               <div className="space-y-2">
                 {weeklyTenors.map((t, i) => (
                    <div key={`w-${i}`} className={`${isDarkMode ? 'bg-[#0A1628]/80' : 'bg-white'} border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} rounded-2xl p-4 flex justify-between items-center shadow-sm`}>
                       <div>
                         <p className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-widest`}>{t.label}</p>
                         <p className={`text-[8px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Total: {formatRupiah(calculateTotal(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-[8px] font-bold text-accent uppercase tracking-widest mb-1`}>Per Minggu</p>
                         <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-primary'} leading-none`}>{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</p>
                       </div>
                    </div>
                 ))}
               </div>
             </div>

             {/* Pilihan Tenor Bulanan */}
             <div className="mb-6 relative z-10">
               <h3 className={`text-[11px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-3 px-2`}>Opsi Cicilan Bulanan</h3>
               <div className="space-y-2">
                 {monthlyTenors.map((t, i) => (
                    <div key={`m-${i}`} className={`${isDarkMode ? 'bg-[#0A1628]/80' : 'bg-white'} border ${isDarkMode ? 'border-white/5' : 'border-gray-100'} rounded-2xl p-4 flex justify-between items-center shadow-sm`}>
                       <div>
                         <p className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-widest`}>{t.label}</p>
                         <p className={`text-[8px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Total: {formatRupiah(calculateTotal(pendanaan, t.interest))}</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-[8px] font-bold text-accent uppercase tracking-widest mb-1`}>Per Bulan</p>
                         <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-primary'} leading-none`}>{formatRupiah(calculateCicilan(pendanaan, t.interest, t.tenor))}</p>
                       </div>
                    </div>
                 ))}
               </div>
             </div>

             <div className={`mt-4 text-center border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'} pt-6 relative z-10`}>
               <p className={`text-[10px] ${isDarkMode ? 'text-white' : 'text-primary'} font-black tracking-widest uppercase`}>Mitra Finance 99</p>
               <p className={`text-[8px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 uppercase tracking-[0.4em]`}>Angka dapat berubah sesuai kesepakatan</p>
             </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-white/5 shrink-0 flex flex-col gap-3">
          <button 
            disabled={isProcessing}
            onClick={shareToWA}
            className="w-full bg-green-500 text-white py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            <MessageCircle className="w-5 h-5" />
            {isProcessing ? 'Memproses Gambar...' : 'Bagikan ke WhatsApp'}
          </button>
          <button 
            onClick={downloadImage}
            className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 py-3 rounded-[16px] font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Simpan Gambar
          </button>
        </div>
      </div>
    </div>
  );
};
