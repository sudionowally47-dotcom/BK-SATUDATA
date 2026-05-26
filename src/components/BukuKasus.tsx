import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, AlertTriangle, Paperclip, FileText, ExternalLink 
} from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentKasus, setCurrentKasus] = useState<BukuKasus | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nisn: '',
    namaSiswa: '',
    kelas: '',
    jenisKasus: 'Kasus Ringan',
    status: 'Dalam Proses' as 'Dalam Proses' | 'Selesai' | 'Dirujuk',
    deskripsiKasus: '',
    tindakLanjut: '',
    buktiNama: '',
    buktiUrl: ''
  });

  const filteredData = kasus.filter(k => {
    const matchesSearch = 
      k.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.nisn.includes(searchTerm) ||
      k.deskripsiKasus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? k.status === filterStatus : true;
    const matchesSeverity = filterSeverity ? k.jenisKasus === filterSeverity : true;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    const firstStudent = siswa && siswa.length > 0 ? siswa[0] : null;
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      nisn: firstStudent?.nisn || '',
      namaSiswa: firstStudent?.namaSiswa || '',
      kelas: firstStudent?.kelas || '',
      jenisKasus: 'Kasus Ringan',
      status: 'Dalam Proses',
      deskripsiKasus: '',
      tindakLanjut: '',
      buktiNama: '',
      buktiUrl: ''
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (k: BukuKasus) => {
    setCurrentKasus(k);
    setFormData({
      tanggal: k.tanggal,
      nisn: k.nisn,
      namaSiswa: k.namaSiswa,
      kelas: k.kelas,
      jenisKasus: k.jenisKasus,
      status: k.status,
      deskripsiKasus: k.deskripsiKasus,
      tindakLanjut: k.tindakLanjut,
      buktiNama: k.buktiNama || '',
      buktiUrl: k.buktiUrl || ''
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
        kelas: s.kelas
      }));
      console.log("Student changed:", s);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data before save:", formData);
    if (!formData.deskripsiKasus.trim() || !formData.tindakLanjut.trim()) {
      triggerNotification("Deskripsi kasus dan tindak lanjut wajib diisi!", "error");
      return;
    }
    onAdd(formData);
    setIsAddModalOpen(false);
    triggerNotification("Kasus siswa berhasil ditambahkan!", "success");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKasus) return;
    if (!formData.deskripsiKasus.trim() || !formData.tindakLanjut.trim()) {
      triggerNotification("Deskripsi kasus dan tindak lanjut wajib diisi!", "error");
      return;
    }
    onUpdate(currentKasus.id, formData);
    setIsEditModalOpen(false);
    triggerNotification("Data kasus berhasil diperbarui!", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data kasus ini?")) {
      onDelete(id);
      triggerNotification("Data kasus berhasil dihapus!", "success");
    }
  };

  const handleSimulateUpload = () => {
    const proofs = [
      'Foto_Keterlambatan_Siswa.jpg',
      'Surat_Pernyataan_Tertulis.pdf',
      'Bukti_Chat_Mediasi.png',
      'Laporan_Saksi_Siswa.pdf'
    ];
    const randomFile = proofs[Math.floor(Math.random() * proofs.length)];
    const mockDriveUrl = `https://drive.google.com/file/d/mockId_kasus_${Math.random().toString(36).substr(2,9)}/view`;
    
    setFormData(prev => ({
      ...prev,
      buktiNama: randomFile,
      buktiUrl: mockDriveUrl
    }));
    triggerNotification("Bukti pendukung berhasil diunggah!", "success");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((k, idx) => ({
      'No.': idx + 1,
      'Tanggal': formatTanggalTabel(k.tanggal),
      'Siswa': k.namaSiswa,
      'Kelas': k.kelas,
      'Jenis Kasus': k.jenisKasus,
      'Status': k.status,
      'Deskripsi Kasus': k.deskripsiKasus,
      'Tindak Lanjut': k.tindakLanjut,
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
          <h2 style="text-align: center;">BUKU KASUS BIMBINGAN KONSELING</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="width: 80px;">Tanggal</th>
                <th style="width: 140px;">Nama Siswa</th>
                <th style="width: 60px;">Kelas</th>
                <th style="width: 90px;">Jenis Kasus</th>
                <th style="width: 90px;">Status</th>
                <th>Deskripsi Kasus</th>
                <th>Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((k, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${formatTanggalTabel(k.tanggal)}</td>
                  <td><b>${k.namaSiswa}</b><br><small>NISN: ${k.nisn}</small></td>
                  <td>${k.kelas}</td>
                  <td>${k.jenisKasus}</td>
                  <td>${k.status}</td>
                  <td>${k.deskripsiKasus}</td>
                  <td>${k.tindakLanjut}</td>
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
            <AlertTriangle className="w-7 h-7 text-indigo-650" />
            Buku Kasus Siswa
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Rekapitulasi kasus kedisiplinan dan hambatan siswa beserta tindak lanjut konselor
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Kasus Baru
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

      {/* Filters and Search Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari siswa, NISN, deskripsi..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-205"
          />
        </div>

        {/* Filter Tingkat Kasus */}
        <select 
          value={filterSeverity} 
          onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
        >
          <option value="">Semua Tingkat Kasus</option>
          <option value="Kasus Ringan">Kasus Ringan</option>
          <option value="Kasus Sedang">Kasus Sedang</option>
          <option value="Kasus Berat">Kasus Berat</option>
        </select>

        {/* Filter Status */}
        <select 
          value={filterStatus} 
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
        >
          <option value="">Semua Status Penanganan</option>
          <option value="Dalam Proses">Dalam Proses</option>
          <option value="Selesai">Selesai</option>
          <option value="Dirujuk">Dirujuk (Alih Tangan)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Klasifikasi Kasus</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Deskripsi Masalah</th>
                <th className="px-6 py-4">Tindak Lanjut BK</th>
                <th className="px-6 py-4">Bukti</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan data kasus siswa.
                  </td>
                </tr>
              ) : (
                paginatedData.map((k, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-705 dark:text-slate-400 whitespace-nowrap">{formatTanggalTabel(k.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-850 dark:text-slate-200">{k.namaSiswa}</div>
                        <div className="text-[10px] font-mono text-slate-400">NISN: {k.nisn}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{k.kelas}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-0.5 rounded text-[9px] font-extrabold uppercase
                          ${k.jenisKasus === 'Kasus Ringan' ? 'bg-indigo-50 text-indigo-750 dark:bg-slate-800 dark:text-indigo-400' :
                            k.jenisKasus === 'Kasus Sedang' ? 'bg-amber-50 text-amber-800 dark:bg-slate-800 dark:text-amber-400' :
                            'bg-rose-50 text-rose-800 dark:bg-slate-800 dark:text-rose-450'}
                        `}>
                          {k.jenisKasus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`
                          px-2 py-0.5 rounded text-[9px] font-extrabold uppercase
                          ${k.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350' :
                            k.status === 'Dalam Proses' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-350' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-955 dark:text-rose-350'}
                        `}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400" title={k.deskripsiKasus}>
                        {k.deskripsiKasus}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400" title={k.tindakLanjut}>
                        {k.tindakLanjut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {k.buktiNama ? (
                          <a 
                            href={k.buktiUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {k.buktiNama}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Kasus
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                {isAddModalOpen ? 'Tambah Kasus Siswa' : 'Ubah Data Kasus'}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar relative z-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Pelaporan*</label>
                  <input 
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa*</label>
                  <select 
                    value={formData.nisn || ''}
                    onChange={(e) => {
                      const nisn = e.target.value;
                      handleStudentChange(nisn);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {siswa && siswa.map(s => (
                      <option key={s.nisn} value={s.nisn}>
                        {s.namaSiswa} - {s.kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Klasifikasi Kasus*</label>
                  <select 
                    value={formData.jenisKasus}
                    onChange={(e) => setFormData({...formData, jenisKasus: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="Kasus Ringan">Kasus Ringan (Indisipliner ringan, terlambat)</option>
                    <option value="Kasus Sedang">Kasus Sedang (Membolos berkali-kali, berkelahi)</option>
                    <option value="Kasus Berat">Kasus Berat (Narkoba, kekerasan ekstrem, kriminal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status Penanganan*</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="Dalam Proses">Dalam Proses Penyelidikan/Konseling</option>
                    <option value="Selesai">Selesai (Kasus Ditutup/Komitmen Tercapai)</option>
                    <option value="Dirujuk">Dirujuk / Alih Tangan Kasus (Polisi/KPPAD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Kasus / Masalah*</label>
                <textarea 
                  value={formData.deskripsiKasus}
                  onChange={(e) => setFormData({...formData, deskripsiKasus: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Detail kejadian kasus, kronologi, saksi, dan dampak perilaku siswa."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tindak Lanjut / Penyelesaian*</label>
                <textarea 
                  value={formData.tindakLanjut}
                  onChange={(e) => setFormData({...formData, tindakLanjut: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-205"
                  placeholder="Konseling yang diberikan, pembuatan surat pernyataan, sanksi edukatif, alih tangan kasus."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unggah Bukti Pendukung (Scan Surat/Foto)</label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSimulateUpload}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Simulasi File Bukti
                  </button>
                  {formData.buktiNama && (
                    <div className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{formData.buktiNama}</span>
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
                  Simpan Buku Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
