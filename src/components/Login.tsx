import React, { useState } from 'react';
import { BookOpen, Shield, HelpCircle, GraduationCap } from 'lucide-react';
import { Siswa, IdentitasSekolah } from '../types';
import { DB } from '../utils/db';

interface LoginProps {
  siswaList: Siswa[];
  identitas: IdentitasSekolah;
  onLoginSuccess: (role: 'admin' | 'siswa', username: string, studentData?: Siswa) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const Login: React.FC<LoginProps> = ({
  siswaList,
  identitas,
  onLoginSuccess,
  triggerNotification
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [showUrlRestore, setShowUrlRestore] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const isDatabaseConnected = !!DB.getGasUrl();

  const handleRestoreUrl = () => {
    if (!tempUrl.includes('script.google.com')) {
      triggerNotification("URL tidak valid!", "error");
      return;
    }
    DB.setGasUrl(tempUrl);
    triggerNotification("Koneksi database dipulihkan! Halaman akan dimuat ulang.", "success");
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const uTrim = username.trim();
      const pTrim = password.trim();

      // 1. Admin Login Check
      const storedAdminPassword = identitas.adminPassword || 'admin55';
      if (uTrim === 'admin' && pTrim === storedAdminPassword) {
        onLoginSuccess('admin', 'admin');
        triggerNotification("Selamat Datang kembali, Administrator BK!", "success");
        setIsLoading(false);
        return;
      }

      // 2. Student Login Check (Robust comparison)
      const foundStudent = siswaList.find(s => 
        String(s.nisn).trim() === uTrim && 
        String(s.nisn).trim() === pTrim
      );
      
      if (foundStudent) {
        onLoginSuccess('siswa', foundStudent.nisn, foundStudent);
        triggerNotification(`Selamat Datang, ${foundStudent.namaSiswa}!`, "success");
        setIsLoading(false);
        return;
      }

      // 3. Fallback Error
      triggerNotification("Username atau password salah! Periksa kembali kredensial Anda.", "error");
      setIsLoading(false);
    }, 800); // Small timeout to simulate loading state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="w-full max-w-4xl bg-white/5 dark:bg-slate-900/40 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Brand Info Banner */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
            <BookOpen className="w-80 h-80" />
          </div>
          
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-widest uppercase">BK SATU DATA</span>
          </div>

          <div className="my-12 space-y-3 relative z-10">
            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
              {identitas.namaSekolah}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Satu Sistem Untuk Semua Data BK
            </h1>
            <p className="text-xs text-indigo-150 font-normal leading-relaxed">
              Selamat datang di portal Satu Data BK {identitas.namaSekolah}. Akses data konseling, hasil tes mandiri, dan administrasi sekolah kapan saja dan di mana saja.
            </p>
          </div>

          <div className="text-[10px] text-indigo-200 flex items-center gap-1.5 relative z-10">
            <Shield className="w-3.5 h-3.5 text-indigo-300" />
            <span>Koneksi aman terintegrasi dengan Google Spreadsheet</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Masuk Portal
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
              Gunakan akun Administrator atau NISN Siswa Anda
            </p>
          </div>

          {/* Database Connection Status Bar */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${isDatabaseConnected ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50' : 'bg-rose-50/80 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDatabaseConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDatabaseConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {isDatabaseConnected ? 'Database Terhubung (Online)' : 'Database Terputus (Offline)'}
              </span>
            </div>
            {!isDatabaseConnected && (
              <button 
                onClick={() => setShowUrlRestore(!showUrlRestore)}
                className="text-[10px] font-bold text-indigo-650 hover:underline cursor-pointer"
              >
                {showUrlRestore ? 'Tutup' : 'Pulihkan Koneksi'}
              </button>
            )}
          </div>

          {/* URL Restoration Field (Visible if history was cleared) */}
          {showUrlRestore && !isDatabaseConnected && (
            <div className="p-4 bg-indigo-50/50 dark:bg-slate-850 border border-indigo-100 dark:border-slate-800 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] text-slate-500 leading-normal">
                Riwayat browser Anda baru saja dibersihkan. Silakan tempel kembali <b>URL Web App Google Apps Script</b> Anda di bawah ini:
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://script.google.com/..."
                  className="flex-1 px-3 py-2 text-[10px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
                <button 
                  onClick={handleRestoreUrl}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                >
                  Hubungkan
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Username / NISN
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin atau NISN Anda"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Sedang Memeriksa...' : 'Masuk Sekarang'}
            </button>
          </form>

          {/* Quick Help for demo or first logins */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button 
              onClick={() => setShowDemoHelp(!showDemoHelp)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Butuh Bantuan Akses Demo?</span>
            </button>

            {showDemoHelp && (
              <div className="mt-2.5 p-3.5 bg-indigo-50/50 dark:bg-slate-850 border border-indigo-100/50 dark:border-slate-800 rounded-2xl text-[10px] space-y-1.5 text-indigo-900 dark:text-indigo-300 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="font-bold flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  Kredensial Akses Aplikasi:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>Admin:</b> Username: <code className="bg-indigo-100 dark:bg-indigo-950/40 px-1 py-0.5 rounded font-mono font-bold">admin</code> | Sandi: <code className="bg-indigo-100 dark:bg-indigo-950/40 px-1 py-0.5 rounded font-mono font-bold">admin55</code></li>
                  <li><b>Siswa Demo:</b> Gunakan salah satu NISN berikut sebagai Username & Sandi: <code className="bg-indigo-100 dark:bg-indigo-950/40 px-1 py-0.5 rounded font-mono font-bold">0098234121</code> atau <code className="bg-indigo-100 dark:bg-indigo-950/40 px-1 py-0.5 rounded font-mono font-bold">0108765432</code></li>
                </ul>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
