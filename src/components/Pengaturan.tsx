import React, { useState } from 'react';
import { 
  Settings, Building, Trash2, ShieldAlert, Code, 
  Copy, Check, RefreshCw, Globe, Link2, Lock 
} from 'lucide-react';
import { IdentitasSekolah } from '../types';
import { CODE_GS, DOKUMENTASI_SETUP } from '../utils/gasTemplates';

interface PengaturanProps {
  identitas: IdentitasSekolah;
  onSaveIdentitas: (data: IdentitasSekolah) => void;
  onResetModule: (moduleKey: string) => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onSyncAll: () => Promise<{ success: boolean; count: number }>;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const Pengaturan: React.FC<PengaturanProps> = ({
  identitas,
  onSaveIdentitas,
  onResetModule,
  gasUrl,
  onSaveGasUrl,
  onSyncAll,
  triggerNotification
}) => {
  const [activeSection, setActiveSection] = useState<'sekolah' | 'logo' | 'keamanan' | 'api' | 'hapus'>('sekolah');

  // Identitas Form State
  const [schoolForm, setSchoolForm] = useState<IdentitasSekolah>({ ...identitas });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete checklist state
  const [deleteChecklist, setDeleteChecklist] = useState<Record<string, boolean>>({
    siswa: false,
    guru: false,
    kelas: false,
    layanan: false,
    asesmen: false,
    surat: false,
    jadwal: false,
    kasus: false,
    homevisit: false
  });

  // API URL local state
  const [gasUrlInput, setGasUrlInput] = useState(gasUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState({ ...copiedState, [key]: true });
    setTimeout(() => {
      setCopiedState({ ...copiedState, [key]: false });
    }, 2000);
    triggerNotification("Kode berhasil disalin ke clipboard!", "success");
  };

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIdentitas(schoolForm);
    triggerNotification("Identitas sekolah berhasil diperbarui!", "success");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentActual = identitas.adminPassword || 'admin55';
    
    if (passwordForm.oldPassword !== currentActual) {
      triggerNotification("Password lama tidak sesuai!", "error");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerNotification("Konfirmasi password baru tidak cocok!", "error");
      return;
    }

    if (passwordForm.newPassword.length < 5) {
      triggerNotification("Password baru minimal 5 karakter!", "error");
      return;
    }

    onSaveIdentitas({ ...identitas, adminPassword: passwordForm.newPassword });
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    triggerNotification("Password Admin berhasil diperbarui!", "success");
  };

  // Test Apps Script Connection
  const handleTestConnection = async () => {
    if (!gasUrlInput.trim()) {
      triggerNotification("Masukkan URL Apps Script terlebih dahulu!", "error");
      return;
    }
    setIsTesting(true);
    try {
      const pingUrl = `${gasUrlInput}?action=readAll&sheetName=Identitas`;
      const response = await fetch(pingUrl, { method: 'GET', mode: 'cors' });
      const data = await response.json();
      
      if (data && (data.status === 'success' || Array.isArray(data.data))) {
        onSaveGasUrl(gasUrlInput);
        triggerNotification("Koneksi berhasil! URL Google Apps Script tersimpan dan siap digunakan.", "success");
      } else {
        triggerNotification("Koneksi ditolak. Pastikan deployment Apps Script Anda bertipe 'Siapa Saja' (Anyone).", "error");
      }
    } catch (err) {
      // In case of CORS or offline, save it anyway if it looks like a script URL
      if (gasUrlInput.includes('script.google.com/macros')) {
        onSaveGasUrl(gasUrlInput);
        triggerNotification("URL disimpan. Uji koneksi gagal (kemungkinan kebijakan CORS peramban), namun URL tetap dapat digunakan untuk transaksi POST.", "success");
      } else {
        triggerNotification("URL tidak valid. Pastikan itu adalah URL deployment Google Apps Script Web App.", "error");
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Synchronise All sheets from Apps Script
  const handleSyncAll = async () => {
    if (!gasUrl) {
      triggerNotification("URL Apps Script belum terkonfigurasi untuk sinkronisasi cloud!", "error");
      return;
    }
    setIsTesting(true);
    try {
      const res = await onSyncAll();
      if (res.success) {
        triggerNotification(`Sinkronisasi selesai! Berhasil menarik data dari ${res.count} modul Google Sheets.`, "success");
        // Reload to let updates propagate
        setTimeout(() => window.location.reload(), 1500);
      } else {
        triggerNotification("Sinkronisasi gagal. Hubungi administrator/periksa kembali koneksi Apps Script Anda.", "error");
      }
    } catch (e: any) {
      triggerNotification(`Gagal sinkron: ${e.message}`, "error");
    } finally {
      setIsTesting(false);
    }
  };

  // Reset selected modules
  const handleResetData = () => {
    const modulesToReset = Object.entries(deleteChecklist)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    if (modulesToReset.length === 0) {
      triggerNotification("Pilih minimal satu modul untuk dihapus!", "error");
      return;
    }

    if (confirm(`PERINGATAN KERAS! Anda memilih untuk menghapus seluruh data pada ${modulesToReset.length} modul. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?`)) {
      modulesToReset.forEach(modKey => {
        onResetModule(modKey);
      });
      
      // Reset checklist
      const resetCheck: Record<string, boolean> = {};
      Object.keys(deleteChecklist).forEach(k => {
        resetCheck[k] = false;
      });
      setDeleteChecklist(resetCheck);

      triggerNotification("Data modul terpilih berhasil dibersihkan!", "success");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-650" />
            Pengaturan Aplikasi
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Konfigurasi identitas sekolah, logo kop surat, hapus data per modul, serta integrasi Google Apps Script Web App
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Submenu Navigation */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {[
            { id: 'sekolah', label: 'Identitas Sekolah', icon: Building },
            { id: 'logo', label: 'Logo & Kop Surat', icon: Link2 },
            { id: 'keamanan', label: 'Ubah Password', icon: Lock },
            { id: 'api', label: 'API & Apps Script', icon: Globe },
            { id: 'hapus', label: 'Hapus Data Modul', icon: Trash2 }
          ].map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`
                  flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          
          {/* SECTION A: IDENTITAS SEKOLAH */}
          {activeSection === 'sekolah' && (
            <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                Identitas Sekolah (Kop Surat & TTD)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Sekolah*</label>
                  <input 
                    type="text"
                    value={schoolForm.namaSekolah}
                    onChange={(e) => setSchoolForm({...schoolForm, namaSekolah: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">NPSN*</label>
                  <input 
                    type="text"
                    value={schoolForm.npsn}
                    onChange={(e) => setSchoolForm({...schoolForm, npsn: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Alamat Sekolah*</label>
                <input 
                  type="text"
                  value={schoolForm.alamat}
                  onChange={(e) => setSchoolForm({...schoolForm, alamat: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">No. Telepon*</label>
                  <input 
                    type="text"
                    value={schoolForm.telepon}
                    onChange={(e) => setSchoolForm({...schoolForm, telepon: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Email Sekolah*</label>
                  <input 
                    type="email"
                    value={schoolForm.email}
                    onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Nama Kepala Sekolah*</label>
                  <input 
                    type="text"
                    value={schoolForm.kepalaSekolah}
                    onChange={(e) => setSchoolForm({...schoolForm, kepalaSekolah: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">NIP Kepala Sekolah*</label>
                  <input 
                    type="text"
                    value={schoolForm.nipKepalaSekolah}
                    onChange={(e) => setSchoolForm({...schoolForm, nipKepalaSekolah: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Tempat Tanda Tangan*</label>
                  <input 
                    type="text"
                    value={schoolForm.tempatTandaTangan}
                    onChange={(e) => setSchoolForm({...schoolForm, tempatTandaTangan: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: Fakfak"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1.5">Tanggal Dokumen*</label>
                  <input 
                    type="text"
                    value={schoolForm.tanggalDokumen}
                    onChange={(e) => setSchoolForm({...schoolForm, tanggalDokumen: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-55/35 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 25 Februari 2026"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Identitas
                </button>
              </div>
            </form>
          )}

          {/* SECTION B: LOGO & KOP SURAT */}
          {activeSection === 'logo' && (
            <div className="space-y-8">
              {/* Logo Sekolah Section */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                  Logo Sekolah
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider">Pilih atau Masukkan URL Logo</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={schoolForm.logoUrl}
                        onChange={(e) => setSchoolForm({...schoolForm, logoUrl: e.target.value})}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="https://example.com/logo.jpg"
                      />
                      <label className="shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center justify-center">
                        Choose
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSchoolForm({...schoolForm, logoUrl: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">Direkomendasikan gambar PNG transparan berukuran 1:1.</p>
                  </div>

                  {/* Logo Preview */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 min-h-[140px] flex items-center justify-center relative group">
                    <div className="text-center space-y-2">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase mb-2">Pratinjau Logo</span>
                      {schoolForm.logoUrl ? (
                        <img 
                          src={schoolForm.logoUrl} 
                          alt="Preview Logo" 
                          className="w-24 h-24 object-contain mx-auto border rounded-xl p-1 bg-white shadow-sm" 
                          onError={(e)=>{ (e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=60" }}
                        />
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-300 text-[10px]">
                          Belum ada logo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kop Surat Section */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                  Gambar Kop Surat
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider">Pilih atau Masukkan URL Kop Surat</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={schoolForm.kopSuratUrl}
                        onChange={(e) => setSchoolForm({...schoolForm, kopSuratUrl: e.target.value})}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                        placeholder="https://example.com/kop-surat.jpg"
                      />
                      <label className="shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center justify-center">
                        Choose
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSchoolForm({...schoolForm, kopSuratUrl: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">Gambar header kop surat akan muncul di bagian atas surat resmi.</p>
                  </div>

                  {/* Kop Surat Preview */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 min-h-[140px] flex items-center justify-center relative overflow-hidden">
                    <div className="text-center w-full space-y-2">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase mb-2">Pratinjau Kop Surat</span>
                      {schoolForm.kopSuratUrl ? (
                        <div className="w-full h-20 bg-white border rounded-lg overflow-hidden shadow-sm">
                          <img 
                            src={schoolForm.kopSuratUrl} 
                            alt="Preview Kop" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-300 text-[10px]">
                          Belum ada gambar kop
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => { onSaveIdentitas(schoolForm); triggerNotification("Logo & Kop Sekolah berhasil diperbarui!", "success"); }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Semua Gambar
                </button>
              </div>
            </div>
          )}

          {/* SECTION: KEAMANAN (UBAH PASSWORD) */}
          {activeSection === 'keamanan' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                Keamanan Akun Admin
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password Lama*</label>
                  <input 
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password Baru*</label>
                  <input 
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Minimal 5 karakter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru*</label>
                  <input 
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Ulangi password baru"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Perbarui Password
                </button>
              </div>
            </form>
          )}

          {/* SECTION C: GOOGLE APPS SCRIPT WEB APP API SETUP */}
          {activeSection === 'api' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                Koneksi Google Apps Script & Google Spreadsheet
              </h2>

              <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-150/40 dark:border-indigo-900/50 rounded-2xl space-y-2 text-xs leading-relaxed text-indigo-900 dark:text-indigo-305">
                <p className="font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Bagaimana cara kerjanya?
                </p>
                <p>
                  Aplikasi ini menggunakan perpaduan database lokal (Local Storage) agar berjalan kilat di browser, serta <b>Google Apps Script API (Web App URL)</b> sebagai backend awan utama Anda. 
                  Jika Anda menaruh URL Apps Script di bawah, maka data Anda secara permanen tersimpan di file <b>Google Spreadsheet</b> Anda sendiri, aman dari pembersihan riwayat browser.
                </p>
              </div>

              {/* URL Input Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-455 dark:text-slate-405 uppercase tracking-wider mb-1">
                    Google Apps Script Web App URL*
                  </label>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    PERMANENT SYNC ACTIVE
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="url"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200 font-mono"
                  />
                  <button 
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Simpan & Tes Koneksi
                  </button>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    Tips Keamanan Permanen:
                  </p>
                  Untuk memastikan URL ini <b>TIDAK PERNAH HILANG</b> meskipun riwayat browser dihapus total, Anda dapat mengedit file <code>src/utils/db.ts</code> dan mengisi variabel <code>FIXED_GAS_URL</code> dengan URL Anda sebelum melakukan build/push ke GitHub.
                </div>
                
                {gasUrl && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncAll}
                        disabled={isTesting}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                        Tarik Semua Data dari Sheets
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">Tarik data cloud untuk sinkronisasi offline.</span>
                    </div>

                    {/* Bookmark Recovery Link for Wiped Browser History protection */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Tautan Pemulihan Kredensial (Bookmark)*</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Gunakan tautan di bawah ini sebagai bookmark. Jika Anda membersihkan seluruh riwayat peramban atau memori penyimpanan lokal, mengunjungi tautan ini akan otomatis mengembalikan URL Google Sheets Anda.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}${window.location.pathname}?gas_url=${encodeURIComponent(gasUrl)}`}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[10px] text-slate-600"
                        />
                        <button
                          onClick={() => handleCopy(`${window.location.origin}${window.location.pathname}?gas_url=${encodeURIComponent(gasUrl)}`, 'recovery')}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                        >
                          Salin Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Source code tabs */}
              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-805">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-350 block flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-550" />
                  Instruksi & Source Code untuk Google Apps Script
                </span>
                
                {/* Accordion 1: Code.gs */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                    <span>1. File: Code.gs (Backend Logika)</span>
                    <button 
                      onClick={() => handleCopy(CODE_GS, 'code')}
                      className="flex items-center gap-1 text-[11px] text-indigo-650 hover:underline cursor-pointer"
                    >
                      {copiedState['code'] ? <Check className="w-3.5 h-3.5 text-emerald-555" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedState['code'] ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-[160px] custom-scrollbar">
                    {CODE_GS}
                  </pre>
                </div>

                {/* Accordion 2: Setup Documentation */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-955 flex items-center justify-between text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                    <span>3. Dokumentasi Instalasi Lengkap</span>
                    <button 
                      onClick={() => handleCopy(DOKUMENTASI_SETUP, 'doc')}
                      className="flex items-center gap-1 text-[11px] text-indigo-655 hover:underline cursor-pointer"
                    >
                      {copiedState['doc'] ? <Check className="w-3.5 h-3.5 text-emerald-550" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedState['doc'] ? 'Tersalin' : 'Salin Teks'}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 text-xs font-serif leading-relaxed overflow-y-auto max-h-[160px] custom-scrollbar">
                    <pre className="font-sans whitespace-pre-wrap text-[10px]">
                      {DOKUMENTASI_SETUP}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: HAPUS DATA PER MODUL */}
          {activeSection === 'hapus' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-805 dark:text-slate-205 pb-2 border-b border-slate-50 dark:border-slate-805">
                Hapus Data per Modul
              </h2>

              <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-150/40 dark:border-rose-900/40 rounded-2xl space-y-2 text-xs leading-relaxed text-rose-900 dark:text-rose-350">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Peringatan Tindakan Kritis!
                </p>
                <p>
                  Pembersihan modul akan mengosongkan seluruh isi data yang tersimpan di dalam modul terpilih secara permanen. 
                  Jika Anda terhubung dengan Google Spreadsheet, spreadsheet Anda juga akan dibersihkan untuk modul tersebut.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'siswa', label: 'Data Siswa' },
                  { key: 'guru', label: 'Data Guru BK' },
                  { key: 'kelas', label: 'Data Kelas' },
                  { key: 'layanan', label: 'Jurnal Layanan BK' },
                  { key: 'asesmen', label: 'Asesmen Siswa' },
                  { key: 'surat', label: 'Administrasi Surat' },
                  { key: 'jadwal', label: 'Jadwal Konseling' },
                  { key: 'kasus', label: 'Buku Kasus' },
                  { key: 'homevisit', label: 'Laporan Home Visit' }
                ].map(mod => (
                  <label key={mod.key} className="flex items-center gap-2.5 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/45 text-xs font-semibold">
                    <input 
                      type="checkbox"
                      checked={deleteChecklist[mod.key]}
                      onChange={(e) => setDeleteChecklist({ ...deleteChecklist, [mod.key]: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>{mod.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-3">
                <button 
                  onClick={handleResetData}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Kosongkan Modul Terpilih
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
