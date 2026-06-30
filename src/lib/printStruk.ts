import { Nasabah, Angsuran, Settings } from '../types';
import { formatRupiah, formatDisplayDate } from './formulas';

export interface PrintStrukArgs {
  nasabah: Nasabah;
  history?: Angsuran[];
  settings?: Settings | null;
  isLunas?: boolean;
}

// Escape teks agar aman dimasukkan ke dalam HTML.
const esc = (val: unknown): string => {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const buildStrukHtml = (args: PrintStrukArgs): string => {
  const nasabah = args.nasabah;
  const history = args.history || [];
  const settings = args.settings || null;
  const isLunas = args.isLunas || false;

  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const tglCetak = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();
  const jamCetak = pad(now.getHours()) + ':' + pad(now.getMinutes());

  const satuan = nasabah.satuan || 'Minggu';
  const totalDibayar = (nasabah.total_hutang || 0) - (nasabah.sisa_hutang || 0);
  const idPart = esc(nasabah.id).slice(0, 6).toUpperCase();
  const noRef = 'MF99-' + idPart + '-' + now.getTime().toString().slice(-6);

  const logo = settings && settings.logo_url
    ? '<img src="' + esc(settings.logo_url) + '" alt="logo" class="logo" />'
    : '';

  const sortedHistory = history.slice().sort((a, b) => a.angsuran_ke - b.angsuran_ke);

  const riwayatRows = sortedHistory.length > 0
    ? sortedHistory.map((h) => {
        const jml = h.jumlah_bayar ? h.jumlah_bayar : nasabah.rp_per_angsuran;
        return '<div class="row small"><span>MGU ' + esc(h.angsuran_ke) + ' &bull; ' + esc(formatDisplayDate(h.tanggal_bayar)) + '</span><span class="bold">' + esc(formatRupiah(jml)) + '</span></div>';
      }).join('')
    : '<div class="center muted">Belum ada pembayaran tercatat</div>';

  const lastPayment = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
  const lastPaymentRow = lastPayment
    ? '<div class="row small"><span>Bayar Terakhir</span><span class="bold">' + esc(formatDisplayDate(lastPayment.tanggal_bayar)) + ' (MGU ' + esc(lastPayment.angsuran_ke) + ')</span></div>'
    : '';

  const titleText = isLunas ? 'SERTIFIKAT PELUNASAN' : 'BUKTI ANGSURAN';
  const statusText = isLunas ? 'LUNAS TOTAL' : esc(nasabah.status);
  const lunasNote = isLunas ? 'Selamat! Seluruh angsuran telah LUNAS.<br/>' : '';

  return '<!DOCTYPE html>'
    + '<html lang="id">'
    + '<head>'
    + '<meta charset="utf-8" />'
    + '<meta name="viewport" content="width=device-width, initial-scale=1" />'
    + '<title>Bukti Angsuran - ' + esc(nasabah.nama) + '</title>'
    + '<style>'
    + '@page { size: 58mm auto; margin: 0; }'
    + '* { margin: 0; padding: 0; box-sizing: border-box; }'
    + 'html, body { width: 58mm; background: #ffffff; }'
    + 'body { font-family: "Courier New", ui-monospace, monospace; color: #000000; padding: 4mm 3mm 6mm; font-size: 11px; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }'
    + '.center { text-align: center; }'
    + '.bold { font-weight: 700; }'
    + '.brand { font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }'
    + '.tagline { font-size: 9px; font-style: italic; margin-top: 1px; }'
    + '.logo { width: 16mm; height: 16mm; object-fit: contain; display: block; margin: 0 auto 2mm; }'
    + '.title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }'
    + '.divider { border-top: 1px dashed #000000; margin: 6px 0; }'
    + '.row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }'
    + '.row span:last-child { text-align: right; }'
    + '.muted { font-size: 9px; color: #333333; }'
    + '.small { font-size: 10px; }'
    + '.label { text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }'
    + '.name { font-size: 14px; font-weight: 800; text-transform: uppercase; word-break: break-word; }'
    + '.obj { font-size: 11px; word-break: break-word; }'
    + '.total-box { border: 1.5px solid #000000; padding: 4px 6px; margin: 6px 0; text-align: center; }'
    + '.total-val { font-size: 15px; font-weight: 800; }'
    + '.badge { display: inline-block; border: 1.5px solid #000000; padding: 2px 10px; font-weight: 800; font-size: 12px; letter-spacing: 1px; border-radius: 4px; margin-top: 4px; }'
    + '.foot { font-size: 9px; text-align: center; margin-top: 4px; line-height: 1.6; }'
    + '.stamp { margin-top: 10px; text-align: center; font-size: 9px; }'
    + '.sign-space { height: 38px; }'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<div class="center">'
    + logo
    + '<div class="brand">Mitra Finance 99</div>'
    + '<div class="tagline">Berkembang, Bertumbuh, Berinovasi</div>'
    + '<div class="muted" style="margin-top:2px;">Manajemen Pembiayaan &amp; Angsuran</div>'
    + '<div class="title">' + titleText + '</div>'
    + '</div>'
    + '<div class="divider"></div>'
    + '<div class="row small"><span>Tanggal</span><span class="bold">' + tglCetak + ' ' + jamCetak + '</span></div>'
    + '<div class="row small"><span>No. Bukti</span><span class="bold">' + noRef + '</span></div>'
    + '<div class="row small"><span>Petugas</span><span class="bold">Admin</span></div>'
    + '<div class="divider"></div>'
    + '<div class="label">Nama Nasabah</div>'
    + '<div class="name">' + esc(nasabah.nama) + '</div>'
    + '<div class="obj">' + esc(nasabah.barang) + '</div>'
    + '<div class="center"><span class="badge">' + statusText + '</span></div>'
    + '<div class="divider"></div>'
    + '<div class="row"><span>Cicilan Ke</span><span class="bold">' + esc(nasabah.angsuran_terbayar) + ' / ' + esc(nasabah.jumlah_angsuran) + ' ' + esc(satuan) + '</span></div>'
    + '<div class="row"><span>Angsuran / ' + esc(satuan) + '</span><span class="bold">' + esc(formatRupiah(nasabah.rp_per_angsuran)) + '</span></div>'
    + '<div class="row"><span>Uang Muka</span><span class="bold">' + esc(formatRupiah(nasabah.uang_muka)) + '</span></div>'
    + '<div class="row"><span>Total Hutang</span><span class="bold">' + esc(formatRupiah(nasabah.total_hutang)) + '</span></div>'
    + '<div class="row"><span>Total Dibayar</span><span class="bold">' + esc(formatRupiah(totalDibayar)) + '</span></div>'
    + '<div class="row"><span>Sisa ' + esc(satuan) + '</span><span class="bold">' + esc(nasabah.sisa_angsuran) + ' ' + esc(satuan) + '</span></div>'
    + '<div class="row"><span>Progres</span><span class="bold">' + esc(nasabah.progress_persen) + '%</span></div>'
    + '<div class="total-box"><div class="label">Sisa Cicilan</div><div class="total-val">' + esc(formatRupiah(nasabah.sisa_hutang)) + '</div></div>'
    + lastPaymentRow
    + '<div class="divider"></div>'
    + '<div class="label center">Riwayat Pembayaran</div>'
    + '<div style="margin-top:4px;">' + riwayatRows + '</div>'
    + '<div class="divider"></div>'
    + '<div class="foot">' + lunasNote + 'Simpan struk ini sebagai bukti pembayaran yang sah.<br/>Terima kasih atas kepercayaan Anda.</div>'
    + '<div class="stamp"><div>Hormat kami,</div><div class="sign-space"></div><div class="bold">( Admin Mitra Finance 99 )</div></div>'
    + '<div class="center muted" style="margin-top:8px;">&mdash; Mitra Finance 99 &mdash;</div>'
    + '</body>'
    + '</html>';
};

// Membuka struk pada iframe tersembunyi lalu memicu dialog cetak browser.
// Aman dari popup-blocker dan bekerja di HP maupun laptop/desktop.
export const printStrukBukti = (args: PrintStrukArgs): void => {
  const html = buildStrukHtml(args);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win ? win.document : null;
  if (!win || !doc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let done = false;
  const triggerPrint = (): void => {
    if (done) return;
    done = true;
    try {
      win.focus();
      win.print();
    } catch (err) {
      console.error('Gagal mencetak struk:', err);
    }
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1500);
  };

  win.onload = () => window.setTimeout(triggerPrint, 250);
  window.setTimeout(triggerPrint, 1200);
};
