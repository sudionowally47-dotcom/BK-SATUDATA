import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, Edit2
} from 'lucide-react';
import { AsesmenSiswa, Siswa, IdentitasSekolah, GuruBK } from '../types';

interface CatatanAnekdotProps {
  asesmen: AsesmenSiswa[];
  siswa: Siswa[];
  guru: GuruBK[];
  identitas: IdentitasSekolah;
  onAdd: (asesmen: Omit<AsesmenSiswa, 'id'>) => void;
  onUpdate: (id: string, data: Partial<AsesmenSiswa>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const CatatanAnekdot: React.FC<CatatanAnekdotProps> = ({
  asesmen,
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

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAnekdot, setCurrentAnekdot] = useState<AsesmenSiswa | null>(null);
  const [selectedNisn, setSelectedNisn] = useState('');
  
  const [anekdotTanggal, setAnekdotTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [anekdotLokasi, setAnekdotLokasi] = useState('');
  const [anekdotPencatat, setAnekdotPencatat] = useState('');
  const [anekdotPeristiwa, setAnekdotPeristiwa] = useState('');
  const [anekdotInterpretasi, setAnekdotInterpretasi] = useState('');
  const [anekdotTindakLanjut, setAnekdotTindakLanjut] = useState('');

  const filteredData = asesmen.filter(a => 
    a.jenisAsesmen === 'Catatan Anekdot' && (
      a.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nisn.includes(searchTerm)
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const startNewWizard = () => {
    setSelectedNisn('');
    setAnekdotTanggal(new Date().toISOString().split('T')[0]);
    setAnekdotLokasi('');
    setAnekdotPencatat('');
    setAnekdotPeristiwa('');
    setAnekdotInterpretasi('');
    setAnekdotTindakLanjut('');
    setIsWizardOpen(true);
  };

  const handleOpenEdit = (a: AsesmenSiswa) => {
    setCurrentAnekdot(a);
    setSelectedNisn(a.nisn);
    setAnekdotTanggal(a.tanggal);
    let d: any = {};
    try { d = JSON.parse(a.detailSkor || '{}'); } catch(e) {}
    setAnekdotLokasi(d.lokasi || '');
    setAnekdotPencatat(d.pencatat || '');
    setAnekdotPeristiwa(d.peristiwa || '');
    setAnekdotInterpretasi(d.interpretasi || '');
    setAnekdotTindakLanjut(d.tindakLanjut || '');
    setIsEditModalOpen(true);
  };

  const handleSubmitWizard = (e: React.FormEvent) => {
    e.preventDefault();
    const s = siswa.find(x => x.nisn === selectedNisn);
    if (!s) {
      triggerNotification("Silakan pilih siswa!", "error");
      return;
    }

    if (!anekdotPeristiwa.trim()) {
      triggerNotification("Deskripsi peristiwa wajib diisi!", "error");
      return;
    }

    const hasilStr = `Peristiwa: ${anekdotPeristiwa.substring(0, 100)}${anekdotPeristiwa.length > 100 ? '...' : ''}`;
    const detailSkorStr = JSON.stringify({
      lokasi: anekdotLokasi,
      pencatat: anekdotPencatat,
      peristiwa: anekdotPeristiwa,
      interpretasi: anekdotInterpretasi,
      tindakLanjut: anekdotTindakLanjut
    });

    onAdd({
      tanggal: anekdotTanggal,
      nisn: s.nisn,
      namaSiswa: s.namaSiswa,
      kelas: s.kelas,
      jenisAsesmen: 'Catatan Anekdot',
      hasil: hasilStr,
      detailSkor: detailSkorStr,
      // @ts-ignore
      lokasi: anekdotLokasi,
      pencatat: anekdotPencatat,
      peristiwa: anekdotPeristiwa,
      interpretasi: anekdotInterpretasi,
      tindakLanjut: anekdotTindakLanjut
    });

    setIsWizardOpen(false);
    triggerNotification(`Catatan Anekdot berhasil disimpan!`, "success");
  };

  const handleUpdateAnekdot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnekdot) return;

    if (!anekdotPeristiwa.trim()) {
      triggerNotification("Deskripsi peristiwa wajib diisi!", "error");
      return;
    }

    const hasilStr = `Peristiwa: ${anekdotPeristiwa.substring(0, 100)}${anekdotPeristiwa.length > 100 ? '...' : ''}`;
    const detailSkorStr = JSON.stringify({
      lokasi: anekdotLokasi,
      pencatat: anekdotPencatat,
      peristiwa: anekdotPeristiwa,
      interpretasi: anekdotInterpretasi,
      tindakLanjut: anekdotTindakLanjut
    });

    onUpdate(currentAnekdot.id, {
      tanggal: anekdotTanggal,
      nisn: selectedNisn,
      namaSiswa: siswa.find(x => x.nisn === selectedNisn)?.namaSiswa || currentAnekdot.namaSiswa,
      kelas: siswa.find(x => x.nisn === selectedNisn)?.kelas || currentAnekdot.kelas,
      hasil: hasilStr,
      detailSkor: detailSkorStr,
      // @ts-ignore
      lokasi: anekdotLokasi,
      pencatat: anekdotPencatat,
      peristiwa: anekdotPeristiwa,
      interpretasi: anekdotInterpretasi,
      tindakLanjut: anekdotTindakLanjut
    });

    setIsEditModalOpen(false);
    setCurrentAnekdot(null);
    triggerNotification(`Catatan Anekdot berhasil diperbarui!`, "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan anekdot ini?")) {
      onDelete(id);
      triggerNotification("Data berhasil dihapus!", "success");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((a, idx) => {
      let d: any = {};
      try { d = JSON.parse(a.detailSkor || '{}'); } catch(e) {}
      return {
        'No.': idx + 1,
        'Tanggal': a.tanggal,
        'NISN': a.nisn,
        'Nama Siswa': a.namaSiswa,
        'Kelas': a.kelas,
        'Lokasi': d.lokasi || '-',
        'Pencatat': d.pencatat || '-',
        'Peristiwa': d.peristiwa || '-',
        'Interpretasi': d.interpretasi || '-',
        'Tindak Lanjut': d.tindakLanjut || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catatan Anekdot");
    XLSX.writeFile(wb, `Catatan_Anekdot_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Catatan Anekdot - ${identitas.namaSekolah}</title>
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
          <h2 style="text-align: center;">LAPORAN CATATAN ANEKDOT</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 80px;">Tanggal</th>
                <th style="width: 150px;">Siswa</th>
                <th style="width: 50px;">Kelas</th>
                <th>Lokasi</th>
                <th>Pencatat</th>
                <th>Peristiwa</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((a, idx) => {
                let d: any = {};
                try { d = JSON.parse(a.detailSkor || '{}'); } catch(e) {}
                return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${a.tanggal}</td>
                  <td>${a.namaSiswa}<br><small>${a.nisn}</small></td>
                  <td>${a.kelas}</td>
                  <td>${d.lokasi || '-'}</td>
                  <td>${d.pencatat || '-'}</td>
                  <td>${d.peristiwa || '-'}</td>
                </tr>
              `;}).join('')}
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
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Catatan Anekdot
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrintPDF} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm">
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={startNewWizard} className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#005A9C] hover:bg-[#004A80] rounded-lg shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{filteredData.length} data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[12px] font-semibold text-slate-600 border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-4 w-12 text-center">No</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="px-4 py-4">Siswa</th>
                <th className="px-4 py-4">Kelas</th>
                <th className="px-4 py-4">Lokasi</th>
                <th className="px-4 py-4">Pencatat</th>
                <th className="px-4 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium italic">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                paginatedData.map((a, index) => {
                  const no = startIndex + index + 1;
                  let lokasi = '-', pencatat = '-';
                  try {
                    const d = JSON.parse(a.detailSkor || '{}');
                    lokasi = d.lokasi || '-';
                    pencatat = d.pencatat || '-';
                  } catch (e) {}

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-700 dark:text-slate-400 whitespace-nowrap">{a.tanggal}</td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-205">{a.namaSiswa}</span>
                        <div className="text-[10px] font-mono text-slate-400">NISN: {a.nisn}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600 dark:text-slate-400">{a.kelas}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{lokasi}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{pencatat}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Ubah data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(a.id)}
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

        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-4">
            <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-[#F4F7FB]/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Tambah Catatan Anekdot</h3>
              <button onClick={() => setIsWizardOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmitWizard} className="p-6 pt-2 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                  <input type="date" value={anekdotTanggal} onChange={(e) => setAnekdotTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pilih Siswa</label>
                  <select value={selectedNisn} onChange={(e) => setSelectedNisn(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-350" required>
                    <option value="">Pilih Siswa</option>
                    {siswa.map(s => <option key={s.id} value={s.nisn}>{s.namaSiswa}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Lokasi</label>
                  <input type="text" value={anekdotLokasi} onChange={(e) => setAnekdotLokasi(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pencatat / Guru</label>
                  <input type="text" value={anekdotPencatat} onChange={(e) => setAnekdotPencatat(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Peristiwa</label>
                <textarea value={anekdotPeristiwa} onChange={(e) => setAnekdotPeristiwa(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Interpretasi</label>
                <textarea value={anekdotInterpretasi} onChange={(e) => setAnekdotInterpretasi(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tindak Lanjut</label>
                <textarea value={anekdotTindakLanjut} onChange={(e) => setAnekdotTindakLanjut(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsWizardOpen(false)} className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="px-8 py-2 rounded-lg bg-[#005A9C] hover:bg-[#004A80] text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && currentAnekdot && (
        <div className="fixed inset-0 z-50 bg-[#F4F7FB]/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Ubah Catatan Anekdot</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleUpdateAnekdot} className="p-6 pt-2 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                  <input type="date" value={anekdotTanggal} onChange={(e) => setAnekdotTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Siswa</label>
                  <input type="text" value={currentAnekdot.namaSiswa} readOnly className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Lokasi</label>
                  <input type="text" value={anekdotLokasi} onChange={(e) => setAnekdotLokasi(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pencatat / Guru</label>
                  <input type="text" value={anekdotPencatat} onChange={(e) => setAnekdotPencatat(e.target.value)} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Peristiwa</label>
                <textarea value={anekdotPeristiwa} onChange={(e) => setAnekdotPeristiwa(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Interpretasi</label>
                <textarea value={anekdotInterpretasi} onChange={(e) => setAnekdotInterpretasi(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tindak Lanjut</label>
                <textarea value={anekdotTindakLanjut} onChange={(e) => setAnekdotTindakLanjut(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 resize-none" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="px-8 py-2 rounded-lg bg-[#005A9C] hover:bg-[#004A80] text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
