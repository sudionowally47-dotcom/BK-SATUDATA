import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Trash2, Download, Printer, ArrowLeft, ArrowRight, Edit2, ExternalLink } from 'lucide-react';
import { HomeVisit, Siswa, IdentitasSekolah, GuruBK } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface HomeVisitProps {
  visit: HomeVisit[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (visit: Omit<HomeVisit, 'id'>) => void;
  onUpdate: (id: string, visit: Partial<HomeVisit>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const HomeVisitComponent: React.FC<HomeVisitProps> = ({
  visit,
  siswa,
  guru,
  identitas,
  onAdd,
  onUpdate,
  onDelete,
  triggerNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredData = visit.filter(v =>
    (v.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.nisn || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((v, idx) => ({
      'No.': idx + 1,
      'Tanggal Kunjungan': formatTanggalTabel(v.tanggalKunjungan || ''),
      'Siswa': v.namaSiswa || '-',
      'Kelas': v.kelas || '-',
      'Petugas': v.petugas || '-',
      'Tujuan': v.tujuanKunjungan || '-',
      'Temuan': v.temuan || '-',
      'Rekomendasi': v.rekomendasi || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Home Visit");
    XLSX.writeFile(wb, `Home_Visit_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Home Visit - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Laporan Home Visit - ${identitas.namaSekolah}</h2>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Tanggal</th><th>Siswa</th><th>Kelas</th><th>Petugas</th><th>Tujuan</th><th>Temuan</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((v, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${formatTanggalTabel(v.tanggalKunjungan || '')}</td>
                  <td>${v.namaSiswa || '-'}</td>
                  <td>${v.kelas || '-'}</td>
                  <td>${v.petugas || '-'}</td>
                  <td>${v.tujuanKunjungan || '-'}</td>
                  <td>${v.temuan || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Home Visit (Kunjungan Rumah)</h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Laporan kunjungan rumah ke siswa</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Kunjungan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Cari nama siswa atau NISN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="px-6 py-4 font-bold">No</th>
                <th className="px-6 py-4 font-bold">Tanggal Kunjungan</th>
                <th className="px-6 py-4 font-bold">Nama Siswa</th>
                <th className="px-6 py-4 font-bold">Kelas</th>
                <th className="px-6 py-4 font-bold">Petugas / Konselor</th>
                <th className="px-6 py-4 font-bold">Tujuan Kunjungan</th>
                <th className="px-6 py-4 font-bold">Temuan Kunjungan</th>
                <th className="px-6 py-4 font-bold">Rekomendasi</th>
                <th className="px-6 py-4 font-bold">Bukti</th>
                <th className="px-6 py-4 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">Tidak ditemukan data laporan kunjungan rumah</td>
                </tr>
              ) : (
                paginatedData.map((v, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-705 dark:text-slate-400 whitespace-nowrap">{formatTanggalTabel(v.tanggalKunjungan || '')}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-850 dark:text-slate-205">{v.namaSiswa || '-'}</div>
                        <div className="text-[10px] font-mono text-slate-400">NISN: {v.nisn || '-'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{v.kelas || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-350">{v.petugas || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={v.tujuanKunjungan || '-'}>{v.tujuanKunjungan || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={v.temuan || '-'}>{v.temuan || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={v.rekomendasi || '-'}>{v.rekomendasi || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {v.dokumentasiNama ? (
                          <a 
                            href={v.dokumentasiUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {v.dokumentasiNama}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
