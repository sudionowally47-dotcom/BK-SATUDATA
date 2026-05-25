export interface IdentitasSekolah {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  tempatTandaTangan: string;
  tanggalDokumen: string;
  logoUrl: string;
  kopSuratUrl: string;
  adminPassword?: string;
}

export interface Siswa {
  id: string; // NISN acts as ID
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jk: 'L' | 'P';
  agama: string;
  orangTua: string;
  alamat: string;
  noHp: string;
  createdAt?: string;
}

export interface GuruBK {
  id: string; // NIP
  nip: string;
  nama: string;
  jk: 'L' | 'P';
  jabatan: string;
  noHp: string;
  email: string;
  createdAt?: string;
}

export interface Kelas {
  id: string; // Nama Kelas
  namaKelas: string;
  tingkat: string; // e.g., VII, VIII, IX
  waliKelas: string;
  createdAt?: string;
}

export type JenisLayanan = 
  | 'Klasikal' 
  | 'Bimbingan Belajar' 
  | 'Bimbingan Pribadi' 
  | 'Bimbingan Sosial' 
  | 'Bimbingan Karier' 
  | 'Konseling Individual' 
  | 'Konseling Kelompok';

export interface AbsensiItem {
  nisn: string;
  namaSiswa: string;
  status: 'Hadir' | 'Alpa' | 'Izin' | 'Sakit';
}

export interface LayananBK {
  id: string;
  tanggal: string;
  jenisLayanan: JenisLayanan;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  topik?: string;
  konselor?: string;
  uraian: string; // Deskripsi
  hasil?: string;
  absensi?: string; // JSON string of AbsensiItem[]
  dokumenUrl?: string;
  dokumenNama?: string;
  createdAt?: string;
}

export type JenisAsesmen = 
  | 'Catatan Anekdot' 
  | 'Daftar Cek Masalah' 
  | 'Tes Gaya Belajar' 
  | 'Tes Minat Bakat';

export interface AsesmenSiswa {
  id: string;
  tanggal: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jenisAsesmen: JenisAsesmen;
  hasil: string; // JSON string or text summary of the results
  detailSkor?: string; // Optional detailed breakdown
  createdAt?: string;
}

export type JenisSurat = 
  | 'Surat Panggilan Siswa' 
  | 'Surat Pernyataan' 
  | 'Surat Keterangan';

export interface SuratBK {
  id: string;
  nomorSurat: string;
  tanggal: string;
  jenisSurat: JenisSurat;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  detail: string; // JSON payload specific to each letter type (e.g. tanggal panggilan, isi pernyataan)
  createdAt?: string;
}

export interface JadwalKonseling {
  id: string;
  tanggal: string;
  waktu: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  nipGuru: string;
  namaGuru: string;
  tipeKonseling: 'Individu' | 'Kelompok' | 'Orang Tua';
  statusKehadiran: 'Menunggu' | 'Hadir' | 'Tidak Hadir' | 'Reschedule';
  keterangan: string;
  createdAt?: string;
}

export interface BukuKasus {
  id: string;
  tanggal: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jenisKasus: string; // e.g. Ringan, Sedang, Berat
  status: 'Dalam Proses' | 'Selesai' | 'Dirujuk';
  deskripsiKasus: string;
  tindakLanjut: string;
  buktiUrl?: string;
  buktiNama?: string;
  createdAt?: string;
}

export interface HomeVisit {
  id: string;
  tanggalKunjungan: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  petugas: string; // NIP or Name of Guru BK
  tujuanKunjungan: string;
  alamat: string;
  temuan: string;
  rekomendasi: string;
  dokumentasiUrl?: string;
  dokumentasiNama?: string;
  createdAt?: string;
}

export interface UserSession {
  username: string;
  role: 'admin' | 'siswa';
  siswaData?: Siswa;
}
