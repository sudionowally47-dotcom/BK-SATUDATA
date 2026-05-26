import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, BookOpen, Paperclip, FileText, ExternalLink, UserCheck
} from 'lucide-react';
import { LayananBK, Siswa, JenisLayanan, IdentitasSekolah, GuruBK, AbsensiItem } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface LayananBKProps {
  layanan: LayananBK[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (layanan: Omit<LayananBK, 'id'>) => void;
  onUpdate: (id: string, layanan: Partial<LayananBK>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const LayananBKComponent: React.FC<LayananBKProps> = ({
  layanan,
  siswa,
  guru,
  identitas,
  onAdd,
  onUpdate,
  onDelete,
  triggerNotification
}) => {
  const [activeTab, setActiveTab] = useState<string>('Jurnal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAbsensiModalOpen, setIsAbsensiModalOpen] = useState(false);
  const [currentLayanan, setCurrentLayanan] = useState<LayananBK | null>(null);
  const [absensiData, setAbsensiData] = useState<AbsensiItem[]>([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenisLayanan: 'Bimbingan Pribadi' as JenisLayanan,
    nisn: '',
    namaSiswa: '',
    kelas: '',
    topik: '',
    konselor: '',
    uraian: '',
    hasil: '',
    dokumenNama: '',
    dokumenUrl: ''
  });

  const categories: { label: string; value: string }[] = [
    { label: 'Jurnal Layanan BK', value: 'Jurnal' },
    { label: 'Klasikal', value: 'Klasikal' },
    { label: 'Bimbingan Belajar', value: 'Bimbingan Belajar' },
    { label: 'Bimbingan Pribadi', value: 'Bimbingan Pribadi' },
    { label: 'Bimbingan Sosial', value: 'Bimbingan Sosial' },
    { label: 'Bimbingan Karier', value: 'Bimbingan Karier' },
    { label: 'Konseling Individual', value: 'Konseling Individual' },
    { label: 'Konseling Kelompok', value: 'Konseling Kelompok' }
  ];

  // Filtering based on active tab, search, and student history selection
  const filteredData = layanan.filter(l => {
    const matchesTab = activeTab === 'Jurnal' ? true : l.jenisLayanan === activeTab;
    const matchesSearch = 
      l.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.nisn.includes(searchTerm) ||
      l.uraian.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHistory = selectedStudentForHistory ? l.nisn === selectedStudentForHistory : true;
    return matchesTab && matchesSearch && matchesHistory;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenAdd = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenisLayanan: activeTab === 'Jurnal' ? 'Bimbingan Pribadi' : activeTab as JenisLayanan,
      nisn: activeTab === 'Klasikal' ? 'Semua Siswa' : (siswa[0]?.nisn || ''),
      namaSiswa: activeTab === 'Klasikal' ? 'Siswa Satu Kelas' : (siswa[0]?.namaSiswa || ''),
      kelas: activeTab === 'Klasikal' ? '' : (siswa[0]?.kelas || ''),
      topik: '',
      konselor: '',
      uraian: '',
      hasil: '',
      dokumenNama: '',
      dokumenUrl: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (l: LayananBK) => {
    setCurrentLayanan(l);
    setFormData({
      tanggal: l.tanggal,
      jenisLayanan: l.jenisLayanan,
      nisn: l.nisn,
      namaSiswa: l.namaSiswa,
      kelas: l.kelas,
      topik: l.topik || '',
      konselor: l.konselor || '',
      uraian: l.uraian,
      hasil: l.hasil || '',
      dokumenNama: l.dokumenNama || '',
      dokumenUrl: l.dokumenUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAbsensi = (l: LayananBK) => {
    setCurrentLayanan(l);
    
    // Initialise attendance list from existing data or current class list
    let initialAbsensi: AbsensiItem[] = [];
    if (l.absensi) {
      try {
        initialAbsensi = JSON.parse(l.absensi);
      } catch (e) {
        initialAbsensi = [];
      }
    }

    // If no existing attendance, get all students in that class
    if (initialAbsensi.length === 0) {
      initialAbsensi = siswa
        .filter(s => s.kelas === l.kelas)
        .map(s => ({
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          status: 'Hadir'
        }));
    } else {
      // Sync with latest student list just in case names changed or new students added
      const classStudents = siswa.filter(s => s.kelas === l.kelas);
      const existingNisns = new Set(initialAbsensi.map(a => a.nisn));
      
      classStudents.forEach(s => {
        if (!existingNisns.has(s.nisn)) {
          initialAbsensi.push({
            nisn: s.nisn,
            namaSiswa: s.namaSiswa,
            status: 'Hadir'
          });
        }
      });
    }

    setAbsensiData(initialAbsensi);
    setIsAbsensiModalOpen(true);
  };

  const handleSaveAbsensi = () => {
    if (!currentLayanan) return;
    
    onUpdate(currentLayanan.id, {
      absensi: JSON.stringify(absensiData)
    });
    
    setIsAbsensiModalOpen(false);
    triggerNotification(`Daftar absensi kelas ${currentLayanan.kelas} berhasil disimpan!`, "success");
  };

  const handleStudentChange = (nisn: string) => {
    // Check special case for Group counseling or classical
    if (nisn === 'klasikal-all') {
      setFormData({
        ...formData,
        nisn: 'Semua Siswa',
        namaSiswa: 'Siswa Satu Kelas',
        kelas: 'Semua Kelas'
      });
      return;
    }

    const s = siswa.find(x => x.nisn === nisn);
    if (s) {
      setFormData({
        ...formData,
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        kelas: s.kelas
      });
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian.trim()) {
      triggerNotification("Uraian Jurnal BK wajib diisi!", "error");
      return;
    }
    onAdd(formData);
    setIsAddModalOpen(false);
    triggerNotification("Jurnal Layanan BK berhasil ditambahkan!", "success");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLayanan) return;
    if (!formData.uraian.trim()) {
      triggerNotification("Uraian Jurnal BK wajib diisi!", "error");
      return;
    }
    onUpdate(currentLayanan.id, formData);
    setIsEditModalOpen(false);
    triggerNotification("Jurnal Layanan BK berhasil diperbarui!", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan layanan BK ini?")) {
      onDelete(id);
      triggerNotification("Data Jurnal Layanan berhasil dihapus!", "success");
    }
  };

  // Mock File Upload (simulating integration with Google Drive)
  const handleSimulateUpload = () => {
    const fileNames = [
      'Surat_Pernyataan_Siswa.pdf',
      'Lembar_Catatan_Konseling.pdf',
      'Dokumentasi_Bimbingan_Klasikal.jpg',
      'Form_Komitmen_Belajar.pdf',
      'Hasil_Wawancara_Siswa.docx'
    ];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const mockDriveUrl = `https://drive.google.com/file/d/mockId_${Math.random().toString(36).substr(2,9)}/view`;
    
    setFormData(prev => ({
      ...prev,
      dokumenNama: randomFile,
      dokumenUrl: mockDriveUrl
    }));
    triggerNotification("Simulasi upload ke Google Drive Berhasil!", "success");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((l, idx) => ({
      'No.': idx + 1,
      'Tanggal': formatTanggalTabel(l.tanggal),
      'Jenis Layanan': l.jenisLayanan,
      'NISN': l.nisn,
      'Nama Siswa': l.namaSiswa,
      'Kelas': l.kelas,
      'Topik / Materi': l.topik || '-',
      'Konselor': l.konselor || '-',
      'Deskripsi / Jurnal': l.uraian,
      'Hasil / Tindak Lanjut': l.hasil || '-',
      'Dokumen Pendukung': l.dokumenNama || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jurnal Layanan BK");
    XLSX.writeFile(wb, `Layanan_BK_${activeTab.replace(/\s+/g, '_')}_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Jurnal Layanan BK - ${identitas.namaSekolah}</title>
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
          <h2 style="text-align: center;">JURNAL LAYANAN BIMBINGAN DAN KONSELING</h2>
          <p>Kategori: <b>${activeTab}</b></p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="width: 80px;">Tanggal</th>
                {activeTab !== 'Klasikal' && <th style="width: 120px;">Jenis Layanan</th>}
                <th style="width: 100px;">{activeTab === 'Klasikal' ? 'Topik' : 'NISN'}</th>
                <th style="width: 140px;">{activeTab === 'Klasikal' ? 'Materi/Deskripsi' : 'Siswa'}</th>
                <th style="width: 60px;">Kelas</th>
                <th>{activeTab === 'Klasikal' ? 'Hasil/Tindak Lanjut' : 'Jurnal / Uraian'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((l, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${formatTanggalTabel(l.tanggal)}</td>
                  ${activeTab !== 'Klasikal' ? `<td>${l.jenisLayanan}</td>` : ''}
                  <td>${activeTab === 'Klasikal' ? (l.topik || '-') : l.nisn}</td>
                  <td>${activeTab === 'Klasikal' ? (l.uraian || '-') : l.namaSiswa}</td>
                  <td>${l.kelas}</td>
                  <td>${activeTab === 'Klasikal' ? (l.hasil || '-') : l.uraian}</td>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-650" />
            Layanan BK
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Catat jurnal kegiatan bimbingan klasikal, pribadi, sosial, karier, belajar, dan konseling
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-px overflow-x-auto">
        {categories.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setCurrentPage(1);
              setSelectedStudentForHistory(null); // Reset history filter when swapping tabs
            }}
            className={`
              px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer
              ${activeTab === tab.value 
                ? 'border-indigo-650 text-indigo-700 dark:text-indigo-400 font-extrabold' 
                : 'border-transparent text-slate-455 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Student History Filter Notice */}
      {selectedStudentForHistory && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="font-extrabold text-indigo-900 dark:text-indigo-200">Riwayat Layanan Siswa Aktif:</span>{' '}
            <span className="text-indigo-750 dark:text-indigo-300">
              {siswa.find(x => x.nisn === selectedStudentForHistory)?.namaSiswa || selectedStudentForHistory}
            </span>
          </div>
          <button 
            onClick={() => setSelectedStudentForHistory(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            Reset Filter Riwayat
          </button>
        </div>
      )}

      {/* Search Input & Submenu Dedicated Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari nama siswa, NISN, atau isi jurnal..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-205"
          />
        </div>

        <button 
          onClick={handleOpenAdd} 
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Tambah {activeTab === 'Jurnal' ? 'Jurnal Layanan' : activeTab}
        </button>
      </div>

      {/* Table Jurnal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">Tanggal</th>
                {activeTab !== 'Klasikal' && <th className="px-6 py-4">Jenis Layanan</th>}
                <th className="px-6 py-4">{activeTab === 'Klasikal' ? 'Topik / Materi' : 'Nama Siswa'}</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">{activeTab === 'Klasikal' ? 'Konselor' : 'Uraian / Jurnal'}</th>
                <th className="px-6 py-4">Dokumen</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan catatan jurnal layanan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((l, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-705 dark:text-slate-400 whitespace-nowrap">{formatTanggalTabel(l.tanggal)}</td>
                      {activeTab !== 'Klasikal' && (
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            {l.jenisLayanan}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {activeTab === 'Klasikal' ? (
                          l.topik || '-'
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedStudentForHistory(l.nisn)}
                              className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-left hover:underline cursor-pointer"
                            >
                              {l.namaSiswa}
                            </button>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">NISN: {l.nisn}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{l.kelas}</td>
                      <td className="px-6 py-4 max-w-sm text-slate-655 dark:text-slate-350">
                        {activeTab === 'Klasikal' ? l.konselor || '-' : l.uraian}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {l.dokumenNama ? (
                          <a 
                            href={l.dokumenUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {l.dokumenNama}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {activeTab === 'Klasikal' && (
                            <button 
                              onClick={() => handleOpenAbsensi(l)}
                              className="p-1.5 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Absensi"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEdit(l)}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(l.id)}
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Catatan
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

      {/* Add Layanan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                {formData.jenisLayanan === 'Klasikal' ? 'Tambah Layanan Klasikal' : 'Tambah Jurnal Layanan'}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 bg-[#F8FAFC] dark:bg-slate-900">
              {formData.jenisLayanan === 'Klasikal' ? (
                /* LAYOUT KHUSUS KLASIKAL SESUAI GAMBAR */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                      <input 
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Kelas</label>
                      <select 
                        value={formData.kelas}
                        onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                        className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-350"
                        required
                      >
                        <option value="">— pilih kelas —</option>
                        {Array.from(new Set(siswa.map(s => s.kelas))).sort().map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Topik / Materi</label>
                    <input 
                      type="text"
                      value={formData.topik}
                      onChange={(e) => setFormData({...formData, topik: e.target.value})}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Konselor / Guru BK</label>
                    <input 
                      type="text"
                      value={formData.konselor}
                      onChange={(e) => setFormData({...formData, konselor: e.target.value})}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Deskripsi Layanan</label>
                    <textarea 
                      value={formData.uraian}
                      onChange={(e) => setFormData({...formData, uraian: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Hasil / Tindak Lanjut</label>
                    <textarea 
                      value={formData.hasil}
                      onChange={(e) => setFormData({...formData, hasil: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>
                </>
              ) : (
                /* LAYOUT DEFAULT JURNAL LAINNYA */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Layanan*</label>
                      <input 
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kategori Layanan*</label>
                      <select 
                        value={formData.jenisLayanan}
                        onChange={(e) => setFormData({...formData, jenisLayanan: e.target.value as JenisLayanan})}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                        required
                      >
                        <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
                        <option value="Bimbingan Belajar">Bimbingan Belajar</option>
                        <option value="Bimbingan Sosial">Bimbingan Sosial</option>
                        <option value="Bimbingan Karier">Bimbingan Karier</option>
                        <option value="Klasikal">Klasikal</option>
                        <option value="Konseling Individual">Konseling Individual</option>
                        <option value="Konseling Kelompok">Konseling Kelompok</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa / Peserta*</label>
                    <select 
                      value={formData.nisn}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                      required
                    >
                      <option value="" disabled>-- Pilih Siswa --</option>
                      <option value="klasikal-all">Seluruh Siswa (Layanan Klasikal/Kelompok)</option>
                      {siswa.map(s => (
                        <option key={s.id} value={s.nisn}>{s.namaSiswa} - Kelas {s.kelas} ({s.nisn})</option>
                      ))}
                    </select>
                  </div>

                  {/* Readonly details of student auto-populated */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Siswa</span>
                      <span className="font-bold text-slate-850 dark:text-slate-300">{formData.namaSiswa || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kelas</span>
                      <span className="font-bold text-slate-850 dark:text-slate-300">{formData.kelas || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jurnal / Uraian Masalah & Hasil Layanan*</label>
                    <textarea 
                      value={formData.uraian}
                      onChange={(e) => setFormData({...formData, uraian: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                      placeholder="Jelaskan kronologi, pokok bahasan layanan BK, perkembangan atau konseling siswa, dan tindak lanjutnya..."
                      required
                    />
                  </div>
                </>
              )}

              {/* Upload Document Section */}
              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Dokumen Pendukung (Upload ke Drive)</label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSimulateUpload}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Simulasikan Unggah File
                  </button>
                  {formData.dokumenNama && (
                    <div className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{formData.dokumenNama}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tombol ini mensimulasikan integrasi dengan Google Drive API untuk menyimpan scan dokumen BK secara terpusat.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2 rounded-lg bg-[#005A9C] hover:bg-[#004A80] text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Layanan Modal */}
      {isEditModalOpen && currentLayanan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                {formData.jenisLayanan === 'Klasikal' ? 'Ubah Layanan Klasikal' : 'Ubah Jurnal Layanan'}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 bg-[#F8FAFC] dark:bg-slate-900">
              {formData.jenisLayanan === 'Klasikal' ? (
                /* LAYOUT KHUSUS KLASIKAL SESUAI GAMBAR */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                      <input 
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Kelas</label>
                      <select 
                        value={formData.kelas}
                        onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                        className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-350"
                        required
                      >
                        <option value="">— pilih kelas —</option>
                        {Array.from(new Set(siswa.map(s => s.kelas))).sort().map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Topik / Materi</label>
                    <input 
                      type="text"
                      value={formData.topik}
                      onChange={(e) => setFormData({...formData, topik: e.target.value})}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Konselor / Guru BK</label>
                    <input 
                      type="text"
                      value={formData.konselor}
                      onChange={(e) => setFormData({...formData, konselor: e.target.value})}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Deskripsi Layanan</label>
                    <textarea 
                      value={formData.uraian}
                      onChange={(e) => setFormData({...formData, uraian: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Hasil / Tindak Lanjut</label>
                    <textarea 
                      value={formData.hasil}
                      onChange={(e) => setFormData({...formData, hasil: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>
                </>
              ) : (
                /* LAYOUT DEFAULT JURNAL LAINNYA */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Layanan*</label>
                      <input 
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kategori Layanan*</label>
                      <select 
                        value={formData.jenisLayanan}
                        onChange={(e) => setFormData({...formData, jenisLayanan: e.target.value as JenisLayanan})}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                        required
                      >
                        <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
                        <option value="Bimbingan Belajar">Bimbingan Belajar</option>
                        <option value="Bimbingan Sosial">Bimbingan Sosial</option>
                        <option value="Bimbingan Karier">Bimbingan Karier</option>
                        <option value="Klasikal">Klasikal</option>
                        <option value="Konseling Individual">Konseling Individual</option>
                        <option value="Konseling Kelompok">Konseling Kelompok</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa / Peserta*</label>
                    <select 
                      value={formData.nisn}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                      required
                    >
                      <option value="Semua Siswa">Seluruh Siswa</option>
                      {siswa.map(s => (
                        <option key={s.id} value={s.nisn}>{s.namaSiswa} - Kelas {s.kelas} ({s.nisn})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Siswa</span>
                      <span className="font-bold text-slate-850 dark:text-slate-300">{formData.namaSiswa || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kelas</span>
                      <span className="font-bold text-slate-850 dark:text-slate-300">{formData.kelas || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jurnal / Uraian Masalah & Hasil Layanan*</label>
                    <textarea 
                      value={formData.uraian}
                      onChange={(e) => setFormData({...formData, uraian: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-205"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Dokumen Pendukung (Upload ke Drive)</label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSimulateUpload}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Ubah/Simulasi File
                  </button>
                  {formData.dokumenNama && (
                    <div className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{formData.dokumenNama}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2 rounded-lg bg-[#005A9C] hover:bg-[#004A80] text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance (Absensi) Modal */}
      {isAbsensiModalOpen && currentLayanan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Absensi Layanan Klasikal</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kelas: {currentLayanan.kelas} | Materi: {currentLayanan.topik || '-'}</p>
              </div>
              <button 
                onClick={() => setIsAbsensiModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-6 max-h-[450px] overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                 <span className="text-xs font-bold text-slate-500">Daftar Siswa ({absensiData.length})</span>
                 <div className="flex gap-2">
                   {['Hadir', 'Alpa'].map(st => (
                     <button 
                       key={st}
                       onClick={() => setAbsensiData(prev => prev.map(a => ({...a, status: st as any})))}
                       className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black text-indigo-600 hover:bg-indigo-50"
                     >
                       SET SEMUA {st.toUpperCase()}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                {absensiData.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada siswa terdaftar di kelas ini.</p>
                ) : (
                  absensiData.map((item, idx) => (
                    <div key={item.nisn} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300 w-5">{idx + 1}</span>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.namaSiswa}</p>
                          <p className="text-[10px] font-mono text-slate-400">NISN: {item.nisn}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => {
                              const newData = [...absensiData];
                              newData[idx].status = st;
                              setAbsensiData(newData);
                            }}
                            className={`
                              px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all
                              ${item.status === st 
                                ? (st === 'Hadir' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 
                                   st === 'Alpa' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 
                                   'bg-amber-500 text-white shadow-md shadow-amber-500/20')
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}
                            `}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAbsensiModalOpen(false)} 
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveAbsensi}
                className="px-8 py-2.5 rounded-xl bg-[#005A9C] hover:bg-[#004A80] text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
              >
                Simpan Absensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
