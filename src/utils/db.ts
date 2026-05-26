import { 
  IdentitasSekolah, Siswa, GuruBK, Kelas, LayananBK, 
  AsesmenSiswa, SuratBK, JadwalKonseling, BukuKasus, HomeVisit 
} from '../types';

const FIXED_GAS_URL = "https://script.google.com/macros/s/AKfycbz5iPV79vJ7efuwJcUqGp97lmUJPPZXe7EmzmB7cuv9ioa68mDlCof5QSf1hOTP77Nr/exec";

/**
 * Format tanggal ke format Indonesia: tanggal bulan tahun (tanpa nama hari)
 * Contoh: 24 Mei 2026
 */
export function formatTanggalIndonesia(date?: Date | string): string {
  const now = date ? new Date(date) : new Date();
  const tanggal = now.getDate();
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
  const tahun = now.getFullYear();
  return `${tanggal} ${bulan} ${tahun}`;
}

/**
 * Format tanggal untuk ditampilkan di tabel (format input date YYYY-MM-DD ke format Indonesia)
 * Contoh: 2026-05-24 -> 24 Mei 2026
 */
export function formatTanggalTabel(dateString: string): string {
  if (!dateString) return '-';
  try {
    return formatTanggalIndonesia(new Date(dateString + 'T00:00:00'));
  } catch {
    return dateString;
  }
}

const DEFAULT_IDENTITAS: IdentitasSekolah = {
  namaSekolah: "SMP NEGERI 4 FAKFAK",
  npsn: "60204123",
  alamat: "Jl. Yos Sudarso No. 45, Wagom, Distrik Fakfak, Kabupaten Fakfak, Papua Barat",
  telepon: "(0956) 22123",
  email: "info@smpn4fakfak.sch.id",
  kepalaSekolah: "H. Abdul Rahman S.Pd., M.Pd.",
  nipKepalaSekolah: "197204181998021004",
  tempatTandaTangan: "Fakfak",
  tanggalDokumen: formatTanggalIndonesia(),
  logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=60",
  kopSuratUrl: "",
  adminPassword: "admin55"
};

const DEFAULT_SISWA: Siswa[] = [
  {
    id: "0098234121",
    nisn: "0098234121",
    namaSiswa: "Ahmad Rifai Uswanas",
    kelas: "IX-A",
    jk: "L",
    agama: "Islam",
    orangTua: "Husein Uswanas",
    alamat: "Jl. Wagom Pantai, Fakfak",
    noHp: "085244556789"
  },
  {
    id: "0108765432",
    nisn: "0108765432",
    namaSiswa: "Dian Safitri Gewab",
    kelas: "VIII-B",
    jk: "P",
    agama: "Islam",
    orangTua: "Musa Gewab",
    alamat: "Sekru, Distrik Fakfak Tengah",
    noHp: "082344778899"
  },
  {
    id: "3101267876",
    nisn: "3101267876",
    namaSiswa: "ABD ARMAN WORETMA",
    kelas: "IX-A",
    jk: "L",
    agama: "Islam",
    orangTua: "Arman Woretma",
    alamat: "Wagom, Fakfak",
    noHp: "085244556789"
  }
];

const DEFAULT_GURU: GuruBK[] = [
  { id: "198506122010012005", nip: "198506122010012005", nama: "Marlina Gewab, S.Psi.", jk: "P", jabatan: "Koordinator BK", noHp: "081234567890", email: "marlina.gewab@gmail.com" }
];

const DEFAULT_KELAS: Kelas[] = [
  { id: "VII-A", namaKelas: "VII-A", tingkat: "VII", waliKelas: "Martha Heremba, S.Pd." },
  { id: "VIII-B", namaKelas: "VIII-B", tingkat: "VIII", waliKelas: "Rina Tanggarofa, S.Pd." },
  { id: "IX-A", namaKelas: "IX-A", tingkat: "IX", waliKelas: "Wa Ode Nurhayati, S.Pd." }
];

function getStoredData<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(`bk_satudata_${key}`);
  if (!stored) {
    localStorage.setItem(`bk_satudata_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    return defaultValue;
  }
}

function setStoredData<T>(key: string, data: T) {
  localStorage.setItem(`bk_satudata_${key}`, JSON.stringify(data));
}

export const DB = {
  getGasUrl(): string {
    const stored = localStorage.getItem('bk_satudata_gas_url');
    return stored || FIXED_GAS_URL;
  },

  setGasUrl(url: string) {
    localStorage.setItem('bk_satudata_gas_url', url);
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist();
    }
  },

  async requestGAS(action: string, payload: any = {}): Promise<any> {
    const url = this.getGasUrl();
    if (!url) return null;

    try {
      if (action === 'readAll' || action === 'getIdentitas') {
        const fullUrl = `${url}?action=${action}${payload.sheetName ? `&sheetName=${payload.sheetName}` : ''}`;
        const res = await fetch(fullUrl, { method: 'GET', mode: 'cors' });
        const json = await res.json();
        if (json.status === 'success') return json.data;
        throw new Error(json.message);
      } else {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action, ...payload })
        });
        return true;
      }
    } catch (error) {
      console.error("GAS API Error:", error);
      throw error;
    }
  },

  getIdentitas(): IdentitasSekolah {
    const data = getStoredData<IdentitasSekolah>('identitas', DEFAULT_IDENTITAS);
    if (data.tanggalDokumen && typeof data.tanggalDokumen === 'string' && data.tanggalDokumen.includes('T')) {
      data.tanggalDokumen = formatTanggalIndonesia(data.tanggalDokumen);
    }
    return data;
  },

  saveIdentitas(data: IdentitasSekolah): void {
    const processedData = {
      ...data,
      tanggalDokumen: typeof data.tanggalDokumen === 'string' && data.tanggalDokumen.includes('T')
        ? formatTanggalIndonesia(data.tanggalDokumen)
        : data.tanggalDokumen
    };
    setStoredData('identitas', processedData);
    this.requestGAS('saveIdentitas', { data: processedData }).catch(() => {});
  },

  getSiswa(): Siswa[] {
    return getStoredData<Siswa[]>('siswa', DEFAULT_SISWA);
  },

  addSiswa(siswa: Omit<Siswa, 'id'>): Siswa {
    const list = this.getSiswa();
    if (list.some(s => s.nisn === siswa.nisn)) throw new Error(`NISN ${siswa.nisn} terdaftar!`);
    const newItem: Siswa = { ...siswa, id: siswa.nisn, createdAt: new Date().toISOString() };
    list.push(newItem);
    setStoredData('siswa', list);
    this.requestGAS('create', { sheetName: 'Siswa', data: newItem }).catch(() => {});
    return newItem;
  },

  updateSiswa(id: string, data: Partial<Siswa>): Siswa {
    const list = this.getSiswa();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Tidak ditemukan");
    const updated = { ...list[index], ...data, id: data.nisn || list[index].id };
    list[index] = updated;
    setStoredData('siswa', list);
    this.requestGAS('update', { sheetName: 'Siswa', id, data: updated }).catch(() => {});
    return updated;
  },

  deleteSiswa(id: string): void {
    const list = this.getSiswa();
    setStoredData('siswa', list.filter(s => s.id !== id));
    this.requestGAS('delete', { sheetName: 'Siswa', id }).catch(() => {});
  },

  importSiswa(siswaList: Omit<Siswa, 'id'>[]): number {
    const list = this.getSiswa();
    const existing = new Set(list.map(s => s.nisn));
    let imported = 0;
    siswaList.forEach(s => {
      if (!existing.has(s.nisn)) {
        list.push({ ...s, id: s.nisn, createdAt: new Date().toISOString() });
        imported++;
      }
    });
    if (imported > 0) {
      setStoredData('siswa', list);
      this.requestGAS('importSiswa', { data: siswaList }).catch(() => {});
    }
    return imported;
  },

  getGuru(): GuruBK[] { return getStoredData<GuruBK[]>('guru', DEFAULT_GURU); },
  addGuru(guru: Omit<GuruBK, 'id'>): GuruBK {
    const list = this.getGuru();
    const item = { ...guru, id: guru.nip, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('guru', list);
    this.requestGAS('create', { sheetName: 'GuruBK', data: item }).catch(() => {});
    return item;
  },
  updateGuru(id: string, data: Partial<GuruBK>) {
    const list = this.getGuru();
    const idx = list.findIndex(g => g.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('guru', list);
    this.requestGAS('update', { sheetName: 'GuruBK', id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteGuru(id: string) {
    setStoredData('guru', this.getGuru().filter(g => g.id !== id));
    this.requestGAS('delete', { sheetName: 'GuruBK', id }).catch(() => {});
  },

  getKelas(): Kelas[] { return getStoredData<Kelas[]>('kelas', DEFAULT_KELAS); },
  addKelas(kelas: Omit<Kelas, 'id'>) {
    const list = this.getKelas();
    const item = { ...kelas, id: kelas.namaKelas, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('kelas', list);
    this.requestGAS('create', { sheetName: 'Kelas', data: item }).catch(() => {});
    return item;
  },
  updateKelas(id: string, data: Partial<Kelas>) {
    const list = this.getKelas();
    const idx = list.findIndex(k => k.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('kelas', list);
    this.requestGAS('update', { sheetName: 'Kelas', id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteKelas(id: string) {
    setStoredData('kelas', this.getKelas().filter(k => k.id !== id));
    this.requestGAS('delete', { sheetName: 'Kelas', id }).catch(() => {});
  },

  getLayanan(): LayananBK[] { return getStoredData<LayananBK[]>('layanan', []); },
  addLayanan(l: Omit<LayananBK, 'id'>) {
    const list = this.getLayanan();
    const item = { ...l, id: `L-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('layanan', list);
    const sheetName = `Layanan_${l.jenisLayanan.replace(/\s+/g, '_')}`;
    this.requestGAS('create', { sheetName, data: item }).catch(() => {});
    return item;
  },
  updateLayanan(id: string, data: Partial<LayananBK>) {
    const list = this.getLayanan();
    const idx = list.findIndex(x => x.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('layanan', list);
    const sheetName = `Layanan_${list[idx].jenisLayanan.replace(/\s+/g, '_')}`;
    this.requestGAS('update', { sheetName, id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteLayanan(id: string) {
    const list = this.getLayanan();
    const item = list.find(x => x.id === id);
    if (!item) return;
    setStoredData('layanan', list.filter(x => x.id !== id));
    const sheetName = `Layanan_${item.jenisLayanan.replace(/\s+/g, '_')}`;
    this.requestGAS('delete', { sheetName, id }).catch(() => {});
  },

  getAsesmen(): AsesmenSiswa[] { return getStoredData<AsesmenSiswa[]>('asesmen', []); },
  addAsesmen(a: Omit<AsesmenSiswa, 'id'>) {
    const list = this.getAsesmen();
    const item = { ...a, id: `A-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('asesmen', list);
    const sheetName = `Asesmen_${a.jenisAsesmen.replace(/\s+/g, '_')}`;
    this.requestGAS('create', { sheetName, data: item }).catch(() => {});
    return item;
  },
  updateAsesmen(id: string, data: Partial<AsesmenSiswa>): AsesmenSiswa {
    const list = this.getAsesmen();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Asesmen tidak ditemukan!");
    const updated = { ...list[index], ...data };
    list[index] = updated;
    setStoredData('asesmen', list);
    const sheetName = `Asesmen_${updated.jenisAsesmen.replace(/\s+/g, '_')}`;
    this.requestGAS('update', { sheetName, id, data: updated }).catch(() => {});
    return updated;
  },
  deleteAsesmen(id: string) {
    const list = this.getAsesmen();
    const item = list.find(x => x.id === id);
    if (!item) return;
    setStoredData('asesmen', list.filter(x => x.id !== id));
    const sheetName = `Asesmen_${item.jenisAsesmen.replace(/\s+/g, '_')}`;
    this.requestGAS('delete', { sheetName, id }).catch(() => {});
  },

  getSurat(): SuratBK[] { return getStoredData<SuratBK[]>('surat', []); },
  addSurat(s: Omit<SuratBK, 'id'>) {
    const list = this.getSurat();
    const item = { ...s, id: `S-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('surat', list);
    const sheetMap: Record<string, string> = { 'Surat Panggilan Siswa': 'Surat_Panggilan', 'Surat Pernyataan': 'Surat_Pernyataan', 'Surat Keterangan': 'Surat_Keterangan' };
    this.requestGAS('create', { sheetName: sheetMap[s.jenisSurat] || 'Surat_Lainnya', data: item }).catch(() => {});
    return item;
  },
  deleteSurat(id: string) {
    const list = this.getSurat();
    const item = list.find(x => x.id === id);
    if (!item) return;
    setStoredData('surat', list.filter(x => x.id !== id));
    const sheetMap: Record<string, string> = { 'Surat Panggilan Siswa': 'Surat_Panggilan', 'Surat Pernyataan': 'Surat_Pernyataan', 'Surat Keterangan': 'Surat_Keterangan' };
    this.requestGAS('delete', { sheetName: sheetMap[item.jenisSurat] || 'Surat_Lainnya', id }).catch(() => {});
  },

  getJadwal(): JadwalKonseling[] { return getStoredData<JadwalKonseling[]>('jadwal', []); },
  addJadwal(j: Omit<JadwalKonseling, 'id'>) {
    const list = this.getJadwal();
    const item = { ...j, id: `J-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('jadwal', list);
    this.requestGAS('create', { sheetName: 'Jadwal_Konseling', data: item }).catch(() => {});
    return item;
  },
  updateJadwal(id: string, data: Partial<JadwalKonseling>) {
    const list = this.getJadwal();
    const idx = list.findIndex(x => x.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('jadwal', list);
    this.requestGAS('update', { sheetName: 'Jadwal_Konseling', id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteJadwal(id: string) {
    setStoredData('jadwal', this.getJadwal().filter(x => x.id !== id));
    this.requestGAS('delete', { sheetName: 'Jadwal_Konseling', id }).catch(() => {});
  },

  getKasus(): BukuKasus[] { return getStoredData<BukuKasus[]>('kasus', []); },
  addKasus(k: Omit<BukuKasus, 'id'>) {
    const list = this.getKasus();
    const item = { ...k, id: `K-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('kasus', list);
    this.requestGAS('create', { sheetName: 'Buku_Kasus', data: item }).catch(() => {});
    return item;
  },
  updateKasus(id: string, data: Partial<BukuKasus>) {
    const list = this.getKasus();
    const idx = list.findIndex(x => x.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('kasus', list);
    this.requestGAS('update', { sheetName: 'Buku_Kasus', id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteKasus(id: string) {
    setStoredData('kasus', this.getKasus().filter(x => x.id !== id));
    this.requestGAS('delete', { sheetName: 'Buku_Kasus', id }).catch(() => {});
  },

  getHomeVisit(): HomeVisit[] { return getStoredData<HomeVisit[]>('homevisit', []); },
  addHomeVisit(v: Omit<HomeVisit, 'id'>) {
    const list = this.getHomeVisit();
    const item = { ...v, id: `H-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(item);
    setStoredData('homevisit', list);
    this.requestGAS('create', { sheetName: 'Home_Visit', data: item }).catch(() => {});
    return item;
  },
  updateHomeVisit(id: string, data: Partial<HomeVisit>) {
    const list = this.getHomeVisit();
    const idx = list.findIndex(x => x.id === id);
    list[idx] = { ...list[idx], ...data };
    setStoredData('homevisit', list);
    this.requestGAS('update', { sheetName: 'Home_Visit', id, data: list[idx] }).catch(() => {});
    return list[idx];
  },
  deleteHomeVisit(id: string) {
    setStoredData('homevisit', this.getHomeVisit().filter(x => x.id !== id));
    this.requestGAS('delete', { sheetName: 'Home_Visit', id }).catch(() => {});
  },

  resetModule(moduleKey: string) {
    setStoredData(moduleKey, []);
    const sheetsMap: Record<string, string[]> = {
      siswa: ['Siswa'],
      guru: ['GuruBK'],
      kelas: ['Kelas'],
      layanan: ['Layanan_Klasikal', 'Layanan_Bimbingan_Belajar', 'Layanan_Bimbingan_Pribadi', 'Layanan_Bimbingan_Sosial', 'Layanan_Bimbingan_Karier', 'Layanan_Konseling_Individual', 'Layanan_Konseling_Kelompok'],
      asesmen: ['Asesmen_Catatan_Anekdot', 'Asesmen_Daftar_Cek_Masalah', 'Asesmen_Tes_Gaya_Belajar', 'Asesmen_Tes_Minat_Bakat'],
      surat: ['Surat_Panggilan', 'Surat_Pernyataan', 'Surat_Keterangan'],
      jadwal: ['Jadwal_Konseling'],
      kasus: ['Buku_Kasus'],
      homevisit: ['Home_Visit']
    };
    (sheetsMap[moduleKey] || []).forEach(name => this.requestGAS('resetModule', { moduleName: name }).catch(() => {}));
  },

  async pullAllFromGAS(): Promise<{ success: boolean; count: number }> {
    let successCount = 0;
    try {
      const idData = await this.requestGAS('getIdentitas');
      if (idData) {
        const current = this.getIdentitas();
        setStoredData('identitas', { ...current, ...idData });
      }
    } catch (e) {}

    const base = [
      { key: 'siswa', s: 'Siswa' },
      { key: 'guru', s: 'GuruBK' },
      { key: 'kelas', s: 'Kelas' },
      { key: 'jadwal', s: 'Jadwal_Konseling' },
      { key: 'kasus', s: 'Buku_Kasus' },
      { key: 'homevisit', s: 'Home_Visit' }
    ];
    for (const m of base) {
      try {
        const d = await this.requestGAS('readAll', { sheetName: m.s });
        if (Array.isArray(d)) { setStoredData(m.key, d); successCount++; }
      } catch (e) {}
    }

    const groups = [
      {
        key: 'layanan',
        sheets: ['Layanan_Klasikal', 'Layanan_Bimbingan_Belajar', 'Layanan_Bimbingan_Pribadi', 'Layanan_Bimbingan_Sosial', 'Layanan_Bimbingan_Karier', 'Layanan_Konseling_Individual', 'Layanan_Konseling_Kelompok']
      },
      {
        key: 'asesmen',
        sheets: ['Asesmen_Catatan_Anekdot', 'Asesmen_Daftar_Cek_Masalah', 'Asesmen_Tes_Gaya_Belajar', 'Asesmen_Tes_Minat_Bakat']
      },
      {
        key: 'surat',
        sheets: ['Surat_Panggilan', 'Surat_Pernyataan', 'Surat_Keterangan']
      }
    ];
    for (const g of groups) {
      let combined: any[] = [];
      for (const s of g.sheets) {
        try {
          const d = await this.requestGAS('readAll', { sheetName: s });
          if (Array.isArray(d)) {
            const enriched = d.map(item => {
              const res = { ...item };
              if (s.startsWith('Layanan_')) res.jenisLayanan = s.replace('Layanan_', '').replace(/_/g, ' ');
              if (s.startsWith('Asesmen_')) res.jenisAsesmen = s.replace('Asesmen_', '').replace(/_/g, ' ');
              if (s.startsWith('Surat_')) res.jenisSurat = s === 'Surat_Panggilan' ? 'Surat Panggilan Siswa' : s.replace('_', ' ');
              return res;
            });
            combined = [...combined, ...enriched];
          }
        } catch (e) {}
      }
      setStoredData(g.key, combined);
      if (combined.length > 0) successCount++;
    }
    return { success: successCount > 0, count: successCount };
  }
};
