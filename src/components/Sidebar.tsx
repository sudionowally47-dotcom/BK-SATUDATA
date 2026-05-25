import React from 'react';
import { 
  LayoutDashboard, Users, CreditCard, GraduationCap, School, 
  BookOpen, FileCheck, FileText, Calendar, AlertTriangle, 
  Home, BarChart3, Settings, LogOut, Sun, Moon, Menu, X, Clipboard
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession | null;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  schoolName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onLogout,
  darkMode,
  setDarkMode,
  schoolName
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const adminMenu = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'siswa', name: 'Data Siswa', icon: Users },
    { id: 'kartu', name: 'Cetak Kartu Login', icon: CreditCard },
    { id: 'guru', name: 'Data Guru BK', icon: GraduationCap },
    { id: 'kelas', name: 'Data Kelas', icon: School },
    { id: 'layanan', name: 'Layanan BK', icon: BookOpen },
    { id: 'asesmen', name: 'Asesmen Siswa', icon: FileCheck },
    { id: 'anekdot', name: 'Catatan Anekdot', icon: Clipboard },
    { id: 'surat', name: 'Administrasi Surat', icon: FileText },
    { id: 'jadwal', name: 'Jadwal Konseling', icon: Calendar },
    { id: 'kasus', name: 'Buku Kasus', icon: AlertTriangle },
    { id: 'homevisit', name: 'Home Visit', icon: Home },
    { id: 'laporan', name: 'Laporan Rekap', icon: BarChart3 },
    { id: 'pengaturan', name: 'Pengaturan', icon: Settings },
  ];

  const siswaMenu = [
    { id: 'dashboard', name: 'Dashboard Siswa', icon: LayoutDashboard },
    { id: 'profil-siswa', name: 'Biodata Saya', icon: Users },
    { id: 'layanan-siswa', name: 'Riwayat Layanan', icon: BookOpen },
    { id: 'asesmen-siswa', name: 'Asesmen Mandiri', icon: FileCheck },
    { id: 'jadwal-siswa', name: 'Jadwal Saya', icon: Calendar },
  ];

  const menuItems = session?.role === 'admin' ? adminMenu : siswaMenu;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between p-4 bg-indigo-900 dark:bg-slate-900 text-white shadow-md">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-sm tracking-wide uppercase">BK SATU DATA</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1.5 rounded-lg hover:bg-indigo-800 dark:hover:bg-slate-800 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform bg-indigo-950 dark:bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-indigo-900/50 dark:border-slate-800/80
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header / Brand */}
        <div className="p-6 border-b border-indigo-900 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-tight">BK SATU DATA</h1>
              <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase mt-0.5 max-w-[150px] truncate">
                {schoolName}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-indigo-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Session Info */}
        <div className="px-6 py-4 border-b border-indigo-900/50 dark:border-slate-850 bg-indigo-950/60 dark:bg-slate-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 dark:bg-slate-700/50 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-lg shadow-inner">
              {session?.role === 'admin' ? 'A' : (session?.siswaData?.namaSiswa?.charAt(0) || 'S')}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold truncate">
                {session?.role === 'admin' ? 'Administrator' : (session?.siswaData?.namaSiswa || 'Siswa')}
              </h2>
              <span className="text-[11px] text-indigo-400 font-medium bg-indigo-900/50 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {session?.role === 'admin' ? 'Admin BK' : `NISN: ${session?.username}`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-900/40 dark:hover:bg-slate-800/40'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Settings & Logout */}
        <div className="p-4 border-t border-indigo-900 dark:border-slate-800 space-y-2 bg-indigo-950/40 dark:bg-slate-950/10">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-900/30 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center space-x-2">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-indigo-500' : 'bg-indigo-900'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
    </>
  );
};
