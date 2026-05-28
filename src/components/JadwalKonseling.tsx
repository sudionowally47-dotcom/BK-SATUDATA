import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Trash2, Download, Printer, ArrowLeft, ArrowRight, Edit2, Eye } from 'lucide-react';
import { JadwalKonseling, Siswa, GuruBK, IdentitasSekolah } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface JadwalKonselingProps {
  jadwal: JadwalKonseling[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (jadwal: Omit<JadwalKonseling, 'id'>) => void;
  onUpdate: (id: string, jadwal: Partial<JadwalKonseling>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const JadwalKonselingComponent: React.FC<JadwalKonselingProps> = ({
  jadwal,
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
  const [currentJadwal, setCurrentJadwal] = useState<JadwalKonseling | null>(null);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    nisn: '',
    namaSiswa: '',
    kelas: '',
    nipGuru: '',
    namaGuru: '',
    tipeKonseling: 'Konseling Individual',
    statusKehadiran: 'Menunggu',
    keterangan: ''
  });

  const filteredData = jadwal.filter(j =>
    j.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.nisn.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.nipGuru) {
      triggerNotification("Siswa dan Guru BK harus dipilih!", "error");
      return;
    }
    onAdd(formData);
    setIsAddModalOpen(false);
    triggerNotification("Jadwal Konseling berhasil ditambahkan!", "success");
  };

  const handleUpdateStatus = (id: string, status: any) => {
    onUpdate(id, { statusKehadiran: status });
    triggerNotification(`Kehadiran siswa berhasil diubah ke ${status}!`, "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      onDelete(id);
      triggerNotification("Jadwal berhasil dihapus!", "success");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((j, idx) => ({
      'No.': idx + 1,
      'Tanggal': formatTanggalTabel(j.tanggal || ''),
      'Waktu': j.waktu || '-',
      'Siswa': j.namaSiswa || '-',
      'Kelas': j.kelas || '-',
      'Guru BK': j.namaGuru || '-',
      'Tipe Konseling': j.tipeKonseling || '-',
      'Status Kehadiran': j.statusKehadiran || '-',
      'Keterangan': j.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Konseling");
    XLSX.writeFile(wb, `Jadwal_Konseling_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Jadwal Konseling - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            h4 { text-align: center; margin-top: 0; font-weight: normal; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${identitas.namaSekolah}</h2>
          <h4>Jadwal Konseling</h4>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Tanggal</th><th>Waktu</th><th>Siswa</th><th>Kelas</th><th>Guru BK</th><th>Tipe</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((j, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${formatTanggalTabel(j.tanggal || '')}</td>
                  <td>${j.waktu || '-'}</td>
                  <td>${j.namaSiswa || '-'}</td>
                  <td>${j.kelas || '-'}</td>
                  <td>${j.namaGuru || '-'}</td>
                  <td>${j.tipeKonseling || '-'}</td>
                  <td>${j.statusKehadiran || '-'}</td>
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
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Jadwal Konseling</h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Kelola jadwal pertemuan konseling siswa</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal
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
                <th className="px-4 py-3 font-bold">Waktu</th>
                <th className="px-4 py-3 font-bold">Siswa</th>
                <th className="px-4 py-3 font-bold">Kelas</th>
                <th className="px-4 py-3 font-bold">Guru BK</th>
                <th className="px-4 py-3 font-bold">Tipe</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">Tidak ada data jadwal konseling</td>
                </tr>
              ) : (
                paginatedData.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3 font-mono">{formatTanggalTabel(j.tanggal || '')}</td>
                    <td className="px-4 py-3">{j.waktu || '-'}</td>
                    <td className="px-4 py-3 font-bold">{j.namaSiswa || '-'}</td>
                    <td className="px-4 py-3">{j.kelas || '-'}</td>
                    <td className="px-4 py-3">{j.namaGuru || '-'}</td>
                    <td className="px-4 py-3">{j.tipeKonseling || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                        j.statusKehadiran === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                        j.statusKehadiran === 'Tidak Hadir' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {j.statusKehadiran || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(j.id)}
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
