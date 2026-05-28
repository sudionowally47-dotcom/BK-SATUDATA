import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, Download, Printer, 
  Calendar, Award, CheckSquare, ClipboardList, Plus
} from 'lucide-react';
import { Siswa, GuruBK, Kelas, LayananBK, AsesmenSiswa, SuratBK, JadwalKonseling, BukuKasus, HomeVisit, IdentitasSekolah } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface LaporanProps {
  siswa: Siswa[];
  guru: GuruBK[];
  kelas: Kelas[];
  layanan: LayananBK[];
  asesmen: AsesmenSiswa[];
  surat: SuratBK[];
  jadwal: JadwalKonseling[];
  kasus: BukuKasus[];
  visit: HomeVisit[];
  identitas: IdentitasSekolah;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const Laporan: React.FC<LaporanProps> = ({
  siswa,
  guru,
  layanan,
  asesmen,
  surat,
  jadwal,
  kasus,
  visit,
  identitas,
  triggerNotification
}) => {
  const [selectedModul, setSelectedModul] = useState<string>('layanan');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modules List
  const modules = [
    { value: 'siswa', label: 'Data Siswa' },
    { value: 'layanan', label: 'Layanan Bimbingan Konseling' },
    { value: 'asesmen', label: 'Hasil Asesmen Siswa' },
    { value: 'surat', label: 'Administrasi Surat BK' },
    { value: 'jadwal', label: 'Jadwal Konseling' },
    { value: 'kasus', label: 'Buku Kasus Kedisiplinan' },
    { value: 'visit', label: 'Home Visit (Kunjungan Rumah)' }
  ];

  // Dynamic Filtering Logic
  const getFilteredReportData = () => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    switch (selectedModul) {
      case 'siswa':
        // Siswa doesn't have custom dates in standard model, but we filter if created date is present
        return siswa.filter(s => {
          if (!s.createdAt) return true;
          const time = new Date(s.createdAt).getTime();
          return time >= start && time <= end;
        });
      case 'layanan':
        return layanan.filter(l => {
          const time = new Date(l.tanggal).getTime();
          return time >= start && time <= end;
        });
      case 'asesmen':
        return asesmen.filter(a => {
          const time = new Date(a.tanggal).getTime();
          return time >= start && time <= end;
        });
      case 'surat':
        return surat.filter(s => {
          const time = new Date(s.tanggal).getTime();
          return time >= start && time <= end;
        });
      case 'jadwal':
        return jadwal.filter(j => {
          const time = new Date(j.tanggal).getTime();
          return time >= start && time <= end;
        });
      case 'kasus':
        return kasus.filter(k => {
          const time = new Date(k.tanggal).getTime();
          return time >= start && time <= end;
        });
      case 'visit':
        return visit.filter(v => {
          const time = new Date(v.tanggalKunjungan).getTime();
          return time >= start && time <= end;
        });
      default:
        return [];
    }
  };

  const reportData = getFilteredReportData();

  // Excel Export
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      triggerNotification("Tidak ada data untuk diekspor pada rentang tanggal ini!", "error");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");
    XLSX.writeFile(wb, `Laporan_Rekap_${selectedModul}_${identitas.namaSekolah.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`);
    triggerNotification("Laporan rekap Excel berhasil diunduh!", "success");
  };

  // Print PDF Laporan
  const handlePrintPDF = () => {
    if (reportData.length === 0) {
      triggerNotification("Tidak ada data untuk dicetak!", "error");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableHeadersHtml = '';
    let tableRowsHtml = '';

    if (selectedModul === 'siswa') {
      tableHeadersHtml = `<tr><th>No</th><th>NISN</th><th>Nama Siswa</th><th>Kelas</th><th>JK</th><th>Agama</th><th>Orang Tua</th><th>Alamat</th></tr>`;
      tableRowsHtml = (reportData as Siswa[]).map((s, idx) => `
        <tr><td>${idx + 1}</td><td>${s.nisn}</td><td>${s.namaSiswa}</td><td>${s.kelas}</td><td>${s.jk}</td><td>${s.agama}</td><td>${s.orangTua}</td><td>${s.alamat}</td></tr>
      `).join('');
    } else if (selectedModul === 'layanan') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal</th><th>Jenis Layanan</th><th>Nama Siswa</th><th>Kelas</th><th>Jurnal Layanan</th></tr>`;
      tableRowsHtml = (reportData as LayananBK[]).map((l, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(l.tanggal)}</td><td>${l.jenisLayanan}</td><td>${l.namaSiswa}</td><td>${l.kelas}</td><td>${l.uraian}</td></tr>
      `).join('');
    } else if (selectedModul === 'asesmen') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal</th><th>Nama Siswa</th><th>Kelas</th><th>Kategori Asesmen</th><th>Hasil Analisis</th></tr>`;
      tableRowsHtml = (reportData as AsesmenSiswa[]).map((a, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(a.tanggal)}</td><td>${a.namaSiswa}</td><td>${a.kelas}</td><td>${a.jenisAsesmen}</td><td>${a.hasil}</td></tr>
      `).join('');
    } else if (selectedModul === 'surat') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal</th><th>Nomor Surat</th><th>Jenis Surat</th><th>Siswa</th><th>Kelas</th></tr>`;
      tableRowsHtml = (reportData as SuratBK[]).map((s, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(s.tanggal)}</td><td>${s.nomorSurat}</td><td>${s.jenisSurat}</td><td>${s.namaSiswa}</td><td>${s.kelas}</td></tr>
      `).join('');
    } else if (selectedModul === 'jadwal') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal</th><th>Waktu</th><th>Siswa</th><th>Kelas</th><th>Guru BK</th><th>Tipe</th><th>Status</th></tr>`;
      tableRowsHtml = (reportData as JadwalKonseling[]).map((j, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(j.tanggal || '')}</td><td>${j.waktu || '-'}</td><td>${j.namaSiswa || '-'}</td><td>${j.kelas || '-'}</td><td>${j.namaGuru || '-'}</td><td>${j.tipeKonseling || '-'}</td><td>${j.status || '-'}</td></tr>
      `).join('');
    } else if (selectedModul === 'kasus') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal</th><th>Nama Siswa</th><th>Kelas</th><th>Jenis Kasus</th><th>Status</th><th>Deskripsi</th></tr>`;
      tableRowsHtml = (reportData as BukuKasus[]).map((k, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(k.tanggal)}</td><td>${k.namaSiswa}</td><td>${k.kelas}</td><td>${k.jenisKasus}</td><td>${k.status}</td><td>${k.deskripsiKasus}</td></tr>
      `).join('');
    } else if (selectedModul === 'visit') {
      tableHeadersHtml = `<tr><th>No</th><th>Tanggal Kunjungan</th><th>Siswa</th><th>Kelas</th><th>Petugas</th><th>Temuan</th><th>Rekomendasi</th></tr>`;
      tableRowsHtml = (reportData as HomeVisit[]).map((v, idx) => `
        <tr><td>${idx + 1}</td><td>${formatTanggalTabel(v.tanggalKunjungan)}</td><td>${v.namaSiswa}</td><td>${v.kelas}</td><td>${v.petugas}</td><td>${v.temuan}</td><td>${v.rekomendasi}</td></tr>
      `).join('');
    }

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Rekapitulasi - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; text-transform: uppercase; }
            h4 { text-align: center; margin-top: 0; font-weight: normal; margin-bottom: 25px; }
            .info { margin-bottom: 15px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #fafafa; }
          </style>
        </head>
        <body>
          ${identitas.kopSuratUrl ? `
            <div style="width: 100%; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 10px; text-align: center;">
              <img src="${identitas.kopSuratUrl}" style="width: 100%; height: auto; max-height: 150px; object-fit: contain;" alt="Kop Surat" />
            </div>
          ` : `
            <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px;">
              <h2 style="margin: 0; text-transform: uppercase;">${identitas.namaSekolah}</h2>
              <p style="margin: 5px 0; font-size: 12px;">${identitas.alamat}</p>
            </div>
          `}
          <h2 style="text-align: center;">LAPORAN REKAPITULASI DOKUMEN BK</h2>
          <div class="info">
            Modul Data: <b>${modules.find(m => m.value === selectedModul)?.label}</b><br />
            Rentang Laporan: <b>${startDate}</b> s/d <b>${endDate}</b>
          </div>
          <table>
            <thead>
              ${tableHeadersHtml}
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 12px; line-height: 1.5;">
            <div style="width: 250px; text-align: left;">
              <div style="height: 1.5em;"></div>
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0 0 75px 0;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold;"><u>${identitas.kepalaSekolah}</u></p>
              <p style="margin: 0;">NIP. ${identitas.nipKepalaSekolah}</p>
            </div>
            <div style="width: 250px; text-align: left;">
              <p style="margin: 0;">${identitas.tempatTandaTangan}, ${identitas.tanggalDokumen}</p>
              <div style="height: 1.5em;"></div>
              <p style="margin: 0;">Guru BK</p>
              <p style="margin: 0 0 50px 0;">&nbsp;</p>
              <p style="margin: 0; font-weight: bold;"><u>${guru[0]?.nama || '..........................'}</u></p>
              <p style="margin: 0;">NIP. ${guru[0]?.nip || '..........................'}</p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-650" />
            Laporan Rekapitulasi
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Ekspor rekapitulasi data konseling per rentang waktu dalam format PDF dan Excel
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => { triggerNotification("Untuk mencatat berkas baru, silakan gunakan tombol Tambah pada sub-tab Data Siswa, Jurnal Layanan, Asesmen, atau Buku Kasus di sidebar.", "success"); }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            Catat Berkas Baru
          </button>
        </div>
      </div>

      {/* Control Filters Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Modul Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Pilih Modul Data*</label>
            <select
              value={selectedModul}
              onChange={(e) => setSelectedModul(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              {modules.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Mulai Tanggal*</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">Sampai Tanggal*</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-50 dark:border-slate-800/80 justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor Rekap Excel
          </button>
          
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap PDF
          </button>
        </div>
      </div>

      {/* Recap Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Laporan Modul</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">{reportData.length} Catatan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status Kelengkapan</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">100% Permanen di Awan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Sumber Database Utama</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Google Apps Script API</p>
          </div>
        </div>
      </div>

      {/* Preview Table of matching report records */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
            Pratinjau Data Laporan ({reportData.length} Baris ditemukan)
          </h3>
        </div>

        {reportData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl text-xs">
            Tidak ada kecocokan data untuk rentang tanggal ini. Silakan ubah filter.
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800/80 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No.</th>
                  <th className="px-4 py-3">Nama / Nomor Identitas</th>
                  <th className="px-4 py-3">Kelas / Detail Info</th>
                  <th className="px-4 py-3">Keterangan / Hasil Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-655 dark:text-slate-350">
                {reportData.map((row: any, idx) => {
                  let col1 = row.namaSiswa || row.nama || row.nomorSurat || row.id;
                  let col2 = row.kelas || row.jabatan || row.jenisLayanan || row.jenisSurat || '-';
                  let col3 = row.uraian || row.hasil || row.deskripsiKasus || row.tujuanKunjungan || row.noHp || '-';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-205">{col1}</td>
                      <td className="px-4 py-3 font-semibold">{col2}</td>
                      <td className="px-4 py-3 max-w-md truncate" title={col3}>{col3}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
