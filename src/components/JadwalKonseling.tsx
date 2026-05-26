import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Trash2, Download, Calendar as CalendarIcon, 
  Clock, CheckCircle, Bell, ArrowLeft, ArrowRight, Printer
} from 'lucide-react';
import { JadwalKonseling, Siswa, GuruBK, IdentitasSekolah } from '../types';
import { formatTanggalTabel } from '../utils/db';

interface JadwalKonselingProps {
  jadwal: JadwalKonseling[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (jadwal: Omit<JadwalKonseling, 'id'>) => void;
  onUpdate: (id: string, data: Partial<JadwalKonseling>) => void;
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

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    nisn: '',
    namaSiswa: '',
    kelas: '',
    nipGuru: '',
    namaGuru: '',
    tipeKonseling: 'Individu' as 'Individu' | 'Kelompok' | 'Orang Tua',
    statusKehadiran: 'Menunggu' as 'Menunggu' | 'Hadir' | 'Tidak Hadir' | 'Reschedule',
    keterangan: ''
  });

  // Dynamically update default keterangan with school name if needed
  useEffect(() => {
    if (!formData.keterangan) {
      // Logic could go here
    }
  }, [identitas.namaSekolah]);

  const filteredData = jadwal.filter(j => 
    j.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.namaGuru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      waktu: '09:00',
      nisn: siswa[0]?.nisn || '',
      namaSiswa: siswa[0]?.namaSiswa || '',
      kelas: siswa[0]?.kelas || '',
      nipGuru: guru[0]?.nip || '',
      namaGuru: guru[0]?.nama || '',
      tipeKonseling: 'Individu',
      statusKehadiran: 'Menunggu',
      keterangan: ''
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
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
    }
  };

  const handleGuruChange = (nip: string) => {
    const g = guru.find(x => x.nip === nip);
    if (g) {
      setFormData(prev => ({
        ...prev,
        nipGuru: g.nip,
        namaGuru: g.nama
      }));
    }
  };

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

  // Reminders Logic (Schedules for today or tomorrow)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const reminderSchedules = jadwal.filter(j => 
    (j.tanggal === todayStr || j.tanggal === tomorrowStr) && 
    j.statusKehadiran === 'Menunggu'
  );

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((j, idx) => ({
      'No.': idx + 1,
      'Tanggal': formatTanggalTabel(j.tanggal),
      'Waktu': j.waktu,
      'Siswa': j.namaSiswa,
      'Kelas': j.kelas,
      'Guru BK': j.namaGuru,
      'Tipe Konseling': j.tipeKonseling,
      'Status Kehadiran': j.statusKehadiran,
      'Keterangan': j.keterangan
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
          <h2 style="text-align: center;">LAPORAN JADWAL KONSELING</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Siswa</th>
                <th>Kelas</th>
                <th>Guru BK</th>
                <th>Tipe</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((j, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${formatTanggalTabel(j.tanggal)}</td>
                  <td>${j.waktu}</td>
                  <td>${j.namaSiswa}</td>
                  <td>${j.kelas}</td>
                  <td>${j.namaGuru}</td>
                  <td>${j.tipeKonseling}</td>
                  <td>${j.statusKehadiran}</td>
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
            <CalendarIcon className="w-7 h-7 text-indigo-650" />
            Jadwal Konseling
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Atur janji temu layanan konseling siswa, wali murid, dan konselor BK
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Jadwal Baru
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

      {/* Reminders Panel */}
      {reminderSchedules.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-850 dark:text-amber-300">
            <Bell className="w-4 h-4 text-amber-550 animate-bounce" />
            <span>Pengingat Jadwal Terdekat (Hari ini / Besok)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reminderSchedules.map(r => (
              <div 
                key={r.id} 
                className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-205">{r.namaSiswa} ({r.kelas})</span>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{r.tanggal === todayStr ? 'Hari Ini' : 'Besok'} pukul {r.waktu} WIT</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Guru: {r.namaGuru}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleUpdateStatus(r.id, 'Hadir')}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Tandai Hadir"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari siswa, kelas, atau nama guru..." 
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
                <th className="px-6 py-4">Tanggal & Waktu</th>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Guru BK</th>
                <th className="px-6 py-4">Tipe Konseling</th>
                <th className="px-6 py-4 text-center">Kehadiran</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan data jadwal konseling.
                  </td>
                </tr>
              ) : (
                paginatedData.map((j, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-350">{formatTanggalTabel(j.tanggal)}</div>
                        <div className="text-[10px] font-semibold text-indigo-650 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {j.waktu} WIT
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-850 dark:text-slate-200">{j.namaSiswa}</div>
                        <div className="text-[10px] font-mono text-slate-400">NISN: {j.nisn}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{j.kelas}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{j.namaGuru}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                          {j.tipeKonseling}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={j.statusKehadiran}
                          onChange={(e) => handleUpdateStatus(j.id, e.target.value as any)}
                          className={`
                            px-2 py-1 rounded text-[10px] font-extrabold uppercase focus:outline-none border border-transparent cursor-pointer
                            ${j.statusKehadiran === 'Hadir' ? 'bg-emerald-55/20 text-emerald-800 border-emerald-250 dark:text-emerald-400' :
                              j.statusKehadiran === 'Reschedule' ? 'bg-amber-55/20 text-amber-800 border-amber-250 dark:text-amber-400' :
                              j.statusKehadiran === 'Tidak Hadir' ? 'bg-rose-55/20 text-rose-800 border-rose-250 dark:text-rose-400' :
                              'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}
                          `}
                        >
                          <option value="Menunggu">Menunggu</option>
                          <option value="Hadir">Hadir</option>
                          <option value="Tidak Hadir">Tidak Hadir</option>
                          <option value="Reschedule">Reschedule</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400" title={j.keterangan}>
                        {j.keterangan || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(j.id)}
                          className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Jadwal"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Jadwal
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

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Buat Jadwal Konseling</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Konseling*</label>
                  <input 
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Waktu Pertemuan (WIT)*</label>
                  <input 
                    type="text"
                    value={formData.waktu}
                    onChange={(e) => setFormData({...formData, waktu: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 09:30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa*</label>
                  <select 
                    value={formData.nisn}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="" disabled>-- Pilih Siswa --</option>
                    {siswa.map(s => (
                      <option key={s.id} value={s.nisn}>{s.namaSiswa} ({s.kelas})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Guru BK Penanggung Jawab*</label>
                  <select 
                    value={formData.nipGuru}
                    onChange={(e) => handleGuruChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="" disabled>-- Pilih Guru BK --</option>
                    {guru.map(g => (
                      <option key={g.id} value={g.nip}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipe Konseling*</label>
                  <select 
                    value={formData.tipeKonseling}
                    onChange={(e) => setFormData({...formData, tipeKonseling: e.target.value as any})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="Individu">Individu (Siswa Mandiri)</option>
                    <option value="Kelompok">Kelompok (Beberapa Siswa)</option>
                    <option value="Orang Tua">Orang Tua / Wali Murid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status Awal Kehadiran*</label>
                  <select 
                    value={formData.statusKehadiran}
                    onChange={(e) => setFormData({...formData, statusKehadiran: e.target.value as any})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    <option value="Menunggu">Menunggu Konfirmasi</option>
                    <option value="Hadir">Sudah Hadir</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                    <option value="Reschedule">Reschedule / Jadwal Ulang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Catatan / Keterangan Jadwal</label>
                <textarea 
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  placeholder="Contoh: Pembahasan PR yang sering menumpuk atau penyelarasan laporan dengan wali murid."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
