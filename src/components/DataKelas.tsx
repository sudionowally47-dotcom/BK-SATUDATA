import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, School 
} from 'lucide-react';
import { Kelas, IdentitasSekolah, GuruBK } from '../types';

interface DataKelasProps {
  kelas: Kelas[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (kelas: Omit<Kelas, 'id'>) => void;
  onUpdate: (id: string, kelas: Partial<Kelas>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const DataKelas: React.FC<DataKelasProps> = ({
  kelas,
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
  const [currentKelas, setCurrentKelas] = useState<Kelas | null>(null);

  const [formData, setFormData] = useState({
    namaKelas: '',
    tingkat: 'VII',
    waliKelas: ''
  });

  const filteredData = kelas.filter(k => 
    k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.tingkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      namaKelas: '',
      tingkat: 'VII',
      waliKelas: ''
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (k: Kelas) => {
    setCurrentKelas(k);
    setFormData({
      namaKelas: k.namaKelas,
      tingkat: k.tingkat,
      waliKelas: k.waliKelas
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKelas.trim()) {
      triggerNotification("Nama Kelas tidak boleh kosong!", "error");
      return;
    }
    if (!formData.waliKelas.trim()) {
      triggerNotification("Wali Kelas tidak boleh kosong!", "error");
      return;
    }
    try {
      onAdd(formData);
      setIsAddModalOpen(false);
      triggerNotification("Data Kelas berhasil ditambahkan!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menambahkan kelas", "error");
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKelas) return;
    if (!formData.namaKelas.trim()) {
      triggerNotification("Nama Kelas tidak boleh kosong!", "error");
      return;
    }
    if (!formData.waliKelas.trim()) {
      triggerNotification("Wali Kelas tidak boleh kosong!", "error");
      return;
    }
    try {
      onUpdate(currentKelas.id, formData);
      setIsEditModalOpen(false);
      triggerNotification("Data Kelas berhasil diperbarui!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal memperbarui kelas", "error");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data kelas ini?")) {
      onDelete(id);
      triggerNotification("Data Kelas berhasil dihapus!", "success");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((k, idx) => ({
      'No.': idx + 1,
      'Nama Kelas': k.namaKelas,
      'Tingkat': k.tingkat,
      'Wali Kelas': k.waliKelas
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kelas");
    XLSX.writeFile(wb, "Data_Kelas_SMPN4_Fakfak.xlsx");
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Data Kelas - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            h4 { text-align: center; margin-top: 0; font-weight: normal; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
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
          <h2 style="text-align: center;">LAPORAN DATA KELAS</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">No</th>
                <th>Nama Kelas</th>
                <th>Tingkat</th>
                <th>Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((k, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-weight: bold;">${k.namaKelas}</td>
                  <td>${k.tingkat}</td>
                  <td>${k.waliKelas}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 20px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 11pt; line-height: 1.4; font-family: 'Times New Roman', Times, serif;">
            <div style="width: 280px; text-align: left;">
              <div style="height: 1.5em;"></div>
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0 0 75px 0;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold;"><u>${identitas.kepalaSekolah}</u></p>
              <p style="margin: 0;">NIP. ${identitas.nipKepalaSekolah}</p>
            </div>
            <div style="width: 280px; text-align: left;">
              <p style="margin: 0;">${identitas.tempatTandaTangan}, ${identitas.tanggalDokumen}</p>
              <div style="height: 1.5em;"></div>
              <p style="margin: 0;">Guru BK</p>
              <p style="margin: 0 0 55px 0;">&nbsp;</p>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <School className="w-7 h-7 text-indigo-650" />
            Data Kelas
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Kelola data pembagian rombel (rombongan belajar) sekolah
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </button>
          
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-55/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button 
            onClick={handlePrintPDF} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-55/10 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari kelas, tingkat, wali kelas..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">Nama Kelas</th>
                <th className="px-6 py-4">Tingkat</th>
                <th className="px-6 py-4">Wali Kelas</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan data kelas.
                  </td>
                </tr>
              ) : (
                paginatedData.map((k, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-405">{no}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-250">{k.namaKelas}</td>
                      <td className="px-6 py-4 text-slate-655 dark:text-slate-400">{k.tingkat}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{k.waliKelas}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(k)}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(k.id)}
                            className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Kelas
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-55/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-750 dark:text-slate-350 px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-55/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Kelas Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Tambah Data Kelas</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tingkat Kelas*</label>
                <select 
                  value={formData.tingkat}
                  onChange={(e) => setFormData({...formData, tingkat: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                  required
                >
                  <option value="VII">Tingkat VII</option>
                  <option value="VIII">Tingkat VIII</option>
                  <option value="IX">Tingkat IX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Kelas (Rombel)*</label>
                <input 
                  type="text" 
                  value={formData.namaKelas}
                  onChange={(e) => setFormData({...formData, namaKelas: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Contoh: VII-C atau VIII-A"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Wali Kelas*</label>
                <input 
                  type="text" 
                  value={formData.waliKelas}
                  onChange={(e) => setFormData({...formData, waliKelas: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Nama Lengkap Wali Kelas & Gelar"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Kelas Modal */}
      {isEditModalOpen && currentKelas && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-955">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Ubah Data Kelas</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tingkat Kelas*</label>
                <select 
                  value={formData.tingkat}
                  onChange={(e) => setFormData({...formData, tingkat: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                  required
                >
                  <option value="VII">Tingkat VII</option>
                  <option value="VIII">Tingkat VIII</option>
                  <option value="IX">Tingkat IX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Kelas (Rombel)*</label>
                <input 
                  type="text" 
                  value={formData.namaKelas}
                  onChange={(e) => setFormData({...formData, namaKelas: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Contoh: VII-C atau VIII-A"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Wali Kelas*</label>
                <input 
                  type="text" 
                  value={formData.waliKelas}
                  onChange={(e) => setFormData({...formData, waliKelas: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-55/30 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Nama Lengkap Wali Kelas & Gelar"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
