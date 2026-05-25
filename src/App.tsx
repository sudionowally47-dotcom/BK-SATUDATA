import { useState, useEffect } from 'react';
import { 
  Siswa, GuruBK, Kelas, LayananBK, AsesmenSiswa, 
  SuratBK, JadwalKonseling, BukuKasus, HomeVisit, UserSession, IdentitasSekolah
} from './types';
import { DB } from './utils/db';

// Import components
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { DataSiswa } from './components/DataSiswa';
import { CetakKartu } from './components/CetakKartu';
import { DataGuru } from './components/DataGuru';
import { DataKelas } from './components/DataKelas';
import { LayananBKComponent } from './components/LayananBK';
import { AsesmenSiswaComponent } from './components/AsesmenSiswa';
import { SuratBKComponent } from './components/SuratBK';
import { JadwalKonselingComponent } from './components/JadwalKonseling';
import { BukuKasusComponent } from './components/BukuKasus';
import { HomeVisitComponent } from './components/HomeVisit';
import { Laporan } from './components/Laporan';
import { Pengaturan } from './components/Pengaturan';
import { SiswaDashboard } from './components/SiswaDashboard';
import { CatatanAnekdot } from './components/CatatanAnekdot';

// Lucide Toast Icons
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('bk_satudata_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bk_satudata_theme') === 'dark';
  });

  // Active Tab State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Database States
  const [identitas, setIdentitas] = useState(() => DB.getIdentitas());
  const [siswa, setSiswa] = useState<Siswa[]>(() => DB.getSiswa());
  const [guru, setGuru] = useState<GuruBK[]>(() => DB.getGuru());
  const [kelas, setKelas] = useState<Kelas[]>(() => DB.getKelas());
  const [layanan, setLayanan] = useState<LayananBK[]>(() => DB.getLayanan());
  const [asesmen, setAsesmen] = useState<AsesmenSiswa[]>(() => DB.getAsesmen());
  const [surat, setSurat] = useState<SuratBK[]>(() => DB.getSurat());
  const [jadwal, setJadwal] = useState<JadwalKonseling[]>(() => DB.getJadwal());
  const [kasus, setKasus] = useState<BukuKasus[]>(() => DB.getKasus());
  const [visit, setVisit] = useState<HomeVisit[]>(() => DB.getHomeVisit());
  const [gasUrl, setGasUrl] = useState(() => DB.getGasUrl());

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  // Trigger custom toast notification
  const triggerNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check URL query parameters for backup/recovery of GAS Web App URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('gas_url');
    if (urlParam && urlParam.startsWith('https://script.google.com/')) {
      DB.setGasUrl(urlParam);
      setGasUrl(urlParam);
      triggerNotification("URL Google Apps Script dipulihkan dari parameter URL!", "success");
    }
  }, []);

  // Auto-fetch data from Google Sheets backend on startup if URL is present
  useEffect(() => {
    const autoSync = async () => {
      const currentGasUrl = DB.getGasUrl();
      if (currentGasUrl) {
        try {
          const res = await DB.pullAllFromGAS();
          if (res.success) {
            setIdentitas(DB.getIdentitas());
            setSiswa(DB.getSiswa());
            setGuru(DB.getGuru());
            setKelas(DB.getKelas());
            setLayanan(DB.getLayanan());
            setAsesmen(DB.getAsesmen());
            setSurat(DB.getSurat());
            setJadwal(DB.getJadwal());
            setKasus(DB.getKasus());
            setVisit(DB.getHomeVisit());
            console.log("Database Cloud Terhubung & Sinkron!");
          }
        } catch (err) {
          console.warn("Gagal sinkron otomatis:", err);
        }
      }
    };
    autoSync();
  }, [gasUrl]);

  // Apply dark mode theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bk_satudata_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bk_satudata_theme', 'light');
    }
  }, [darkMode]);

  // Login handler
  const handleLoginSuccess = (role: 'admin' | 'siswa', username: string, studentData?: Siswa) => {
    const newSession: UserSession = { username, role, siswaData: studentData };
    setSession(newSession);
    localStorage.setItem('bk_satudata_session', JSON.stringify(newSession));
    
    // Auto-direct student to assessment tools immediately
    if (role === 'siswa') {
      setCurrentTab('asesmen-siswa');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('bk_satudata_session');
    setCurrentTab('dashboard');
    triggerNotification("Anda telah keluar dari aplikasi.", "success");
  };

  // Data update wrappers syncing with state & localStorage
  const handleAddSiswa = (data: Omit<Siswa, 'id'>) => {
    const res = DB.addSiswa(data);
    setSiswa(DB.getSiswa());
    return res;
  };
  const handleUpdateSiswa = (id: string, data: Partial<Siswa>) => {
    const res = DB.updateSiswa(id, data);
    setSiswa(DB.getSiswa());
    // If logged in as student, update current session profile
    if (session?.role === 'siswa' && session.siswaData?.id === id) {
      const updatedSession = { ...session, siswaData: res };
      setSession(updatedSession);
      localStorage.setItem('bk_satudata_session', JSON.stringify(updatedSession));
    }
    return res;
  };
  const handleDeleteSiswa = (id: string) => {
    DB.deleteSiswa(id);
    setSiswa(DB.getSiswa());
  };
  const handleImportSiswa = (list: Omit<Siswa, 'id'>[]) => {
    const count = DB.importSiswa(list);
    setSiswa(DB.getSiswa());
    return count;
  };

  const handleAddGuru = (data: Omit<GuruBK, 'id'>) => {
    const res = DB.addGuru(data);
    setGuru(DB.getGuru());
    return res;
  };
  const handleUpdateGuru = (id: string, data: Partial<GuruBK>) => {
    const res = DB.updateGuru(id, data);
    setGuru(DB.getGuru());
    return res;
  };
  const handleDeleteGuru = (id: string) => {
    DB.deleteGuru(id);
    setGuru(DB.getGuru());
  };

  const handleAddKelas = (data: Omit<Kelas, 'id'>) => {
    const res = DB.addKelas(data);
    setKelas(DB.getKelas());
    return res;
  };
  const handleUpdateKelas = (id: string, data: Partial<Kelas>) => {
    const res = DB.updateKelas(id, data);
    setKelas(DB.getKelas());
    return res;
  };
  const handleDeleteKelas = (id: string) => {
    DB.deleteKelas(id);
    setKelas(DB.getKelas());
  };

  const handleAddLayanan = (data: Omit<LayananBK, 'id'>) => {
    const res = DB.addLayanan(data);
    setLayanan(DB.getLayanan());
    return res;
  };
  const handleUpdateLayanan = (id: string, data: Partial<LayananBK>) => {
    const res = DB.updateLayanan(id, data);
    setLayanan(DB.getLayanan());
    return res;
  };
  const handleDeleteLayanan = (id: string) => {
    DB.deleteLayanan(id);
    setLayanan(DB.getLayanan());
  };

  const handleAddAsesmen = (data: Omit<AsesmenSiswa, 'id'>) => {
    const res = DB.addAsesmen(data);
    setAsesmen(DB.getAsesmen());
    return res;
  };
  const handleUpdateAsesmen = (id: string, data: Partial<AsesmenSiswa>) => {
    const res = DB.updateAsesmen(id, data);
    setAsesmen(DB.getAsesmen());
    return res;
  };
  const handleDeleteAsesmen = (id: string) => {
    DB.deleteAsesmen(id);
    setAsesmen(DB.getAsesmen());
  };

  const handleAddSurat = (data: Omit<SuratBK, 'id'>) => {
    const res = DB.addSurat(data);
    setSurat(DB.getSurat());
    return res;
  };
  const handleDeleteSurat = (id: string) => {
    DB.deleteSurat(id);
    setSurat(DB.getSurat());
  };

  const handleAddJadwal = (data: Omit<JadwalKonseling, 'id'>) => {
    const res = DB.addJadwal(data);
    setJadwal(DB.getJadwal());
    return res;
  };
  const handleUpdateJadwal = (id: string, data: Partial<JadwalKonseling>) => {
    const res = DB.updateJadwal(id, data);
    setJadwal(DB.getJadwal());
    return res;
  };
  const handleDeleteJadwal = (id: string) => {
    DB.deleteJadwal(id);
    setJadwal(DB.getJadwal());
  };

  const handleAddKasus = (data: Omit<BukuKasus, 'id'>) => {
    const res = DB.addKasus(data);
    setKasus(DB.getKasus());
    return res;
  };
  const handleUpdateKasus = (id: string, data: Partial<BukuKasus>) => {
    const res = DB.updateKasus(id, data);
    setKasus(DB.getKasus());
    return res;
  };
  const handleDeleteKasus = (id: string) => {
    DB.deleteKasus(id);
    setKasus(DB.getKasus());
  };

  const handleAddHomeVisit = (data: Omit<HomeVisit, 'id'>) => {
    const res = DB.addHomeVisit(data);
    setVisit(DB.getHomeVisit());
    return res;
  };
  const handleUpdateHomeVisit = (id: string, data: Partial<HomeVisit>) => {
    const res = DB.updateHomeVisit(id, data);
    setVisit(DB.getHomeVisit());
    return res;
  };
  const handleDeleteHomeVisit = (id: string) => {
    DB.deleteHomeVisit(id);
    setVisit(DB.getHomeVisit());
  };

  const handleSaveIdentitas = (data: IdentitasSekolah) => {
    DB.saveIdentitas(data);
    setIdentitas(DB.getIdentitas());
  };

  const handleSaveGasUrl = (url: string) => {
    DB.setGasUrl(url);
    setGasUrl(url);
  };

  const handleResetModule = (moduleKey: string) => {
    DB.resetModule(moduleKey);
    // Refresh states
    setSiswa(DB.getSiswa());
    setGuru(DB.getGuru());
    setKelas(DB.getKelas());
    setLayanan(DB.getLayanan());
    setAsesmen(DB.getAsesmen());
    setSurat(DB.getSurat());
    setJadwal(DB.getJadwal());
    setKasus(DB.getKasus());
    setVisit(DB.getHomeVisit());
  };

  const handleSyncAll = async () => {
    const res = await DB.pullAllFromGAS();
    if (res.success) {
      setIdentitas(DB.getIdentitas());
      setSiswa(DB.getSiswa());
      setGuru(DB.getGuru());
      setKelas(DB.getKelas());
      setLayanan(DB.getLayanan());
      setAsesmen(DB.getAsesmen());
      setSurat(DB.getSurat());
      setJadwal(DB.getJadwal());
      setKasus(DB.getKasus());
      setVisit(DB.getHomeVisit());
    }
    return res;
  };

  // Render content based on current tab and role
  const renderContent = () => {
    if (!session) return null;

    if (session.role === 'siswa') {
      if (!session.siswaData) return null;
      return (
        <SiswaDashboard 
          studentData={session.siswaData}
          layanan={layanan}
          asesmen={asesmen}
          jadwal={jadwal}
          currentTab={currentTab}
          identitas={identitas}
          onUpdateProfil={handleUpdateSiswa}
          onAddAsesmen={handleAddAsesmen}
          triggerNotification={triggerNotification}
        />
      );
    }

    // Admin Tabs mapping
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            siswa={siswa}
            layanan={layanan}
            kasus={kasus}
            jadwal={jadwal}
            setCurrentTab={setCurrentTab}
            identitas={identitas}
          />
        );
      case 'siswa':
        return (
          <DataSiswa 
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddSiswa}
            onUpdate={handleUpdateSiswa}
            onDelete={handleDeleteSiswa}
            onImport={handleImportSiswa}
            triggerNotification={triggerNotification}
          />
        );
      case 'kartu':
        return (
          <CetakKartu 
            siswa={siswa}
            kelas={kelas}
            identitas={identitas}
            triggerNotification={triggerNotification}
          />
        );
      case 'guru':
        return (
          <DataGuru 
            guru={guru}
            identitas={identitas}
            onAdd={handleAddGuru}
            onUpdate={handleUpdateGuru}
            onDelete={handleDeleteGuru}
            triggerNotification={triggerNotification}
          />
        );
      case 'kelas':
        return (
          <DataKelas 
            kelas={kelas}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddKelas}
            onUpdate={handleUpdateKelas}
            onDelete={handleDeleteKelas}
            triggerNotification={triggerNotification}
          />
        );
      case 'layanan':
        return (
          <LayananBKComponent 
            layanan={layanan}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddLayanan}
            onUpdate={handleUpdateLayanan}
            onDelete={handleDeleteLayanan}
            triggerNotification={triggerNotification}
          />
        );
      case 'asesmen':
        return (
          <AsesmenSiswaComponent 
            asesmen={asesmen}
            siswa={siswa}
            guru={guru}
            kelas={kelas}
            identitas={identitas}
            onAdd={handleAddAsesmen}
            onDelete={handleDeleteAsesmen}
            triggerNotification={triggerNotification}
          />
        );
      case 'anekdot':
        return (
          <CatatanAnekdot 
            asesmen={asesmen}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddAsesmen}
            onUpdate={handleUpdateAsesmen}
            onDelete={handleDeleteAsesmen}
            triggerNotification={triggerNotification}
          />
        );
      case 'surat':
        return (
          <SuratBKComponent 
            surat={surat}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddSurat}
            onDelete={handleDeleteSurat}
            triggerNotification={triggerNotification}
          />
        );
      case 'jadwal':
        return (
          <JadwalKonselingComponent 
            jadwal={jadwal}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddJadwal}
            onUpdate={handleUpdateJadwal}
            onDelete={handleDeleteJadwal}
            triggerNotification={triggerNotification}
          />
        );
      case 'kasus':
        return (
          <BukuKasusComponent 
            kasus={kasus}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddKasus}
            onUpdate={handleUpdateKasus}
            onDelete={handleDeleteKasus}
            triggerNotification={triggerNotification}
          />
        );
      case 'homevisit':
        return (
          <HomeVisitComponent 
            visit={visit}
            siswa={siswa}
            guru={guru}
            identitas={identitas}
            onAdd={handleAddHomeVisit}
            onUpdate={handleUpdateHomeVisit}
            onDelete={handleDeleteHomeVisit}
            triggerNotification={triggerNotification}
          />
        );
      case 'laporan':
        return (
          <Laporan 
            siswa={siswa}
            guru={guru}
            kelas={kelas}
            layanan={layanan}
            asesmen={asesmen}
            surat={surat}
            jadwal={jadwal}
            kasus={kasus}
            visit={visit}
            identitas={identitas}
            triggerNotification={triggerNotification}
          />
        );
      case 'pengaturan':
        return (
          <Pengaturan 
            identitas={identitas}
            onSaveIdentitas={handleSaveIdentitas}
            onResetModule={handleResetModule}
            gasUrl={gasUrl}
            onSaveGasUrl={handleSaveGasUrl}
            onSyncAll={handleSyncAll}
            triggerNotification={triggerNotification}
          />
        );
      default:
        return (
          <div className="text-center py-20 text-slate-400">
            Halaman belum tersedia.
          </div>
        );
    }
  };

  // Render Login page if not authenticated
  if (!session) {
    return (
      <>
        <Login 
          siswaList={siswa}
          identitas={identitas}
          onLoginSuccess={handleLoginSuccess}
          triggerNotification={triggerNotification}
        />
        {/* Toast Alert Portal */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-[99] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-650 dark:bg-rose-955/30'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-extrabold text-slate-800 dark:text-slate-105">
                {toast.type === 'success' ? 'Sukses!' : 'Terjadi Kesalahan'}
              </p>
              <p className="text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-205">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </>
    );
  }

  // Authenticated App Scaffold
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        schoolName={identitas.namaSekolah}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto custom-scrollbar md:pb-12 space-y-6">
        
        {/* Offline fallback warning if no Gas URL config */}
        {!gasUrl && session.role === 'admin' && currentTab !== 'pengaturan' && (
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 px-4 py-3 rounded-2xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-250 animate-pulse">
            <span>
              <b>Offline Mode (Penyimpanan Lokal):</b> Data Anda tersimpan di browser saat ini. Hubungkan Google Spreadsheet Anda di menu <b>Pengaturan</b> untuk mengamankan data selamanya.
            </span>
            <button 
              onClick={() => setCurrentTab('pengaturan')}
              className="text-xs font-bold text-indigo-650 hover:underline shrink-0 pl-4"
            >
              Atur Sekarang
            </button>
          </div>
        )}

        {/* Dynamic Inner Page Component */}
        {renderContent()}

      </main>

      {/* Toast Alert Portal */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[99] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-650 dark:bg-rose-955/30'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-slate-800 dark:text-slate-105">
              {toast.type === 'success' ? 'Sukses!' : 'Terjadi Kesalahan'}
            </p>
            <p className="text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
