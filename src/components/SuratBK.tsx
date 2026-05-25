import React, { useState } from 'react';
import { 
  Plus, Search, Trash2, Printer, FileText, 
  ArrowLeft, ArrowRight, Eye, Sparkles 
} from 'lucide-react';
import { SuratBK, Siswa, JenisSurat, IdentitasSekolah, GuruBK } from '../types';

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeSurat, setActiveSurat] = useState<SuratBK | null>(null);

  // Form States
  const [jenisSurat, setJenisSurat] = useState<JenisSurat>('Surat Panggilan Siswa');
  const [selectedNisn, setSelectedNisn] = useState('');
  
  // Specific inputs for Surat Panggilan
  const [panggilanHariTanggal, setPanggilanHariTanggal] = useState('Senin, 23 Februari 2026');
  const [panggilanWaktu, setPanggilanWaktu] = useState('09:00 WIT');
  const [panggilanTempat, setPanggilanTempat] = useState(`Ruang BK ${identitas.namaSekolah}`);
  const [panggilanAcara, setPanggilanAcara] = useState('Konseling Bersama Wali Murid');
  const [panggilanPenerima, setPanggilanPenerima] = useState('');

  // Specific inputs for Surat Pernyataan
  const [pernyataanPelanggaran, setPernyataanPelanggaran] = useState('Sering tidak masuk sekolah tanpa keterangan');
  const [pernyataanKomitmen, setPernyataanKomitmen] = useState('Berjanji tidak akan mengulangi perbuatan tersebut dan akan menaati seluruh tata tertib sekolah');

  // Specific inputs for Surat Keterangan
  const [keteranganIsi, setKeteranganIsi] = useState('Bahwa siswa tersebut di atas berkelakuan baik dan aktif mengikuti kegiatan Bimbingan Konseling secara kooperatif.');

  // Tab state for different letter types
  const [activeTab, setActiveTab] = useState<string>('Semua');

  const filteredData = surat.filter(s => {
    const matchesTab = activeTab === 'Semua' ? true : s.jenisSurat === activeTab;
    const matchesSearch = 
      s.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomorSurat.includes(searchTerm) ||
      s.jenisSurat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Helper: auto generate letter number
  const generateNomorSurat = (jenis: JenisSurat) => {
    const totalCount = surat.length + 1;
    const padNumber = String(totalCount).padStart(3, '0');
    const code = jenis === 'Surat Panggilan Siswa' ? 'SP-BK' : jenis === 'Surat Pernyataan' ? 'SP-SISWA' : 'SK-BK';
    const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
    const year = new Date().getFullYear();
    return `${padNumber}/${code}/SMPN4-FFK/${monthRoman}/${year}`;
  };

  const handleOpenAdd = () => {
    setSelectedNisn(siswa[0]?.nisn || '');
    setPanggilanPenerima(siswa[0]?.orangTua || '');
    setIsAddModalOpen(true);
  };

  const handleStudentChange = (nisn: string) => {
    setSelectedNisn(nisn);
    const s = siswa.find(x => x.nisn === nisn);
    if (s) {
      setPanggilanPenerima(s.orangTua);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const s = siswa.find(x => x.nisn === selectedNisn);
    if (!s) return;

    let detailPayload = {};
    if (jenisSurat === 'Surat Panggilan Siswa') {
      detailPayload = {
        hariTanggal: panggilanHariTanggal,
        waktu: panggilanWaktu,
        tempat: panggilanTempat,
        acara: panggilanAcara,
        penerima: panggilanPenerima
      };
    } else if (jenisSurat === 'Surat Pernyataan') {
      detailPayload = {
        pelanggaran: pernyataanPelanggaran,
        komitmen: pernyataanKomitmen
      };
    } else {
      detailPayload = {
        isiKeterangan: keteranganIsi
      };
    }

    onAdd({
      nomorSurat: generateNomorSurat(jenisSurat),
      tanggal: new Date().toISOString().split('T')[0],
      jenisSurat,
      nisn: s.nisn,
      namaSiswa: s.namaSiswa,
      kelas: s.kelas,
      detail: JSON.stringify(detailPayload)
    });

    setIsAddModalOpen(false);
    triggerNotification("Administrasi Surat berhasil dibuat!", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus arsip surat ini?")) {
      onDelete(id);
      triggerNotification("Arsip surat berhasil dihapus!", "success");
    }
  };

  const handleOpenPreview = (item: SuratBK) => {
    setActiveSurat(item);
    setIsPreviewModalOpen(true);
  };

  // Direct Print Layout using Kop Surat from IdentitasSekolah
  const handlePrintLetter = (item: SuratBK) => {
    const s = siswa.find(x => x.nisn === item.nisn) || { alamat: '', orangTua: '' };
    let details: any = {};
    try {
      details = JSON.parse(item.detail);
    } catch(e) {}

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let contentHtml = '';

    if (item.jenisSurat === 'Surat Panggilan Siswa') {
      contentHtml = `
        <div style="margin-top: 20px;">
          <p>Nomor : ${item.nomorSurat}<br>Hal : Panggilan Konseli / Siswa</p>
          <p>Kepada Yth.<br>Bapak/Ibu Orang Tua/Wali dari <b>${item.namaSiswa}</b><br>di Tempat</p>
          <p style="text-indent: 40px; text-align: justify; line-height: 1.6;">Dengan hormat, mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid pada sesi bimbingan konseling yang akan diselenggarakan pada:</p>
          <table style="margin-left: 40px; margin-bottom: 20px;">
            <tr><td style="width: 120px;">Hari/Tanggal</td><td>: ${details.hariTanggal || ''}</td></tr>
            <tr><td>Waktu</td><td>: ${details.waktu || ''}</td></tr>
            <tr><td>Tempat</td><td>: ${details.tempat || ''}</td></tr>
            <tr><td>Keperluan</td><td>: ${details.acara || ''}</td></tr>
          </table>
          <p style="text-indent: 40px; text-align: justify; line-height: 1.6;">Mengingat pentingnya koordinasi demi perkembangan akademik dan pembinaan kepribadian putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran tepat pada waktunya. Demikian undangan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
        </div>
      `;
    } else if (item.jenisSurat === 'Surat Pernyataan') {
      contentHtml = `
        <div style="margin-top: 20px; text-align: center;">
          <h3 style="text-decoration: underline; margin-bottom: 0;">SURAT PERNYATAAN</h3>
          <p style="margin-top: 5px;">Nomor: ${item.nomorSurat}</p>
        </div>
        <div style="margin-top: 20px;">
          <p>Yang bertanda tangan di bawah ini:</p>
          <table style="margin-left: 20px; margin-bottom: 20px;">
            <tr><td style="width: 120px;">Nama Siswa</td><td>: <b>${item.namaSiswa}</b></td></tr>
            <tr><td>NISN</td><td>: ${item.nisn}</td></tr>
            <tr><td>Kelas</td><td>: ${item.kelas}</td></tr>
            <tr><td>Alamat</td><td>: ${s.alamat || ''}</td></tr>
          </table>
          <p style="text-align: justify; line-height: 1.6;">Menyatakan dengan sesungguhnya bahwa saya telah melakukan pelanggaran berupa: <br><i>"${details.pelanggaran || ''}"</i></p>
          <p style="text-align: justify; line-height: 1.6;">Atas pelanggaran tersebut, saya menyesali perbuatan saya dan berkomitmen: <br><i>"${details.komitmen || ''}"</i></p>
          <p style="text-align: justify; line-height: 1.6;">Demikian surat pernyataan ini saya buat dengan sadar, jujur, tanpa paksaan dari pihak mana pun, dan siap menerima sanksi sesuai aturan sekolah apabila saya mengulangi pelanggaran tersebut.</p>
        </div>
      `;
    } else { // Surat Keterangan
      contentHtml = `
        <div style="margin-top: 20px; text-align: center;">
          <h3 style="text-decoration: underline; margin-bottom: 0;">SURAT KETERANGAN BK</h3>
          <p style="margin-top: 5px;">Nomor: ${item.nomorSurat}</p>
        </div>
        <div style="margin-top: 20px;">
          <p>Yang bertanda tangan di bawah ini, Koordinator Bimbingan Konseling ${identitas.namaSekolah} menerangkan bahwa:</p>
          <table style="margin-left: 20px; margin-bottom: 20px;">
            <tr><td style="width: 120px;">Nama Siswa</td><td>: <b>${item.namaSiswa}</b></td></tr>
            <tr><td>NISN</td><td>: ${item.nisn}</td></tr>
            <tr><td>Kelas</td><td>: ${item.kelas}</td></tr>
          </table>
          <p style="text-align: justify; line-height: 1.6; text-indent: 40px;">${details.isiKeterangan || ''}</p>
          <p style="text-align: justify; line-height: 1.6; text-indent: 40px;">Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        </div>
      `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${item.jenisSurat} - ${item.namaSiswa}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; line-height: 1.5; font-size: 14px; }
            .kop-img-container { width: 100%; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 10px; }
            .kop-img { width: 100%; height: auto; max-height: 150px; object-fit: contain; }
            .kop-surat { border-bottom: 3.5px double #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; text-align: center; }
            .logo-img { width: 75px; height: 75px; margin-right: 15px; }
            .kop-text h2 { margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; }
            .kop-text h1 { margin: 2px 0; font-size: 21px; font-weight: bold; text-transform: uppercase; }
            .kop-text p { margin: 2px 0; font-size: 12px; font-style: italic; }
            .ttd-container { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .ttd-box { width: 220px; text-align: center; }
            .ttd-space { height: 75px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${identitas.kopSuratUrl ? `
            <div class="kop-img-container">
              <img src="${identitas.kopSuratUrl}" class="kop-img" alt="Kop Surat" />
            </div>
          ` : `
            <div class="kop-surat">
              ${identitas.logoUrl ? `<img class="logo-img" src="${identitas.logoUrl}" alt="logo">` : ''}
              <div class="kop-text">
                <h2>PEMERINTAH KABUPATEN FAKFAK<br />DINAS PENDIDIKAN</h2>
                <h1>${identitas.namaSekolah}</h1>
                <p>Alamat: ${identitas.alamat} | Telp: ${identitas.telepon} | Email: ${identitas.email}</p>
              </div>
            </div>
          `}
          
          ${contentHtml}

          <div class="ttd-container" style="font-size: 12px; line-height: 1.5;">
            <div class="ttd-box" style="text-align: left;">
              <div style="height: 1.5em;"></div>
              ${item.jenisSurat === 'Surat Pernyataan' ? `
                <p style="margin: 0;">Mengetahui,</p>
                <p style="margin: 0 0 75px 0;">Orang Tua/Wali Murid</p>
                <p style="margin: 0;">_______________________</p>
              ` : `
                <p style="margin: 0;">Mengetahui,</p>
                <p style="margin: 0 0 75px 0;">Kepala Sekolah</p>
                <p style="margin: 0; font-weight: bold;"><u>${identitas.kepalaSekolah}</u></p>
                <p style="margin: 0;">NIP. ${identitas.nipKepalaSekolah}</p>
              `}
            </div>
            
            <div class="ttd-box" style="text-align: left;">
              <p style="margin: 0;">${identitas.tempatTandaTangan}, ${identitas.tanggalDokumen}</p>
              <div style="height: 1.5em;"></div>
              ${item.jenisSurat === 'Surat Pernyataan' ? `
                <p style="margin: 0;">Siswa Yang Menyatakan,</p>
                <p style="margin: 0 0 50px 0;">&nbsp;</p>
                <p style="margin: 0; font-weight: bold;"><u>${item.namaSiswa}</u></p>
                <p style="margin: 0;">NISN: ${item.nisn}</p>
              ` : `
                <p style="margin: 0;">Guru BK / Konselor</p>
                <p style="margin: 0 0 50px 0;">&nbsp;</p>
                <p style="margin: 0; font-weight: bold;"><u>${guru[0]?.nama || '..........................'}</u></p>
                <p style="margin: 0;">NIP. ${guru[0]?.nip || '..........................'}</p>
              `}
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
            <FileText className="w-7 h-7 text-indigo-650" />
            Administrasi Surat BK
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Buat otomatis dan cetak Surat Panggilan, Surat Pernyataan Tata Tertib, dan Surat Keterangan BK
          </p>
        </div>
      </div>

      {/* Tabs / Submenu */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-px overflow-x-auto">
        {[
          { label: 'Semua Arsip Surat', value: 'Semua' },
          { label: 'Surat Panggilan Siswa', value: 'Surat Panggilan Siswa' },
          { label: 'Surat Pernyataan', value: 'Surat Pernyataan' },
          { label: 'Surat Keterangan', value: 'Surat Keterangan' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setJenisSurat(tab.value === 'Semua' ? 'Surat Panggilan Siswa' : tab.value as JenisSurat);
              setCurrentPage(1);
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

      {/* Search Input & Submenu Dedicated Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
          <input 
            type="text" 
            placeholder="Cari nomor surat, nama siswa, atau jenis surat..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-205"
          />
        </div>

        <button 
          onClick={handleOpenAdd} 
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Buat {activeTab === 'Semua' ? 'Surat Baru' : activeTab}
        </button>
      </div>

      {/* Table List of Letters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">Nomor Surat</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Jenis Surat</th>
                <th className="px-6 py-4">Siswa Penerima</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4 text-center">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium">
                    Tidak ditemukan arsip surat BK.
                  </td>
                </tr>
              ) : (
                paginatedData.map((s, index) => {
                  const no = startIndex + index + 1;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{no}</td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{s.nomorSurat}</td>
                      <td className="px-6 py-4 font-semibold text-slate-655 dark:text-slate-400 whitespace-nowrap">{s.tanggal}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-0.5 rounded text-[9px] font-bold uppercase
                          ${s.jenisSurat === 'Surat Panggilan Siswa' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            s.jenisSurat === 'Surat Pernyataan' ? 'bg-rose-100 text-rose-800 dark:bg-rose-955 dark:text-rose-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}
                        `}>
                          {s.jenisSurat}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-205">{s.namaSiswa}</td>
                      <td className="px-6 py-4 font-semibold">{s.kelas}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenPreview(s)}
                            className="p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Pratinjau Surat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePrintLetter(s)}
                            className="p-1.5 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Surat (Browser/PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Arsip"
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Surat
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

      {/* Add/Create Letter Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Buat Administrasi Surat</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jenis Administrasi Surat*</label>
                  <select 
                    value={jenisSurat}
                    onChange={(e) => setJenisSurat(e.target.value as JenisSurat)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                  >
                    <option value="Surat Panggilan Siswa">Surat Panggilan Siswa (Ortu)</option>
                    <option value="Surat Pernyataan">Surat Pernyataan Siswa</option>
                    <option value="Surat Keterangan">Surat Keterangan BK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa*</label>
                  <select 
                    value={selectedNisn}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-705 dark:text-slate-350"
                    required
                  >
                    {siswa.map(s => (
                      <option key={s.id} value={s.nisn}>{s.namaSiswa} - Kelas {s.kelas} ({s.nisn})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic inputs based on Letter Type */}
              {jenisSurat === 'Surat Panggilan Siswa' && (
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase">Parameter Surat Panggilan</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Penerima Panggilan (Nama Ortu)</label>
                      <input 
                        type="text"
                        value={panggilanPenerima}
                        onChange={(e) => setPanggilanPenerima(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="Nama Bapak/Ibu"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Hari, Tanggal Sesi*</label>
                      <input 
                        type="text"
                        value={panggilanHariTanggal}
                        onChange={(e) => setPanggilanHariTanggal(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="Contoh: Kamis, 19 Februari 2026"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Waktu Pertemuan*</label>
                      <input 
                        type="text"
                        value={panggilanWaktu}
                        onChange={(e) => setPanggilanWaktu(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="Contoh: 09:00 WIT s/d Selesai"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tempat Pertemuan*</label>
                      <input 
                        type="text"
                        value={panggilanTempat}
                        onChange={(e) => setPanggilanTempat(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="Ruang Konseling BK"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Acara / Keperluan*</label>
                    <input 
                      type="text"
                      value={panggilanAcara}
                      onChange={(e) => setPanggilanAcara(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                      placeholder="Contoh: Penyelesaian masalah indisipliner kehadiran"
                      required
                    />
                  </div>
                </div>
              )}

              {jenisSurat === 'Surat Pernyataan' && (
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase">Parameter Surat Pernyataan</span>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jenis Pelanggaran yang Dilakukan*</label>
                    <textarea 
                      value={pernyataanPelanggaran}
                      onChange={(e) => setPernyataanPelanggaran(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                      placeholder="Deskripsikan kesalahan siswa yang melanggar tata tertib"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Komitmen / Janji Perbaikan*</label>
                    <textarea 
                      value={pernyataanKomitmen}
                      onChange={(e) => setPernyataanKomitmen(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                      placeholder="Contoh: Berjanji tidak mengulangi, aktif masuk kelas..."
                      required
                    />
                  </div>
                </div>
              )}

              {jenisSurat === 'Surat Keterangan' && (
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase">Parameter Surat Keterangan</span>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Isi/Pernyataan Keterangan BK*</label>
                    <textarea 
                      value={keteranganIsi}
                      onChange={(e) => setKeteranganIsi(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-205"
                      placeholder="Tuliskan keterangan detail mengenai data BK siswa"
                      required
                    />
                  </div>
                </div>
              )}

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
                  Simpan & Buat Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Letter Modal */}
      {isPreviewModalOpen && activeSurat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Pratinjau Surat Resmi BK
              </h3>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Simulated A4 document area */}
            <div className="p-6 bg-slate-100 dark:bg-slate-950 max-h-[380px] overflow-y-auto custom-scrollbar">
              <div className="bg-white text-black p-8 shadow-md rounded border border-slate-200 text-xs font-serif leading-relaxed max-w-lg mx-auto">
                {/* Letterhead */}
                {identitas.kopSuratUrl ? (
                  <div className="border-b-2 border-black pb-2 mb-4">
                    <img src={identitas.kopSuratUrl} alt="Kop Surat" className="w-full h-auto max-h-[100px] object-contain" />
                  </div>
                ) : (
                  <div className="border-b-2 border-black pb-2 mb-4 text-center font-serif">
                    <h3 className="m-0 text-[10px] font-bold text-center">PEMERINTAH KABUPATEN FAKFAK</h3>
                    <h4 className="m-0 text-[9px] font-bold text-center">DINAS PENDIDIKAN</h4>
                    <h2 className="m-0 text-sm font-bold text-center uppercase">{identitas.namaSekolah}</h2>
                    <p className="m-0 text-[8px] italic text-center">Alamat: {identitas.alamat}</p>
                  </div>
                )}

                <div className="text-right mb-4">
                  {identitas.tempatTandaTangan}, {activeSurat.tanggal}
                </div>

                 {activeSurat.jenisSurat === 'Surat Panggilan Siswa' ? (
                  <div>
                    <p>Nomor: {activeSurat.nomorSurat}<br />Hal: Panggilan Konseli / Siswa</p>
                    <p>Kepada Yth.<br />Orang Tua / Wali dari <b>{activeSurat.namaSiswa}</b></p>
                    <p className="text-justify" style={{ textIndent: '30px' }}>Mengharap kehadiran Bapak/Ibu Wali Murid sekalian pada sesi pertemuan khusus bimbingan konseling guna berkoordinasi membina putra/putri Anda...</p>
                  </div>
                ) : activeSurat.jenisSurat === 'Surat Pernyataan' ? (
                  <div className="text-center mt-4">
                    <h4 className="underline mb-0">SURAT PERNYATAAN SISWA</h4>
                    <span className="text-[10px]">Nomor: {activeSurat.nomorSurat}</span>
                    <p className="text-left mt-4">Saya yang bertanda tangan di bawah ini menerangkan bersedia menjaga komitmen kedisiplinan sekolah...</p>
                  </div>
                ) : (
                  <div className="text-center mt-4">
                    <h4 className="underline mb-0">SURAT KETERANGAN BK</h4>
                    <span className="text-[10px]">Nomor: {activeSurat.nomorSurat}</span>
                    <p className="text-left mt-4">Menyatakan bahwa siswa bersangkutan aktif mengikuti bimbingan konseling...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-2">
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
              >
                Tutup
              </button>
              <button 
                onClick={() => { handlePrintLetter(activeSurat); setIsPreviewModalOpen(false); }}
                className="px-5 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Surat Resmi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
