import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Trash2, Download, Printer, ArrowLeft, ArrowRight, Edit2, Eye } from 'lucide-react';
import { SuratBK, Siswa, IdentitasSekolah, GuruBK } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface SuratBKProps {
  surat: SuratBK[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (surat: Omit<SuratBK, 'id'>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const SuratBKComponent: React.FC<SuratBKProps> = ({
  surat,
  siswa,
  guru,
  identitas,
  onAdd,
  onDelete,
  triggerNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredData = surat.filter(s =>
    (s.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nisn || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((s, idx) => ({
      'No.': idx + 1,
      'Nomor Surat': s.nomorSurat || '-',
      'Tanggal': formatTanggalTabel(s.tanggal || ''),
      'Jenis Surat': s.jenisSurat || '-',
      'Siswa Penerima': s.namaSiswa || '-',
      'Kelas': s.kelas || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Surat BK");
    XLSX.writeFile(wb, `Surat_BK_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus surat ini?")) {
      onDelete(id);
      triggerNotification("Surat berhasil dihapus!", "success");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Administrasi Surat BK</h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Kelola surat panggilan, pernyataan, dan keterangan</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Surat Baru
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="px-6 py-4 w-12 text-center font-bold">No.</th>
                <th className="px-6 py-4 font-bold">Nomor Surat</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Jenis Surat</th>
                <th className="px-6 py-4 font-bold">Siswa Penerima</th>
                <th className="px-6 py-4 font-bold">Kelas</th>
                <th className="px-6 py-4 text-center font-bold">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Tidak ditemukan arsip surat BK</td>
                </tr>
              ) : (
                paginatedData.map((s, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{s.nomorSurat || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-655 dark:text-slate-400 whitespace-nowrap">{formatTanggalTabel(s.tanggal || '')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          s.jenisSurat === 'Surat Panggilan Siswa' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          s.jenisSurat === 'Surat Pernyataan' ? 'bg-rose-100 text-rose-800 dark:bg-rose-955 dark:text-rose-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.jenisSurat || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-205">{s.namaSiswa || '-'}</td>
                      <td className="px-6 py-4 font-semibold">{s.kelas || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
