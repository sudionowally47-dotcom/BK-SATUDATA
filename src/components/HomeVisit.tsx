import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, Home, Paperclip, FileText, ExternalLink 
} from 'lucide-react';
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

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<HomeVisit | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    tanggalKunjungan: new Date().toISOString().split('T')[0],
    nisn: '',
    namaSiswa: '',
    kelas: '',
    petugas: 'Marlina Gewab, S.Psi.',
    tujuanKunjungan: '',
    alamat: '',
    temuan: '',
    rekomendasi: '',
    dokumentasiNama: '',
    dokumentasiUrl: ''
  });

  const handleSimulateUpload = () => {
    const photos = [
      'Foto_Kunjungan_Rumah_1.jpg',
      'Foto_Kunjungan_Rumah_2.jpg',
      'Dokumentasi_HomeVisit_Wagom.png',
      'Bukti_Kunjungan_Siswa.jpg'
    ];
    const randomFile = photos[Math.floor(Math.random() * photos.length)];
    const mockDriveUrl = `https://drive.google.com/file/d/mockId_visit_${Math.random().toString(36).substr(2,9)}/view`;
    
    setFormData(prev => ({
      ...prev,
      dokumentasiNama: randomFile,
      dokumentasiUrl: mockDriveUrl
    }));
    triggerNotification("Gambar bukti berhasil diunggah!", "success");
  };

  const filteredData = visit.filter(v => 
    v.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.petugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.tujuanKunjungan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.temuan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      tanggalKunjungan: new Date().toISOString().split('T')[0],
      nisn: siswa[0]?.nisn || '',
      namaSiswa: siswa[0]?.namaSiswa || '',
      kelas: siswa[0]?.kelas || '',
      petugas: 'Marlina Gewab, S.Psi.',
      tujuanKunjungan: '',
      alamat: siswa[0]?.alamat || '',
      temuan: '',
      rekomendasi: '',
      dokumentasiNama: '',
      dokumentasiUrl: ''
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: HomeVisit) => {
    setCurrentVisit(v);
    setFormData({
      tanggalKunjungan: v.tanggalKunjungan,
      nisn: v.nisn,
      namaSiswa: v.namaSiswa,
      kelas: v.kelas,
      petugas: v.petugas,
      tujuanKunjungan: v.tujuanKunjungan,
      alamat: v.alamat,
      temuan: v.temuan,
      rekomendasi: v.rekomendasi,
      dokumentasiNama: v.dokumentasiNama || '',
      dokumentasiUrl: v.dokumentasiUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleStudentChange = (nisn: string) => {
    const s = siswa.find(x => x.nisn === nisn);
    if (s) {
      setFormData(prev => ({
        ...prev,
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        kelas: s.kelas,
        alamat: s.alamat
      }));
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tujuanKunjungan.trim() || !formData.temuan.trim() || !formData.rekomendasi.trim()) {
      triggerNotification("Tujuan, temuan, dan rekomendasi wajib diisi!", "error");
      return;
    }
    onAdd(formData);
    setIsAddModalOpen(false);
    triggerNotification("Laporan Kunjungan Rumah berhasil disimpan!", "success");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVisit) return;
    if (!formData.tujuanKunjungan.trim() || !formData.temuan.trim() || !formData.rekomendasi.trim()) {
      triggerNotification("Tujuan, temuan, dan rekomendasi wajib diisi!", "error");
      return;
    }
    onUpdate(currentVisit.id, formData);
    setIsEditModalOpen(false);
    triggerNotification("Data kunjungan rumah berhasil diperbarui!", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data kunjungan rumah ini?")) {
      onDelete(id);
      triggerNotification("Data kunjungan rumah berhasil dihapus!", "success");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((v, idx) => ({
      'No.': idx + 1,
      'Tanggal Kunjungan': formatTanggalTabel(v.tanggalKunjungan),
      'Nama Siswa': v.namaSiswa,
      'Kelas': v.kelas,
      'Petugas/Guru BK': v.petugas,
      'Tujuan Kunjungan': v.tujuanKunjungan,
      'Alamat': v.alamat,
      'Temuan Lapangan': v.temuan,
      'Rekomendasi': v.rekomendasi,
      'Dokumentasi': v.dokumentasiNama || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Home Visit");
    XLSX.writeFile(wb, `Laporan_HomeVisit_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Kunjungan Rumah - ${identitas.namaSekolah}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            h4 { text-align: center; margin-top: 0; font-weight: normal; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
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
          <h2 style="text-align: center;">LAPORAN KUNJUNGAN RUMAH (HOME VISIT)</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="width: 80px;">Tanggal Kunjungan</th>
                <th style="width: 130px;">Siswa</th>
                <th style="width: 60px;">Kelas</th>
                <th style="width: 120px;">Petugas / Konselor</th>
                <th>Tujuan & Alamat</th>
                <th>Temuan Kunjungan</th>
                <th>Rekomendasi</th>
                <th>Dokumentasi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((v, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${formatTanggalTabel(v.tanggalKunjungan)}</td>
                  <td><b>${v.namaSiswa}</b><br><small>NISN: ${v.nisn}</small></td>
                  <td>${v.kelas}</td>
                  <td>${v.petugas}</td>
                  <td><b>Tujuan:</b> ${v.tujuanKunjungan}<br><b>Alamat:</b> ${v.alamat}</td>
                  <td>${v.temuan}</td>
                  <td>${v.rekomendasi}</td>
                  <td>${v.dokumentasiNama || '-'}</td>
                </tr>
              `).join('')}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Home className="w-7 h-7 text-indigo-650" />
            Home Visit
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Catat hasil kunjungan rumah (home visit) siswa untuk memperkuat kemitraan dengan orang tua
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Laporan Kunjungan
          </button>
          
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-55/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button 
            onClick={handlePrintPDF} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-55/10 cursor-pointer"
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
            placeholder="Cari siswa, petugas, temuan..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-205"
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
                <th className="px-6 py-4">Tanggal Kunjungan</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Petugas / Konselor</th>
                <th className="px-6 py-4">Tujuan Kunjungan</th>
                <th className="px-6 py-4">Temuan Kunjungan</th>
                <th className="px-6 py-4">Rekomendasi</th>
                <th className="px-6 py-4">Bukti</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan data laporan kunjungan rumah.
                  </td>
                </tr>
              ) : (
                paginatedData.map((v, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-705 dark:text-slate-400 whitespace-nowrap">{formatTanggalTabel(v.tanggalKunjungan)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-850 dark:text-slate-205">{v.namaSiswa}</div>
                        <div className="text-[10px] font-mono text-slate-400">NISN: {v.nisn}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{v.kelas}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-350">{v.petugas}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={v.tujuanKunjungan}>{v.tujuanKunjungan}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={v.temuan}>{v.temuan}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={v.rekomendasi}>{v.rekomendasi}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {v.dokumentasiNama ? (
                          <a 
                            href={v.dokumentasiUrl} 
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id)}
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Kunjungan
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-55/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-755 dark:text-slate-350 px-2">
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

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                {isAddModalOpen ? 'Tambah Laporan Kunjungan Rumah' : 'Ubah Data Kunjungan'}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Tanggal Kunjungan*</label>
                  <input 
                    type="date"
                    value={formData.tanggalKunjungan}
                    onChange={(e) => setFormData({...formData, tanggalKunjungan: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Pilih Siswa*</label>
                  {isAddModalOpen ? (
                    <select 
                      value={formData.nisn}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                      required
                    >
                      <option value="" disabled>-- Pilih Siswa --</option>
                      {siswa.map(s => (
                        <option key={s.id} value={s.nisn}>{s.namaSiswa} - Kelas {s.kelas}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-705 dark:text-slate-350">
                      {formData.namaSiswa} - Kelas {formData.kelas}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Petugas/Guru BK Pendamping*</label>
                  <input 
                    type="text" 
                    value={formData.petugas}
                    onChange={(e) => setFormData({...formData, petugas: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Nama Petugas BK"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Tujuan Kunjungan*</label>
                  <input 
                    type="text" 
                    value={formData.tujuanKunjungan}
                    onChange={(e) => setFormData({...formData, tujuanKunjungan: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Tujuan utama kunjungan"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Alamat Kunjungan (Auto-Fill)</label>
                <input 
                  type="text" 
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Alamat rumah tinggal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Temuan / Hasil Diskusi Lapangan*</label>
                <textarea 
                  value={formData.temuan}
                  onChange={(e) => setFormData({...formData, temuan: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Tuliskan temuan penting, keterangan orang tua, kondisi siswa di rumah..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Rekomendasi / Solusi Penyelesaian*</label>
                <textarea 
                  value={formData.rekomendasi}
                  onChange={(e) => setFormData({...formData, rekomendasi: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-205"
                  placeholder="Rencana tindak lanjut, komitmen wali murid, bantuan belajar/moral..."
                  required
                />
              </div>

              {/* Upload Gambar Section */}
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Upload Gambar Bukti</label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSimulateUpload}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Simulasikan Unggah Foto
                  </button>
                  {formData.dokumentasiNama && (
                    <div className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{formData.dokumentasiNama}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-4 py-2 rounded-xl border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
