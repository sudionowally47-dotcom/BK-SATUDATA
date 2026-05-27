import React, { useState } from 'react';
import { 
  Users, BookOpen, AlertTriangle, Calendar as CalendarIcon, 
  TrendingUp, Clock, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Siswa, LayananBK, BukuKasus, JadwalKonseling, IdentitasSekolah } from '../types';

interface DashboardProps {
  siswa: Siswa[];
  layanan: LayananBK[];
  kasus: BukuKasus[];
  jadwal: JadwalKonseling[];
  setCurrentTab: (tab: string) => void;
  identitas: IdentitasSekolah;
}

export const Dashboard: React.FC<DashboardProps> = ({
  siswa,
  layanan,
  kasus,
  jadwal,
  setCurrentTab,
  identitas
}) => {
  // Date State for Calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculations
  const totalSiswa = siswa.length;
  const totalLayanan = layanan.length;
  const totalKasus = kasus.length;
  const totalJadwal = jadwal.length;

  const kasusSelesai = kasus.filter(k => k.status === 'Selesai').length;
  const kasusProses = kasus.filter(k => k.status === 'Dalam Proses').length;
  const kasusRujuk = kasus.filter(k => k.status === 'Dirujuk').length;

  // Layanan BK Categories count
  const layananCount = layanan.reduce((acc, curr) => {
    acc[curr.jenisLayanan] = (acc[curr.jenisLayanan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceCategories = [
    'Klasikal', 'Bimbingan Belajar', 'Bimbingan Pribadi', 
    'Bimbingan Sosial', 'Bimbingan Karier', 
    'Konseling Individual', 'Konseling Kelompok'
  ];

  // Activities Log
  const activities = [
    ...layanan.map(l => ({
      type: 'layanan',
      title: `${l.jenisLayanan} - ${l.namaSiswa}`,
      time: l.createdAt || l.tanggal,
      desc: l.uraian.substring(0, 80) + (l.uraian.length > 80 ? '...' : ''),
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    })),
    ...kasus.map(k => ({
      type: 'kasus',
      title: `Buku Kasus: ${k.jenisKasus} - ${k.namaSiswa}`,
      time: k.createdAt || k.tanggal,
      desc: `Status: ${k.status}. ${k.deskripsiKasus.substring(0, 80)}...`,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
    })),
    ...jadwal.map(j => ({
      type: 'jadwal',
      title: `Jadwal Konseling: ${j.namaSiswa}`,
      time: j.createdAt || j.tanggal,
      desc: `Konseling ${j.tipeKonseling} dengan ${j.namaGuru} pada ${j.tanggal} pukul ${j.waktu}.`,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  // Calendar Helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthsIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Pad first day offset
  const calendarDays = [];
  // For Indonesian style: start with Sunday or Monday. Let's use Sunday (0) to Saturday (6).
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Get schedules for a specific calendar date
  const getSchedulesForDate = (dayNum: number) => {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return jadwal.filter(j => j.tanggal === dateStr);
  };

  // Selected Day Details
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const selectedDaySchedules = selectedDay ? getSchedulesForDate(selectedDay) : [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-violet-800 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-700/10">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <BookOpen className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-600/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            Sistem Informasi BK Satu Data
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-3 tracking-tight">
            Selamat Datang di Portal BK
          </h1>
          <p className="mt-2 text-indigo-100 text-sm md:text-base font-normal leading-relaxed">
            Layanan Bimbingan dan Konseling {identitas.namaSekolah}. Kelola data siswa, jadwal bimbingan, catatan asesmen, kasus siswa, dan cetak administrasi surat dengan mudah.
          </p>
        </div>
      </div>

      {/* KPI Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Total Siswa', value: totalSiswa, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-100 dark:border-indigo-900', tab: 'siswa' },
          { title: 'Layanan BK', value: totalLayanan, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900', tab: 'layanan' },
          { title: 'Kasus Siswa', value: totalKasus, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-100 dark:border-rose-900', tab: 'kasus' },
          { title: 'Jadwal Konseling', value: totalJadwal, icon: CalendarIcon, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900', tab: 'jadwal' },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => setCurrentTab(stat.tab)}
            className={`cursor-pointer group flex items-center justify-between p-6 bg-white dark:bg-slate-900 border ${stat.border} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {stat.title}
              </p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {stat.value}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Service Type Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Statistik Layanan Bimbingan & Konseling
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-400">
                Distribusi total pelayanan berdasarkan kategori BK
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          {/* SVG Bar Chart Container */}
          <div className="space-y-4 py-2">
            {serviceCategories.map((cat) => {
              const val = layananCount[cat] || 0;
              const maxVal = Math.max(...serviceCategories.map(c => layananCount[c] || 0), 1);
              const pct = (val / maxVal) * 100;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-650 dark:text-slate-300">{cat}</span>
                    <span className="text-slate-800 dark:text-indigo-400 font-bold">{val} Layanan</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct || 4}%` }} 
                      className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart representing Case Statuses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Status Penanganan Kasus
            </h2>
            <p className="text-xs text-slate-400">
              Persentase penyelesaian masalah siswa
            </p>
          </div>

          {/* Donut SVG */}
          <div className="flex-1 flex flex-col justify-center items-center">
            {totalKasus === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Belum ada data kasus</p>
              </div>
            ) : (
              <>
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                    
                    {/* Selesai Segments */}
                    {(() => {
                      const selPct = (kasusSelesai / totalKasus) * 100;
                      const prosPct = (kasusProses / totalKasus) * 100;
                      const rujPct = (kasusRujuk / totalKasus) * 100;
                      
                      const selOffset = 0;
                      const prosOffset = selPct;
                      const rujOffset = selPct + prosPct;
                      
                      return (
                        <>
                          {/* Selesai (Emerald) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3.5" 
                            strokeDasharray={`${selPct} ${100 - selPct}`} 
                            strokeDashoffset={-selOffset} 
                          />
                          {/* Dalam Proses (Amber) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.5" 
                            strokeDasharray={`${prosPct} ${100 - prosPct}`} 
                            strokeDashoffset={-prosOffset} 
                          />
                          {/* Dirujuk (Rose) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="3.5" 
                            strokeDasharray={`${rujPct} ${100 - rujPct}`} 
                            strokeDashoffset={-rujOffset} 
                          />
                        </>
                      );
                    })()}
                  </svg>
                  {/* Absolute Center Text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalKasus}</span>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kasus</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="grid grid-cols-3 gap-2 mt-6 w-full text-center">
                  <div className="space-y-0.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">Selesai</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{kasusSelesai}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">Proses</span>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{kasusProses}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">Rujuk</span>
                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{kasusRujuk}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activities & School Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities Log */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Aktivitas Terbaru
            </h2>
          </div>

          <div className="flex-1 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-450 text-sm">
                Belum ada aktivitas tercatat.
              </div>
            ) : (
              activities.map((act, index) => (
                <div key={index} className="flex items-start space-x-3 text-xs border-b border-slate-50 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0">
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wide ${act.badgeColor}`}>
                      {act.type}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-700 dark:text-slate-350">{act.title}</h4>
                    <p className="text-slate-500 dark:text-slate-450 text-[11px] leading-relaxed">{act.desc}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-medium">
                      {new Date(act.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity & Counseling Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Kalender Kegiatan BK
              </h2>
            </div>
            
            {/* Prev/Next Navigation */}
            <div className="flex items-center space-x-2 self-start sm:self-center">
              <button 
                onClick={prevMonth} 
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-550/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-655" />
              </button>
              <span className="text-sm font-bold text-slate-750 dark:text-slate-200 min-w-[120px] text-center">
                {monthsIndo[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button 
                onClick={nextMonth} 
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-550/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-655" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calendar Sheet */}
            <div className="md:col-span-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 pb-2">
                <div>Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div>Sab</div>
              </div>

              {/* Day Numbers Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50" />;
                  }

                  const dateSchedules = getSchedulesForDate(day);
                  const isSelected = selectedDay === day;
                  const hasSchedules = dateSchedules.length > 0;
                  
                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        relative h-10 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all
                        ${isSelected 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                      `}
                    >
                      <span>{day}</span>
                      {hasSchedules && (
                        <span className={`
                          absolute bottom-1 w-1.5 h-1.5 rounded-full
                          ${isSelected ? 'bg-white' : 'bg-indigo-500'}
                        `} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Schedules Detail Column */}
            <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-105 dark:border-slate-800 md:pl-6 pt-4 md:pt-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Jadwal Tanggal {selectedDay} {monthsIndo[currentDate.getMonth()]}
              </h3>

              <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                {selectedDaySchedules.length === 0 ? (
                  <div className="text-center py-6 text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                    <span>Tidak ada jadwal</span>
                  </div>
                ) : (
                  selectedDaySchedules.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/50 dark:border-slate-700 rounded-xl space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                          {item.waktu} WIT
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                          {item.tipeKonseling}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-750 dark:text-slate-200 truncate">
                        {item.namaSiswa} ({item.kelas})
                      </h4>
                      <p className="text-[10px] text-slate-450 truncate">
                        Guru: {item.namaGuru}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`
                          px-1.5 py-0.5 rounded text-[8px] font-bold uppercase
                          ${item.statusKehadiran === 'Hadir' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.statusKehadiran === 'Reschedule' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            item.statusKehadiran === 'Tidak Hadir' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-slate-100 text-slate-750 dark:bg-slate-800'}
                        `}>
                          {item.statusKehadiran}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
