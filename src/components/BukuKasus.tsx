import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Trash2, Download, Printer, ArrowLeft, ArrowRight, Edit2, ExternalLink } from 'lucide-react';
import { BukuKasus, Siswa, IdentitasSekolah, GuruBK } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface BukuKasusProps {
  kasus: BukuKasus[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (kasus: Omit<BukuKasus, 'id'>) => void;
  onUpdate: (id: string, kasus: Partial<BukuKasus>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const BukuKasusComponent: React.FC<BukuKasusProps> = ({
  kasus,
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentKasus, setCurrentKasus] = useState<BukuKasus | null>(null);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nisn: '',
    namaSiswa: '',
    kelas: '',
    jenisKasus: '',
    status: 'Baru',
    deskripsiKasus: '',
    tindakLanjut: '',
    buktiNama: '',
    buktiUrl: ''
  });

  const filteredData = kasus.filter(k =>
    k.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.nisn.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((k, idx) => ({
      'No.': idx + 1,
      'Tanggal': formatTanggalTabel(k.tanggal || ''),
      'Siswa': k.namaSiswa || '-',
      'Kelas': k.kelas || '-',
      'Jenis Kasus': k.jenisKasus || '-',
      'Status': k.status || '-',
      'Deskripsi Kasus': k.deskripsiKasus || '-',
      'Tindak Lanjut': k.tindakLanjut || '-',
      'Bukti': k.buktiNama || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku Kasus");
    XLSX.writeFile(wb, `Buku_Kasus_Siswa_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Buku Kasus Siswa - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Buku Kasus Kedisiplinan - ${identitas.namaSekolah}</h2>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Tanggal</th><th>Siswa</th><th>Kelas</th><th>Jenis</th><th>Status</th><th>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((k, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${formatTanggalTabel(k.tanggal || '')}</td>
                  <td>${k.namaSiswa || '-'}</td>
                  <td>${k.kelas || '-'}</td>
                  <td>${k.jenisKasus || '-'}</td>
                  <td>${k.status || '-'}</td>
                  <td>${k.deskripsiKasus || '-'}</td>
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
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Buku Kasus Kedisiplinan</h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Dokumentasi kasus pelanggaran siswa</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Kasus Baru
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
                <th className="px-4 py-3 font-bold">No</th>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold">Siswa</th>
                <th className="px-4 py-3 font-bold">Kelas</th>
                <th className="px-4 py-3 font-bold">Jenis Kasus</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Deskripsi</th>
                <th className="px-4 py-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Tidak ada data kasus</td>
                </tr>
              ) : (
                paginatedData.map((k, idx) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3 font-mono">{formatTanggalTabel(k.tanggal || '')}</td>
                    <td className="px-4 py-3 font-bold">{k.namaSiswa || '-'}</td>
                    <td className="px-4 py-3">{k.kelas || '-'}</td>
                    <td className="px-4 py-3">{k.jenisKasus || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                        k.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                        k.status === 'Dalam Proses' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {k.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm truncate">{k.deskripsiKasus || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
