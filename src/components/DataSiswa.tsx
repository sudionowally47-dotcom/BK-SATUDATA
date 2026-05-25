import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, Download, Upload, FileText, 
  Printer, ArrowLeft, ArrowRight, UserCheck, AlertCircle, Users
} from 'lucide-react';
import { Siswa, Kelas, IdentitasSekolah, GuruBK } from '../types';

interface DataSiswaProps {
  siswa: Siswa[];
  kelas: Kelas[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (siswa: Omit<Siswa, 'id'>) => void;
  onUpdate: (id: string, siswa: Partial<Siswa>) => void;
  onDelete: (id: string) => void;
  onImport: (list: Omit<Siswa, 'id'>[]) => number;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const DataSiswa: React.FC<DataSiswaProps> = ({
  siswa,
  kelas,
  guru,
  identitas,
  onAdd,
  onUpdate,
  onDelete,
  onImport,
  triggerNotification
}) => {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJk, setFilterJk] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSiswa, setCurrentSiswa] = useState<Siswa | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nisn: '',
    namaSiswa: '',
    kelas: '',
    jk: 'L' as 'L' | 'P',
    agama: 'Islam',
    orangTua: '',
    alamat: '',
    noHp: ''
  });

  // Selected students for printing login cards
  const [selectedForCard, setSelectedForCard] = useState<string[]>([]);
  const [isCardMode, setIsCardMode] = useState(false);

  // Search & Filter Logic
  const filteredData = siswa.filter(s => {
    const matchesSearch = 
      s.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.alamat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKelas = filterKelas ? s.kelas === filterKelas : true;
    const matchesJk = filterJk ? s.jk === filterJk : true;
    return matchesSearch && matchesKelas && matchesJk;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      nisn: '',
      namaSiswa: '',
      kelas: kelas[0]?.namaKelas || '',
      jk: 'L',
      agama: 'Islam',
      orangTua: '',
      alamat: '',
      noHp: ''
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Siswa) => {
    setCurrentSiswa(s);
    setFormData({
      nisn: s.nisn,
      namaSiswa: s.namaSiswa,
      kelas: s.kelas,
      jk: s.jk,
      agama: s.agama,
      orangTua: s.orangTua,
      alamat: s.alamat,
      noHp: s.noHp
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nisn.length !== 10 || isNaN(Number(formData.nisn))) {
      triggerNotification("NISN harus berupa 10 digit angka!", "error");
      return;
    }
    if (!formData.namaSiswa.trim()) {
      triggerNotification("Nama Siswa tidak boleh kosong!", "error");
      return;
    }
    try {
      onAdd(formData);
      setIsAddModalOpen(false);
      triggerNotification("Data siswa berhasil ditambahkan!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menambahkan data", "error");
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiswa) return;
    if (formData.nisn.length !== 10 || isNaN(Number(formData.nisn))) {
      triggerNotification("NISN harus berupa 10 digit angka!", "error");
      return;
    }
    if (!formData.namaSiswa.trim()) {
      triggerNotification("Nama Siswa tidak boleh kosong!", "error");
      return;
    }
    try {
      onUpdate(currentSiswa.id, formData);
      setIsEditModalOpen(false);
      triggerNotification("Data siswa berhasil diperbarui!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal memperbarui data", "error");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data siswa ini? Semua data terkait mungkin terpengaruh.")) {
      onDelete(id);
      triggerNotification("Data siswa berhasil dihapus!", "success");
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const dataToExport = filteredData.map((s, idx) => ({
      'No.': idx + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.namaSiswa,
      'Kelas': s.kelas,
      'Jenis Kelamin': s.jk === 'L' ? 'Laki-laki' : 'Perempuan',
      'Agama': s.agama,
      'Orang Tua/Wali': s.orangTua,
      'Alamat': s.alamat,
      'No. HP': s.noHp
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, `Data_Siswa_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NISN': '0091234567',
        'Nama Siswa': 'Nama Siswa Contoh',
        'Kelas': kelas[0]?.namaKelas || 'VII-A',
        'JK (L/P)': 'L',
        'Agama': 'Islam',
        'Orang Tua': 'Nama Ayah/Ibu',
        'Alamat': 'Alamat Lengkap',
        'No. HP': '081234567890'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
    triggerNotification("Template berhasil diunduh!", "success");
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        // Map and validate columns
        const siswaList: Omit<Siswa, 'id'>[] = [];
        let errorCount = 0;

        json.forEach((row: any) => {
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const nama = String(row['Nama Siswa'] || row['namaSiswa'] || row['Nama'] || '').trim();
          const kls = String(row['Kelas'] || row['kelas'] || '').trim();
          const jkRaw = String(row['JK (L/P)'] || row['Jenis Kelamin'] || row['jk'] || 'L').trim().toUpperCase();
          const jk = jkRaw.startsWith('P') ? 'P' : 'L';
          const agama = String(row['Agama'] || row['agama'] || 'Islam').trim();
          const orangTua = String(row['Orang Tua'] || row['Orang Tua/Wali'] || row['orangTua'] || '').trim();
          const alamat = String(row['Alamat'] || row['alamat'] || '').trim();
          const noHp = String(row['No. HP'] || row['noHp'] || '').trim();

          if (nisn.length === 10 && nama) {
            siswaList.push({
              nisn,
              namaSiswa: nama,
              kelas: kls || 'VII-A',
              jk,
              agama,
              orangTua,
              alamat,
              noHp
            });
          } else {
            errorCount++;
          }
        });

        if (siswaList.length === 0) {
          triggerNotification("Format Excel tidak sesuai atau data kosong. Pastikan kolom NISN (10 digit) & Nama Siswa terisi.", "error");
          return;
        }

        const count = onImport(siswaList);
        if (count > 0) {
          triggerNotification(`${count} siswa berhasil diimport! ${errorCount > 0 ? `${errorCount} baris tidak valid.` : ''}`, "success");
        } else {
          triggerNotification("Tidak ada siswa baru yang diimport (Mungkin sudah terdaftar).", "error");
        }
      } catch (err) {
        triggerNotification("Gagal membaca file Excel!", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset file input
  };

  // Print PDF Table
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Data Siswa - ${identitas.namaSekolah}</title>
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
          <h2 style="text-align: center;">LAPORAN DATA SISWA</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>JK</th>
                <th>Agama</th>
                <th>Orang Tua</th>
                <th>Alamat</th>
                <th>No. HP</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${s.nisn}</td>
                  <td>${s.namaSiswa}</td>
                  <td>${s.kelas}</td>
                  <td>${s.jk}</td>
                  <td>${s.agama}</td>
                  <td>${s.orangTua}</td>
                  <td>${s.alamat}</td>
                  <td>${s.noHp}</td>
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

  // Toggle selection for cards
  const toggleSelectCard = (nisn: string) => {
    setSelectedForCard(prev => 
      prev.includes(nisn) ? prev.filter(x => x !== nisn) : [...prev, nisn]
    );
  };

  const toggleSelectAllCards = () => {
    if (selectedForCard.length === filteredData.length) {
      setSelectedForCard([]);
    } else {
      setSelectedForCard(filteredData.map(s => s.nisn));
    }
  };

  // Print Login Cards
  const handlePrintCards = () => {
    if (selectedForCard.length === 0) {
      triggerNotification("Pilih minimal 1 siswa untuk cetak kartu!", "error");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = selectedForCard.map(nisn => {
      const s = siswa.find(x => x.nisn === nisn);
      if (!s) return '';
      return `
        <div class="card">
          <div class="card-header">
            <h3>KARTU LOGIN SISWA</h3>
            <h4>${identitas.namaSekolah}</h4>
          </div>
          <div class="card-body">
            <table>
              <tr><td><b>Nama</b></td><td>: ${s.namaSiswa}</td></tr>
              <tr><td><b>Kelas</b></td><td>: ${s.kelas}</td></tr>
              <tr><td><b>Username</b></td><td>: <span class="cred">${s.nisn}</span></td></tr>
              <tr><td><b>Password</b></td><td>: <span class="cred">${s.nisn}</span></td></tr>
            </table>
          </div>
          <div class="card-footer">
            Harap simpan kartu ini untuk mengakses Layanan BK Satu Data
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Kartu Login Siswa - SMP Negeri 4 Fakfak</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f0f2f5; padding: 20px; }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
              gap: 20px;
            }
            .card {
              background: #fff;
              border: 2px solid #4F46E5;
              border-radius: 12px;
              padding: 15px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            .card-header {
              text-align: center;
              border-bottom: 2px solid #eaeaea;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .card-header h3 { margin: 0; color: #4F46E5; font-size: 14px; letter-spacing: 0.5px; }
            .card-header h4 { margin: 3px 0 0 0; color: #555; font-size: 11px; }
            .card-body table { width: 100%; font-size: 12px; border-collapse: collapse; }
            .card-body td { padding: 4px 0; vertical-align: top; }
            .cred { font-family: monospace; font-weight: bold; background: #eee; padding: 2px 6px; border-radius: 4px; color: #222; }
            .card-footer {
              margin-top: 12px;
              border-top: 1px dashed #ddd;
              padding-top: 6px;
              font-size: 9px;
              color: #777;
              text-align: center;
              font-style: italic;
            }
            @media print {
              body { background: none; padding: 0; }
              .grid-container { gap: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cardsHtml}
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-650" />
            Data Siswa
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Kelola data biodata siswa {identitas.namaSekolah}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2.5 px-5 py-3 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            Tambah Siswa Baru
          </button>
          
          <button 
            onClick={() => setIsCardMode(!isCardMode)} 
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${isCardMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <UserCheck className="w-4 h-4" />
            {isCardMode ? 'Selesai Pilih Kartu' : 'Pilih Cetak Kartu'}
          </button>

          {/* Import Dropdown */}
          <label className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-550/10 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Excel
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel} 
              className="hidden" 
            />
          </label>

          <button 
            onClick={handleDownloadTemplate} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-550/10 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Template
          </button>

          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-550/10 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button 
            onClick={handlePrintPDF} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-550/10 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Card Mode Header Alert */}
      {isCardMode && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-250">Mode Pilihan Kartu Aktif</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">Silakan centang siswa pada tabel di bawah, lalu klik Cetak Kartu Pilihan.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={toggleSelectAllCards}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold transition-all cursor-pointer"
            >
              {selectedForCard.length === filteredData.length ? 'Batal Semua' : 'Pilih Semua'}
            </button>
            <button 
              onClick={handlePrintCards}
              disabled={selectedForCard.length === 0}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer ${selectedForCard.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Kartu ({selectedForCard.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari NISN, nama, alamat..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter Kelas */}
        <select 
          value={filterKelas} 
          onChange={(e) => { setFilterKelas(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
        >
          <option value="">Semua Kelas</option>
          {kelas.map(k => (
            <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
          ))}
        </select>

        {/* Filter JK */}
        <select 
          value={filterJk} 
          onChange={(e) => { setFilterJk(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
        >
          <option value="">Semua Jenis Kelamin</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                {isCardMode && <th className="px-6 py-4 w-12 text-center">Pilih</th>}
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">L/P</th>
                <th className="px-6 py-4">Agama</th>
                <th className="px-6 py-4">Orang Tua</th>
                <th className="px-6 py-4">No. HP</th>
                {!isCardMode && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={isCardMode ? 10 : 9} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan data siswa yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedData.map((s, index) => {
                  const no = startIndex + index + 1;
                  const isChecked = selectedForCard.includes(s.nisn);
                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${isChecked ? 'bg-indigo-50/20 dark:bg-indigo-950/5' : ''}`}
                    >
                      {isCardMode && (
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleSelectCard(s.nisn)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-300">{s.nisn}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{s.namaSiswa}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-400">
                        {s.jk === 'L' ? 'L' : 'P'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.agama}</td>
                      <td className="px-6 py-4 text-slate-655 dark:text-slate-400">{s.orangTua}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.noHp || '-'}</td>
                      {!isCardMode && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                              title="Ubah data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} siswa
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-55/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 px-2">
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

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Tambah Data Siswa</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">NISN (10 Digit)*</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => setFormData({...formData, nisn: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 0098234121"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Siswa*</label>
                  <input 
                    type="text" 
                    value={formData.namaSiswa}
                    onChange={(e) => setFormData({...formData, namaSiswa: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Nama Lengkap Siswa"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kelas*</label>
                  <select 
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                    required
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jenis Kelamin*</label>
                  <select 
                    value={formData.jk}
                    onChange={(e) => setFormData({...formData, jk: e.target.value as 'L' | 'P'})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                    required
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Agama</label>
                  <select 
                    value={formData.agama}
                    onChange={(e) => setFormData({...formData, agama: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Kristen Katolik">Kristen Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Orang Tua / Wali*</label>
                <input 
                  type="text" 
                  value={formData.orangTua}
                  onChange={(e) => setFormData({...formData, orangTua: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Nama Ayah, Ibu, atau Wali"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">No. HP (WhatsApp)</label>
                  <input 
                    type="text" 
                    value={formData.noHp}
                    onChange={(e) => setFormData({...formData, noHp: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat</label>
                  <input 
                    type="text" 
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-855 dark:text-slate-200"
                    placeholder="Alamat Lengkap Rumah"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-55/10 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && currentSiswa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Ubah Data Siswa</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">NISN (10 Digit)*</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => setFormData({...formData, nisn: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 0098234121"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Siswa*</label>
                  <input 
                    type="text" 
                    value={formData.namaSiswa}
                    onChange={(e) => setFormData({...formData, namaSiswa: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Nama Lengkap Siswa"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kelas*</label>
                  <select 
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                    required
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jenis Kelamin*</label>
                  <select 
                    value={formData.jk}
                    onChange={(e) => setFormData({...formData, jk: e.target.value as 'L' | 'P'})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                    required
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Agama</label>
                  <select 
                    value={formData.agama}
                    onChange={(e) => setFormData({...formData, agama: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Kristen Katolik">Kristen Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Orang Tua / Wali*</label>
                <input 
                  type="text" 
                  value={formData.orangTua}
                  onChange={(e) => setFormData({...formData, orangTua: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Nama Ayah, Ibu, atau Wali"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">No. HP (WhatsApp)</label>
                  <input 
                    type="text" 
                    value={formData.noHp}
                    onChange={(e) => setFormData({...formData, noHp: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat</label>
                  <input 
                    type="text" 
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-855 dark:text-slate-200"
                    placeholder="Alamat Lengkap Rumah"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-55/10 transition-all cursor-pointer"
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
