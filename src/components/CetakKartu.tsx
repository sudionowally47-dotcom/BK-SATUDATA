import React, { useState } from 'react';
import { CreditCard, Search, Printer, CheckSquare, Square, Info, Plus } from 'lucide-react';
import { Siswa, Kelas, IdentitasSekolah } from '../types';

interface CetakKartuProps {
  siswa: Siswa[];
  kelas: Kelas[];
  identitas: IdentitasSekolah;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const CetakKartu: React.FC<CetakKartuProps> = ({
  siswa,
  kelas,
  identitas,
  triggerNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter siswa
  const filteredSiswa = siswa.filter(s => {
    const matchesSearch = s.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm);
    const matchesKelas = filterKelas ? s.kelas === filterKelas : true;
    return matchesSearch && matchesKelas;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredSiswa.map(s => s.id);
    const allSelected = allFilteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Unselect only the filtered ones
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered ones
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handlePrintCards = () => {
    if (selectedIds.length === 0) {
      triggerNotification("Pilih minimal 1 siswa untuk mencetak kartu login!", "error");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = selectedIds.map(id => {
      const s = siswa.find(x => x.id === id);
      if (!s) return '';
      return `
        <div class="card">
          <div class="card-decor"></div>
          <div class="card-header">
            <svg class="card-logo" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <div>
              <h3>KARTU LOGIN SISWA</h3>
              <h4>${identitas.namaSekolah}</h4>
            </div>
          </div>
          <div class="card-body">
            <table class="details-table">
              <tr>
                <td style="width: 80px; font-weight: bold; color: #555;">Nama Siswa</td>
                <td style="width: 10px;">:</td>
                <td style="font-weight: bold; color: #111;">${s.namaSiswa}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #555;">Kelas</td>
                <td>:</td>
                <td><span class="badge">${s.kelas}</span></td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #555;">Username</td>
                <td>:</td>
                <td><code class="code-box">${s.nisn}</code></td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #555;">Password</td>
                <td>:</td>
                <td><code class="code-box">${s.nisn}</code></td>
              </tr>
            </table>
          </div>
          <div class="card-footer">
            * Simpan kartu ini baik-baik untuk mengisi Asesmen Mandiri BK
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Cetak Kartu Login Siswa - ${identitas.namaSekolah}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background-color: #ffffff; 
              padding: 20px; 
              color: #333; 
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .card {
              position: relative;
              background: #ffffff;
              border: 2px solid #4F46E5;
              border-radius: 12px;
              padding: 18px;
              box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
              page-break-inside: avoid;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 200px;
            }
            .card-decor {
              position: absolute;
              top: 0;
              right: 0;
              width: 80px;
              height: 80px;
              background: radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
              transform: translate(20px, -20px);
            }
            .card-header {
              display: flex;
              align-items: center;
              gap: 10px;
              border-bottom: 2px solid #F3F4F6;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .card-logo {
              width: 32px;
              height: 32px;
            }
            .card-header h3 { 
              margin: 0; 
              color: #4F46E5; 
              font-size: 13px; 
              font-weight: 800; 
              letter-spacing: 0.5px;
            }
            .card-header h4 { 
              margin: 2px 0 0 0; 
              color: #4B5563; 
              font-size: 10px; 
              font-weight: 600;
            }
            .details-table { 
              width: 100%; 
              font-size: 12px; 
              border-collapse: collapse; 
            }
            .details-table td { 
              padding: 4px 0; 
              vertical-align: middle; 
            }
            .badge {
              background-color: #EEF2F6;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: bold;
              color: #374151;
            }
            .code-box { 
              font-family: monospace; 
              font-weight: 800; 
              background: #F3F4F6; 
              padding: 3px 8px; 
              border-radius: 6px; 
              color: #1F2937; 
              border: 1px solid #E5E7EB;
            }
            .card-footer {
              margin-top: 10px;
              border-top: 1px dashed #E5E7EB;
              padding-top: 6px;
              font-size: 8.5px;
              color: #6B7280;
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
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-650" />
            Cetak Kartu Login Siswa
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Unduh atau cetak kartu akun siswa agar siswa dapat login mandiri untuk mengisi asesmen
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => { triggerNotification("Untuk mendaftarkan kartu baru, silakan tambah data siswa di menu 'Data Siswa' terlebih dahulu.", "success"); }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            Daftarkan Kartu Siswa Baru
          </button>
          
          <button 
            onClick={handlePrintCards}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer ${selectedIds.length === 0 ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-indigo-650 hover:bg-indigo-700 shadow-indigo-600/10'}`}
          >
            <Printer className="w-4 h-4" />
            Cetak Kartu Terpilih ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-150/40 dark:border-indigo-900/50 p-4 rounded-3xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-305 leading-relaxed">
          <span className="font-bold">Informasi Login:</span> Secara default, username dan password login bagi siswa adalah <b>NISN</b> masing-masing siswa yang terdaftar di database utama. Silakan pilih kelas atau gunakan pencarian untuk menyaring siswa.
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari NISN atau nama siswa..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
          />
        </div>

        <select 
          value={filterKelas} 
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
        >
          <option value="">Semua Kelas</option>
          {kelas.map(k => (
            <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
          ))}
        </select>
      </div>

      {/* Selection Control Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
        <button
          onClick={handleSelectAllFiltered}
          className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-650 transition-colors cursor-pointer"
        >
          {filteredSiswa.every(s => selectedIds.includes(s.id)) ? (
            <>
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Batal Pilih Semua Hasil Filter ({filteredSiswa.length})</span>
            </>
          ) : (
            <>
              <Square className="w-4 h-4" />
              <span>Pilih Semua Hasil Filter ({filteredSiswa.length})</span>
            </>
          )}
        </button>

        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
          {selectedIds.length} Siswa dipilih dari total {siswa.length} siswa
        </span>
      </div>

      {/* Grid of Student Card Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSiswa.map(s => {
          const isSelected = selectedIds.includes(s.id);
          return (
            <div 
              key={s.id}
              onClick={() => toggleSelect(s.id)}
              className={`
                cursor-pointer relative bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-44
                ${isSelected 
                  ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/10' 
                  : 'border-slate-200 dark:border-slate-805 hover:border-indigo-300'}
              `}
            >
              {/* Checkbox badge */}
              <div className="absolute top-4 right-4">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-350" />
                )}
              </div>

              {/* Card Header inside preview */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                <CreditCard className="w-6 h-6 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 leading-none">KARTU LOGIN SISWA</h3>
                  <span className="text-[9px] text-slate-450 font-bold uppercase block mt-0.5">{identitas.namaSekolah}</span>
                </div>
              </div>

              {/* Card details */}
              <div className="space-y-1 text-xs">
                <div className="flex">
                  <span className="w-20 text-slate-400 font-semibold">Nama</span>
                  <span className="flex-1 font-bold text-slate-850 dark:text-slate-200 truncate">{s.namaSiswa}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-slate-400 font-semibold">Kelas</span>
                  <span className="flex-1 font-semibold text-slate-700 dark:text-slate-400">{s.kelas}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-20 text-slate-400 font-semibold">NISN / Sandi</span>
                  <span className="flex-1 font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-350">
                    {s.nisn}
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 border-t border-slate-50 dark:border-slate-850 pt-2 text-center italic">
                * Klik kartu ini untuk memilih
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
