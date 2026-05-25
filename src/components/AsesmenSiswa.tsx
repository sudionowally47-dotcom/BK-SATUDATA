import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Trash2, Download, Printer, 
  ArrowLeft, ArrowRight, FileCheck, CheckCircle2, Award, Clipboard,
  BarChart3, PieChart, User as UserIcon, Users as UsersIcon, LayoutGrid, TrendingUp
} from 'lucide-react';
import { AsesmenSiswa, Siswa, JenisAsesmen, IdentitasSekolah, Kelas, GuruBK } from '../types';

interface AsesmenSiswaProps {
  asesmen: AsesmenSiswa[];
  siswa: Siswa[];
  guru: GuruBK[];
  kelas: Kelas[];
  identitas: IdentitasSekolah;
  onAdd: (asesmen: Omit<AsesmenSiswa, 'id'>) => void;
  onDelete: (id: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

const DCM_COMPONENTS = [
  { code: 'A', title: 'KESEHATAN', questions: ['Saya sering sakit kepala.', 'Saya sering merasa pusing.', 'Saya sering merasa cepat lelah.', 'Saya sulit tidur pada malam hari.', 'Saya kurang nafsu makan.', 'Saya sering sakit perut.', 'Penglihatan saya sering terganggu.', 'Pendengaran saya sering terganggu.', 'Saya mempunyai penyakit yang sering kambuh.', 'Saya mudah merasa cemas tentang kesehatan.', 'Saya jarang berolahraga.', 'Saya sering terlambat makan.', 'Saya merasa berat badan saya bermasalah.', 'Saya sering mengantuk saat belajar.', 'Saya kurang menjaga kebersihan diri.', 'Saya sering merasa tidak bugar di sekolah.', 'Saya memiliki alergi yang mengganggu kegiatan.', 'Saya takut memeriksakan diri ke tenaga kesehatan.', 'Saya sering tidak masuk sekolah karena sakit.', 'Saya membutuhkan bantuan untuk menjaga pola hidup sehat.'] },
  { code: 'B', title: 'KEADAAN KEHIDUPAN EKONOMI', questions: ['Saya sering khawatir tentang biaya sekolah.', 'Saya sering kekurangan uang saku.', 'Saya sulit membeli perlengkapan sekolah.', 'Saya sering membantu orang tua mencari uang.', 'Saya merasa keadaan ekonomi keluarga mengganggu belajar.', 'Saya tidak mempunyai tempat belajar yang memadai.', 'Saya sering menunda tugas karena tidak ada alat tulis.', 'Saya malu dengan keadaan ekonomi keluarga.', 'Saya sulit mengikuti kegiatan sekolah karena biaya.', 'Saya sering meminjam barang sekolah dari teman.', 'Saya ingin membantu ekonomi keluarga tetapi bingung caranya.', 'Saya merasa kebutuhan belajar belum terpenuhi.', 'Saya sering tidak membawa bekal atau uang makan.', 'Saya sulit mengakses internet untuk belajar.', 'Saya sering cemas jika ada iuran sekolah.', 'Saya pernah tidak ikut kegiatan karena tidak mampu membayar.', 'Saya merasa iri dengan fasilitas teman.', 'Saya membutuhkan beasiswa atau bantuan belajar.', 'Saya belum bisa mengatur uang saku.', 'Saya ingin berkonsultasi tentang masalah ekonomi keluarga.'] },
  { code: 'C', title: 'REKREASI', questions: ['Saya jarang memiliki waktu untuk beristirahat.', 'Saya tidak memiliki kegiatan hiburan yang sehat.', 'Saya sering merasa bosan di rumah.', 'Saya menghabiskan waktu luang terlalu lama dengan gawai.', 'Saya tidak tahu cara mengisi waktu luang dengan baik.', 'Saya jarang mengikuti kegiatan olahraga atau seni.', 'Saya merasa hiburan saya mengganggu waktu belajar.', 'Saya sering bermain sampai lupa waktu.', 'Saya tidak memiliki teman untuk kegiatan positif.', 'Saya sulit membatasi permainan online.', 'Saya merasa kurang mendapat kesempatan rekreasi keluarga.', 'Saya sering merasa jenuh dengan rutinitas sekolah.', 'Saya belum memiliki hobi yang bermanfaat.', 'Saya sering menggunakan waktu libur tanpa rencana.', 'Saya merasa kegiatan rekreasi saya tidak produktif.', 'Saya ingin mengikuti kegiatan ekstrakurikuler tetapi ragu.', 'Saya sulit menyeimbangkan belajar dan hiburan.', 'Saya sering mencari hiburan yang kurang sehat.', 'Saya merasa kurang bahagia saat waktu luang.', 'Saya membutuhkan saran kegiatan rekreasi positif.'] },
  { code: 'D', title: 'KEHIDUPAN SOSIAL KEAKTIFAN BERORGANISASI', questions: ['Saya sulit bergaul dengan teman baru.', 'Saya jarang mengikuti kegiatan organisasi sekolah.', 'Saya kurang percaya diri berbicara di depan kelompok.', 'Saya sering merasa tidak diterima teman.', 'Saya sulit bekerja sama dalam kelompok.', 'Saya kurang aktif dalam kegiatan kelas.', 'Saya takut menyampaikan pendapat.', 'Saya pernah merasa dikucilkan teman.', 'Saya sulit menjadi pengurus atau pemimpin kelompok.', 'Saya kurang peduli terhadap kegiatan sekolah.', 'Saya sering menolak ajakan kegiatan positif.', 'Saya bingung memilih ekstrakurikuler yang sesuai.', 'Saya merasa tidak punya teman dekat di sekolah.', 'Saya sulit menyesuaikan diri dalam kelompok baru.', 'Saya pernah mengalami konflik dalam organisasi.', 'Saya kurang bertanggung jawab dalam tugas kelompok.', 'Saya malu mengikuti lomba atau kegiatan sekolah.', 'Saya sulit membagi waktu antara organisasi dan belajar.', 'Saya merasa kemampuan sosial saya perlu ditingkatkan.', 'Saya ingin dibantu menjadi lebih aktif berorganisasi.'] },
  { code: 'E', title: 'HUBUNGAN PRIBADI', questions: ['Saya kurang percaya diri terhadap diri sendiri.', 'Saya mudah tersinggung.', 'Saya sulit mengendalikan emosi.', 'Saya sering merasa minder.', 'Saya merasa tidak mempunyai kelebihan.', 'Saya sulit mengambil keputusan sendiri.', 'Saya sering menyimpan masalah sendiri.', 'Saya mudah marah kepada orang lain.', 'Saya sulit meminta maaf.', 'Saya sering merasa kesepian.', 'Saya takut gagal sebelum mencoba.', 'Saya mudah putus asa.', 'Saya sulit menerima kritik.', 'Saya sering membandingkan diri dengan orang lain.', 'Saya merasa belum mengenal diri sendiri.', 'Saya sering cemas tanpa sebab jelas.', 'Saya sulit mengatakan tidak pada ajakan teman.', 'Saya kurang disiplin terhadap janji pribadi.', 'Saya ingin meningkatkan rasa percaya diri.', 'Saya membutuhkan tempat curhat yang aman.'] },
  { code: 'F', title: 'MUDA-MUDI', questions: ['Saya mulai tertarik pada lawan jenis dan bingung menyikapinya.', 'Saya pernah merasa terganggu karena urusan pacaran.', 'Saya sulit membatasi komunikasi dengan lawan jenis.', 'Saya merasa hubungan pertemanan lawan jenis mengganggu belajar.', 'Saya takut ditolak oleh teman yang saya sukai.', 'Saya cemburu berlebihan kepada teman dekat.', 'Saya pernah bertengkar karena masalah hubungan muda-mudi.', 'Saya bingung menjaga batas pergaulan yang sehat.', 'Saya pernah mendapat tekanan untuk berpacaran.', 'Saya merasa malu membicarakan perkembangan remaja.', 'Saya kurang memahami perubahan fisik masa remaja.', 'Saya kurang memahami etika pergaulan lawan jenis.', 'Saya pernah menerima pesan yang membuat tidak nyaman.', 'Saya sulit menolak ajakan yang tidak sesuai nilai saya.', 'Saya ingin tahu cara menjaga diri dalam pergaulan.', 'Saya pernah menjadi bahan ejekan terkait hubungan muda-mudi.', 'Saya takut mengecewakan teman dekat.', 'Saya ingin belajar membangun hubungan yang sehat.', 'Saya merasa butuh bimbingan tentang masa pubertas.', 'Saya ingin berkonsultasi tentang pergaulan remaja.'] },
  { code: 'G', title: 'KEHIDUPAN KELUARGA', questions: ['Saya kurang dekat dengan orang tua.', 'Saya sering bertengkar dengan saudara.', 'Saya merasa kurang diperhatikan keluarga.', 'Saya takut bercerita kepada orang tua.', 'Saya sering merasa suasana rumah tidak nyaman.', 'Saya merasa terlalu banyak tuntutan dari keluarga.', 'Saya kurang mendapat dukungan belajar di rumah.', 'Saya sering dimarahi tanpa diberi penjelasan.', 'Saya merasa keluarga kurang memahami saya.', 'Saya sering menyembunyikan masalah dari keluarga.', 'Saya sulit membagi waktu membantu keluarga dan belajar.', 'Saya merasa aturan rumah terlalu ketat.', 'Saya merasa kurang bebas menyampaikan pendapat di rumah.', 'Saya pernah melihat konflik serius di rumah.', 'Saya tinggal jauh dari salah satu orang tua.', 'Saya merasa sedih karena kondisi keluarga.', 'Saya ingin hubungan keluarga lebih harmonis.', 'Saya kurang mendapat tempat belajar yang tenang di rumah.', 'Saya merasa tanggung jawab rumah mengganggu sekolah.', 'Saya membutuhkan bantuan terkait masalah keluarga.'] },
  { code: 'H', title: 'AGAMA DAN MORAL', questions: ['Saya jarang beribadah sesuai agama saya.', 'Saya kurang memahami ajaran agama saya.', 'Saya sering melanggar aturan meskipun tahu salah.', 'Saya mudah terpengaruh ajakan negatif teman.', 'Saya pernah berbohong kepada orang tua atau guru.', 'Saya sulit membedakan pergaulan baik dan buruk.', 'Saya kurang menghormati orang yang lebih tua.', 'Saya merasa nilai moral saya perlu diperbaiki.', 'Saya pernah mengambil barang tanpa izin.', 'Saya sering berkata kasar.', 'Saya sulit menjaga sopan santun.', 'Saya kurang peduli terhadap kegiatan keagamaan.', 'Saya merasa bersalah setelah melakukan kesalahan.', 'Saya belum konsisten menjalankan kewajiban agama.', 'Saya ingin memperbaiki akhlak/perilaku.', 'Saya sulit meminta maaf setelah salah.', 'Saya pernah mengejek keyakinan atau kebiasaan orang lain.', 'Saya ingin lebih disiplin dalam ibadah.', 'Saya membutuhkan bimbingan nilai moral.', 'Saya ingin menjadi pribadi yang lebih baik.'] },
  { code: 'I', title: 'PENYESUAIAN TERHADAP SEKOLAH', questions: ['Saya belum nyaman dengan lingkungan sekolah.', 'Saya sering terlambat masuk sekolah.', 'Saya kurang memahami tata tertib sekolah.', 'Saya sering takut kepada guru tertentu.', 'Saya merasa sulit mengikuti suasana kelas.', 'Saya kurang akrab dengan teman sekelas.', 'Saya merasa sekolah kurang menyenangkan.', 'Saya sering tidak membawa perlengkapan sekolah.', 'Saya takut bertanya kepada guru.', 'Saya merasa kurang aman di sekolah.', 'Saya pernah mengalami perundungan di sekolah.', 'Saya sulit mengikuti kegiatan upacara atau pembinaan.', 'Saya merasa kurang dikenal oleh guru.', 'Saya sering ingin pulang lebih cepat.', 'Saya kurang berani mengikuti kegiatan sekolah.', 'Saya bingung mencari bantuan saat ada masalah di sekolah.', 'Saya merasa aturan sekolah membebani saya.', 'Saya sering mendapat teguran di sekolah.', 'Saya ingin lebih mudah menyesuaikan diri.', 'Saya membutuhkan bimbingan agar betah di sekolah.'] },
  { code: 'J', title: 'MASA DEPAN DAN CITA-CITA', questions: ['Saya belum mempunyai cita-cita yang jelas.', 'Saya bingung memilih sekolah lanjutan.', 'Saya kurang mengetahui bakat dan minat saya.', 'Saya takut gagal meraih cita-cita.', 'Saya belum tahu pekerjaan yang cocok untuk saya.', 'Saya kurang mendapat informasi tentang SMA/SMK.', 'Saya belum punya rencana setelah lulus SMP.', 'Saya merasa cita-cita saya tidak didukung keluarga.', 'Saya kurang percaya diri menghadapi masa depan.', 'Saya bingung menentukan jurusan yang sesuai.', 'Saya belum tahu cara mencapai cita-cita saya.', 'Saya mudah berubah-ubah dalam memilih tujuan.', 'Saya jarang berdiskusi tentang masa depan.', 'Saya merasa nilai pelajaran belum mendukung cita-cita.', 'Saya ingin mengetahui peluang karier di masa depan.', 'Saya bingung memilih antara SMA dan SMK.', 'Saya khawatir keadaan ekonomi menghambat cita-cita.', 'Saya belum mengenal potensi diri.', 'Saya membutuhkan konseling karier.', 'Saya ingin menyusun rencana masa depan yang jelas.'] },
  { code: 'K', title: 'PENYESUAIAN TERHADAP KURIKULUM', questions: ['Saya kesulitan mengikuti beberapa mata pelajaran.', 'Saya sulit memahami cara belajar kurikulum sekarang.', 'Saya sering kewalahan dengan tugas sekolah.', 'Saya belum terbiasa belajar mandiri.', 'Saya sulit memahami materi berbasis proyek.', 'Saya kurang mampu mengatur jadwal belajar.', 'Saya sering menunda mengerjakan tugas.', 'Saya sulit memahami instruksi tugas guru.', 'Saya kurang aktif dalam diskusi kelas.', 'Saya kesulitan membuat rangkuman pelajaran.', 'Saya sulit mempersiapkan asesmen/ujian.', 'Saya kurang paham cara menilai kemajuan belajar sendiri.', 'Saya merasa beban pelajaran terlalu berat.', 'Saya kurang memahami penggunaan teknologi pembelajaran.', 'Saya sering lupa jadwal tugas.', 'Saya sulit bekerja dalam tugas kelompok proyek.', 'Saya belum menemukan strategi belajar yang tepat.', 'Saya sering takut nilai saya rendah.', 'Saya ingin meningkatkan motivasi belajar.', 'Saya membutuhkan bantuan menyesuaikan diri dengan kurikulum.'] }
];

const createInitialDcmAnswers = () => DCM_COMPONENTS.reduce<Record<string, 'Ya' | 'Tidak' | ''>>((acc, component) => {
  component.questions.forEach((_, questionIndex) => {
    acc[`${component.code}-${questionIndex + 1}`] = '';
  });
  return acc;
}, {});

const GAYA_BELAJAR_QUESTIONS = [
  { q: "1. Ketika belajar materi baru, saya lebih mudah memahami dengan cara…", a: "Melihat gambar, diagram, atau video", b: "Mendengarkan penjelasan guru", c: "Mempraktikkan langsung" },
  { q: "2. Saat mengingat sebuah informasi, saya cenderung…", a: "Membayangkan tulisan/gambarnya", b: "Mengingat suara atau ucapannya", c: "Mengingat gerakan/pengalamannya" },
  { q: "3. Saat guru menjelaskan, saya paling fokus jika…", a: "Ada slide / tulisan di papan", b: "Penjelasan suaranya jelas", c: "Disertai contoh praktik" },
  { q: "4. Cara saya menghafal pelajaran adalah…", a: "Membaca berulang-ulang", b: "Mengucapkan dengan keras", c: "Menulis atau memperagakan" },
  { q: "5. Ketika di kelas, saya lebih suka…", a: "Memperhatikan papan tulis", b: "Mendengarkan diskusi", c: "Ikut aktif bergerak/praktik" },
  { q: "6. Saat membaca buku, saya…", a: "Membayangkan isinya seperti gambar", b: "Membaca dalam hati seolah mendengar", c: "Mudah bosan jika hanya duduk diam" },
  { q: "7. Kalau diberi petunjuk arah, saya lebih paham jika…", a: "Dberi peta atau tulisan", b: "Dijelaskan secara lisan", c: "Diajak berjalan langsung" },
  { q: "8. Saat bosan dalam pelajaran, saya biasanya…", a: "Menggambar atau mencoret-coret buku", b: "Berbicara/berbisik dengan teman", c: "Menggerakkan tangan atau kaki" },
  { q: "9. Saya lebih mudah mengingat orang dari…", a: "Wajahnya", b: "Suaranya", c: "Cara bersalaman/berjalannya" },
  { q: "10. Ketika belajar di rumah, saya suka…", a: "Membuat catatan berwarna/peta konsep", b: "Membaca dengan suara keras", c: "Belajar sambil berjalan/bergerak" },
  { q: "11. Saat mengerjakan tugas, saya…", a: "Suka melihat contoh visual dahulu", b: "Suka mendengar penjelasan dahulu", c: "Suka langsung mencoba mengerjakan" },
  { q: "12. Hal yang paling mengganggu konsentrasi saya adalah…", a: "Ruangan berantakan/tidak rapi", b: "Suara berisik", c: "Harus duduk diam terlalu lama" },
  { q: "13. Saya lebih mudah memahami soal cerita jika…", a: "Dibuat gambar/skema", b: "Dibacakan oleh orang lain", c: "Diperagakan langsung" },
  { q: "14. Saat presentasi, saya suka…", a: "Menggunakan banyak gambar/slide", b: "Berbicara dengan jelas dan ekspresif", c: "Bergerak/berinteraksi dengan audiens" },
  { q: "15. Cara saya beristirahat yang menyenangkan adalah…", a: "Menonton film/membaca", b: "Mendengar musik", c: "Olahraga/jalan-jalan" },
  { q: "16. Ketika menerima pelajaran baru, saya ingin…", a: "Melihat contohnya", b: "Mendengar penjelasannya", c: "Mencoba sendiri" },
  { q: "17. Saya merasa nyaman belajar di tempat…", a: "Rapi dan terang", b: "Tenang/ada musik lembut", c: "Bebas bergerak" },
  { q: "18. Saat berbicara, saya sering…", a: "Menggunakan istilah \"lihat\", \"tampak\"", b: "Menggunakan istilah \"dengar\", \"bunyi\"", c: "Menggunakan istilah \"rasakan\", \"coba\"" },
  { q: "19. Saya paling cepat lelah jika harus…", a: "Membaca terlalu lama", b: "Mendengarkan ceramah panjang", c: "Duduk diam tanpa aktivitas" },
  { q: "20. Saat menghadapi masalah, saya cenderung…", a: "Membuat daftar/diagram", b: "Membicarakannya dengan orang lain", c: "Langsung mencoba menyelesaikannya" },
  { q: "21. Saya lebih mudah mengikuti instruksi jika…", a: "Ditulis langkah-langkahnya", b: "Diucapkan dengan jelas", c: "Diperagakan caranya" },
  { q: "22. Saat menonton film, saya paling memperhatikan…", a: "Visual/adegan dan warna", b: "Dialog and musik", c: "Aksi dan gerakan tokoh" },
  { q: "23. Saya mengingat nomor telepon dengan cara…", a: "Membayangkan angkanya", b: "Mengucapkannya berulang", c: "Menuliskannya/menekan tombol" },
  { q: "24. Saat ulangan, saya lebih mudah jika soalnya…", a: "Disertai gambar/tabel", b: "Dibacakan", c: "Berbentuk praktik" },
  { q: "25. Saya senang pelajaran yang…", a: "Banyak ilustrasi/visual", b: "Banyak diskusi/cerita", c: "Banyak praktik/eksperimen" },
  { q: "26. Ketika sedang berpikir, saya biasanya…", a: "Memandang ke atas/jauh", b: "Berbicara sendiri pelan", c: "Memutar pena/menggerakkan tangan" },
  { q: "27. Saya lebih mudah belajar bahasa asing dengan…", a: "Membaca tulisan/teks", b: "Mendengar percakapan", c: "Langsung mempraktikkannya berbicara" },
  { q: "28. Saat mengikuti pelatihan, saya senang jika…", a: "Diberi modul bergambar", b: "Diberi penjelasan lisan", c: "Diberi simulasi/praktik" },
  { q: "29. Hobi yang paling saya sukai adalah…", a: "Menggambar/menonton/membaca", b: "Menyanyi/mendengar musik/bercerita", c: "Olahraga/menari/berkarya tangan" },
  { q: "30. Jika diminta menjelaskan sesuatu, saya akan…", a: "Menggambarkan/menuliskannya", b: "Menjelaskan secara lisan", c: "Menunjukkan dengan gerakan/praktik" }
];

const RIASEC_COMPONENTS = [
  { code: 'R', title: 'Realistic (Praktis/Teknis)', questions: ['Saya suka bekerja dengan tangan dan peralatan mekanik.', 'Saya senang merakit atau memperbaiki peralatan elektronik.', 'Saya lebih suka kegiatan fisik di luar ruangan.', 'Saya senang menggunakan perkakas atau mesin untuk membuat sesuatu.'] },
  { code: 'I', title: 'Investigative (Penelitian)', questions: ['Saya senang memecahkan masalah matematika atau logika.', 'Saya tertarik mempelajari cara kerja alam atau teknologi.', 'Saya suka melakukan eksperimen atau penelitian kecil.', 'Saya senang membaca artikel tentang sains atau ilmu pengetahuan.'] },
  { code: 'A', title: 'Artistic (Seni/Kreatif)', questions: ['Saya senang menggambar, melukis, atau membuat desain.', 'Saya suka menulis cerita, puisi, atau lirik lagu.', 'Saya tertarik pada pertunjukan seni, drama, atau musik.', 'Saya senang mengekspresikan ide dengan cara yang unik/kreatif.'] },
  { code: 'S', title: 'Social (Sosial/Membantu)', questions: ['Saya senang membantu teman yang sedang dalam kesulitan.', 'Saya tertarik menjadi sukarelawan dalam kegiatan sosial.', 'Saya senang mengajar atau menjelaskan sesuatu kepada orang lain.', 'Saya merasa bahagia ketika bisa bekerja sama dengan orang banyak.'] },
  { code: 'E', title: 'Enterprising (Kepemimpinan/Bisnis)', questions: ['Saya senang memimpin diskusi atau organisasi.', 'Saya tertarik belajar tentang cara memulai bisnis.', 'Saya suka meyakinkan orang lain tentang pendapat saya.', 'Saya senang merencanakan strategi untuk mencapai target/keuntungan.'] },
  { code: 'C', title: 'Conventional (Administratif/Teratur)', questions: ['Saya senang menata dokumen atau barang dengan rapi.', 'Saya suka bekerja dengan data angka yang detail.', 'Saya lebih nyaman bekerja with aturan dan instruksi jelas.', 'Saya senang memastikan segala sesuatu sesuai dengan rencana.'] }
];

const createInitialRiasecAnswers = () => RIASEC_COMPONENTS.reduce<Record<string, 'Ya' | 'Tidak' | ''>>((acc, component) => {
  component.questions.forEach((_, idx) => {
    acc[`${component.code}-${idx + 1}`] = '';
  });
  return acc;
}, {});

// Helper to fill all unanswered as 'Tidak'
const fillRemainingAsTidak = (currentAnswers: Record<string, 'Ya' | 'Tidak' | ''>) => {
  const newAnswers = { ...currentAnswers };
  DCM_COMPONENTS.forEach(comp => {
    comp.questions.forEach((_, idx) => {
      const key = `${comp.code}-${idx + 1}`;
      if (newAnswers[key] === '') {
        newAnswers[key] = 'Tidak';
      }
    });
  });
  return newAnswers;
};

export const AsesmenSiswaComponent: React.FC<AsesmenSiswaProps> = ({
  asesmen,
  siswa,
  guru,
  kelas,
  identitas,
  onAdd,
  onDelete,
  triggerNotification
}) => {
  const [activeTab, setActiveTab] = useState<JenisAsesmen>('Daftar Cek Masalah');
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [statScope, setStatScope] = useState<'all' | 'class' | 'student'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentNisn, setSelectedStudentNisn] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Statistics Calculation
  const getStatsData = () => {
    let filteredAsesmen = asesmen.filter(a => a.jenisAsesmen === activeTab);
    
    if (statScope === 'class' && selectedClass) {
      filteredAsesmen = filteredAsesmen.filter(a => a.kelas === selectedClass);
    } else if (statScope === 'student' && selectedStudentNisn) {
      filteredAsesmen = filteredAsesmen.filter(a => a.nisn === selectedStudentNisn);
    }

    const totalParticipants = filteredAsesmen.length;
    const totalSiswaInScope = statScope === 'all' ? siswa.length : (statScope === 'class' ? siswa.filter(s => s.kelas === selectedClass).length : 1);
    const participationRate = totalSiswaInScope > 0 ? Math.round((totalParticipants / totalSiswaInScope) * 100) : 0;

    return { filteredAsesmen, totalParticipants, participationRate };
  };

  const { filteredAsesmen: statsAsesmen, totalParticipants, participationRate } = getStatsData();

  // New assessment Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Choose student & type, 2: Fill content
  const [selectedNisn, setSelectedNisn] = useState('');
  
  // Wizard Question states
  const [styleAnswers, setStyleAnswers] = useState<Record<number, string>>({});
  const [dcmAnswers, setDcmAnswers] = useState<Record<string, 'Ya' | 'Tidak' | ''>>(() => createInitialDcmAnswers());
  const [riasecAnswers, setRiasecAnswers] = useState<Record<string, 'Ya' | 'Tidak' | ''>>(() => createInitialRiasecAnswers());
  const [citaCita, setCitaCita] = useState('');
  const [guruSenang, setGuruSenang] = useState('');
  const [guruTidakSenang, setGuruTidakSenang] = useState('');
  
  // Filtering
  const filteredData = asesmen.filter(a => {
    const matchesTab = a.jenisAsesmen === activeTab;
    const matchesSearch = 
      a.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nisn.includes(searchTerm) ||
      (a.hasil && a.hasil.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const startNewWizard = () => {
    setSelectedNisn(siswa[0]?.nisn || '');
    setStyleAnswers({});
    setDcmAnswers(createInitialDcmAnswers());
    setRiasecAnswers(createInitialRiasecAnswers());
    setCitaCita('');
    setGuruSenang('');
    setGuruTidakSenang('');
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleNextStep = () => {
    if (!selectedNisn) {
      triggerNotification("Silakan pilih siswa terlebih dahulu!", "error");
      return;
    }
    setWizardStep(2);
  };

  // Helper for DCM calculation in stats
  const calculateDcmStats = (data: AsesmenSiswa[]) => {
    const componentTotals: Record<string, number> = {};
    data.forEach(a => {
      try {
        const d = JSON.parse(a.detailSkor || '{}');
        if (d.skorPerKomponen) {
          d.skorPerKomponen.forEach((c: any) => {
            const title = c.komponen || c.title;
            componentTotals[title] = (componentTotals[title] || 0) + (c.ya || 0);
          });
        }
      } catch(e) {}
    });
    return componentTotals;
  };

  // Helper for RIASEC calculation in stats
  const calculateRiasecStats = (data: AsesmenSiswa[]) => {
    const totals: Record<string, number> = { 'Realistic': 0, 'Investigative': 0, 'Artistic': 0, 'Social': 0, 'Enterprising': 0, 'Conventional': 0 };
    data.forEach(a => {
      try {
        const d = JSON.parse(a.detailSkor || '{}');
        if (d.skorRiasec) {
          d.skorRiasec.forEach((s: any) => {
            const key = s.title.split(' ')[0];
            if (totals[key] !== undefined) totals[key] += s.ya;
          });
        }
      } catch(e) {}
    });
    return totals;
  };

  // Helper for Learning Style calculation
  const calculateStyleStats = (data: AsesmenSiswa[]) => {
    let visual = 0, auditory = 0, kinesthetic = 0;
    data.forEach(a => {
      try {
        const d = JSON.parse(a.detailSkor || '{}');
        visual += d.visual || 0;
        auditory += d.auditory || 0;
        kinesthetic += d.kinesthetic || 0;
      } catch(e) {}
    });
    return { visual, auditory, kinesthetic };
  };

  // Submit and Auto-save Assessment
  const handleSubmitWizard = (e: React.FormEvent) => {
    e.preventDefault();
    const s = siswa.find(x => x.nisn === selectedNisn);
    if (!s) return;

    let hasilStr = '';
    let detailSkorStr = '';

    if (activeTab === 'Tes Gaya Belajar') {
      let visual = 0, auditory = 0, kinesthetic = 0;
      Object.values(styleAnswers).forEach(val => {
        if (val === 'A') visual++;
        if (val === 'B') auditory++;
        if (val === 'C') kinesthetic++;
      });
      
      const totalAnswers = Math.max(Object.keys(styleAnswers).length, 1);
      const visPct = Math.round((visual / totalAnswers) * 100);
      const audPct = Math.round((auditory / totalAnswers) * 100);
      const kinPct = Math.round((kinesthetic / totalAnswers) * 100);
      
      let dominant = 'Visual';
      if (auditory > visual && auditory > kinesthetic) dominant = 'Auditorial';
      if (kinesthetic > visual && kinesthetic > auditory) dominant = 'Kinestetik';

      hasilStr = `Gaya Belajar Dominan: ${dominant.toUpperCase()} (Visual: ${visPct}%, Auditory: ${audPct}%, Kinestetik: ${kinPct}%)`;
      detailSkorStr = JSON.stringify({ visual, auditory, kinesthetic });

    } else if (activeTab === 'Daftar Cek Masalah') {
      const unanswered = Object.values(dcmAnswers).filter(answer => answer === '').length;
      if (unanswered > 0) {
        triggerNotification(`Masih ada ${unanswered} pertanyaan DCM yang belum dijawab. Lengkapi Ya/Tidak terlebih dahulu.`, "error");
        return;
      }

      const skorPerKomponen = DCM_COMPONENTS.map(component => {
        const ya = component.questions.filter((_, questionIndex) => dcmAnswers[`${component.code}-${questionIndex + 1}`] === 'Ya').length;
        return { kode: component.code, komponen: component.title, ya, tidak: component.questions.length - ya, total: component.questions.length };
      });
      const totalProblems = skorPerKomponen.reduce((sum, item) => sum + item.ya, 0);
      const topProblems = [...skorPerKomponen].sort((a, b) => b.ya - a.ya).slice(0, 3);

      hasilStr = `DCM selesai: ${totalProblems} jawaban Ya dari 220 pertanyaan. Komponen tertinggi: ${topProblems.map(item => `${item.kode}. ${item.komponen} (${item.ya})`).join(', ')}.`;
      detailSkorStr = JSON.stringify({ totalYa: totalProblems, totalPertanyaan: 220, skorPerKomponen, jawaban: dcmAnswers });

    } else if (activeTab === 'Tes Minat Bakat') {
      const unanswered = Object.values(riasecAnswers).filter(a => a === '').length;
      if (unanswered > 0) {
        triggerNotification(`Mohon lengkapi ${unanswered} pertanyaan minat bakat.`, "error");
        return;
      }
      if (!citaCita.trim()) {
        triggerNotification("Cita-cita wajib diisi!", "error");
        return;
      }

      const skorRiasec = RIASEC_COMPONENTS.map(comp => {
        const ya = comp.questions.filter((_, idx) => riasecAnswers[`${comp.code}-${idx + 1}`] === 'Ya').length;
        return { title: comp.title, ya };
      });
      const dominant = [...skorRiasec].sort((a, b) => b.ya - a.ya)[0];

      hasilStr = `Dominan: ${dominant.title}. Cita-cita: ${citaCita}. Guru Fav: ${guruSenang || '-'}.`;
      detailSkorStr = JSON.stringify({ skorRiasec, citaCita, guruSenang, guruTidakSenang, jawaban: riasecAnswers });
    }

    const payload: any = {
      tanggal: new Date().toISOString().split('T')[0],
      nisn: s.nisn,
      namaSiswa: s.namaSiswa,
      kelas: s.kelas,
      jenisAsesmen: activeTab,
      hasil: hasilStr,
      detailSkor: detailSkorStr
    };

    onAdd(payload);

    setIsWizardOpen(false);
    triggerNotification(`Asesmen ${activeTab} berhasil disimpan!`, "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data asesmen ini?")) {
      onDelete(id);
      triggerNotification("Data asesmen berhasil dihapus!", "success");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map((a, idx) => ({
      'No.': idx + 1,
      'Tanggal': a.tanggal,
      'NISN': a.nisn,
      'Nama Siswa': a.namaSiswa,
      'Kelas': a.kelas,
      'Jenis Asesmen': a.jenisAsesmen,
      'Hasil Analisis': a.hasil
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Asesmen");
    XLSX.writeFile(wb, `Asesmen_${activeTab.replace(/\s+/g, '_')}_${identitas.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
    triggerNotification("Excel berhasil diunduh!", "success");
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Hasil Asesmen - ${identitas.namaSekolah}</title>
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
          <h2 style="text-align: center;">LAPORAN HASIL ASESMEN SISWA</h2>
          <p>Kategori Asesmen: <b>${activeTab}</b></p>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">No</th>
                <th style="width: 90px;">Tanggal</th>
                <th style="width: 100px;">NISN</th>
                <th style="width: 160px;">Nama Siswa</th>
                <th style="width: 70px;">Kelas</th>
                <th>Hasil & Analisis Asesmen</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((a, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${a.tanggal}</td>
                  <td>${a.nisn}</td>
                  <td>${a.namaSiswa}</td>
                  <td>${a.kelas}</td>
                  <td>${a.hasil}</td>
                </tr>
              `).join('')}
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
            <FileCheck className="w-7 h-7 text-indigo-650" />
            Asesmen Siswa
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Lakukan dan rekap asesmen gaya belajar, DCM, minat bakat, dan catatan anekdot siswa
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button 
            onClick={handlePrintPDF} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Main Mode Toggle Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Daftar Data
        </button>
        <button 
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${viewMode === 'stats' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Grafik Statistik
        </button>
      </div>

      {/* Assessment Submenu Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-px overflow-x-auto">
        {(['Daftar Cek Masalah', 'Tes Gaya Belajar', 'Tes Minat Bakat'] as JenisAsesmen[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`
              px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer
              ${activeTab === tab 
                ? 'border-indigo-650 text-indigo-700 dark:text-indigo-400 font-extrabold' 
                : 'border-transparent text-slate-455 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-405" />
              <input 
                type="text" 
                placeholder="Cari nama, NISN, atau analisis hasil..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-205"
              />
            </div>

            <button 
              onClick={startNewWizard} 
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              Mulai {activeTab}
            </button>
          </div>

          {/* Search Area Card (Matching Image) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Hasil & Rekomendasi Analisis</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-medium italic">
                        Belum ada data
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((a, index) => {
                      const no = startIndex + index + 1;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4 text-center font-bold text-slate-400">{no}</td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-700 dark:text-slate-400 whitespace-nowrap">{a.tanggal}</td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-800 dark:text-slate-205">{a.namaSiswa}</span>
                            <div className="text-[10px] font-mono text-slate-400">NISN: {a.nisn}</div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-600 dark:text-slate-400">{a.kelas}</td>
                          <td className="px-4 py-4 max-w-lg">
                            <div className="flex items-start gap-2 bg-indigo-50/20 dark:bg-slate-850/50 p-2.5 rounded-xl border border-indigo-100/10 text-slate-655 dark:text-slate-350">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <p>{a.hasil}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleDelete(a.id)}
                                className="p-1.5 text-rose-650 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Hapus hasil"
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
          </div>

          {/* Pagination Bar inside the card but consistent */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} Asesmen
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
      ) : (
        /* STATISTICS VIEW MODE */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Scope Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Dashboard Grafik & Statistik</h2>
              <p className="text-[10px] text-slate-400 font-bold">Analisis hasil {activeTab} secara mendalam</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setStatScope('all')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${statScope === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-100 dark:border-slate-700'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grafik Semua
              </button>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setStatScope('class')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${statScope === 'class' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-100 dark:border-slate-700'}`}
                >
                  <UsersIcon className="w-3.5 h-3.5" />
                  Grafik Perkelas
                </button>
                {statScope === 'class' && (
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-2 py-1.5 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Pilih Kelas</option>
                    {kelas.map(k => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setStatScope('student')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${statScope === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-100 dark:border-slate-700'}`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Grafik Persiswa
                </button>
                {statScope === 'student' && (
                  <select 
                    value={selectedStudentNisn} 
                    onChange={(e) => setSelectedStudentNisn(e.target.value)}
                    className="px-2 py-1.5 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 max-w-[150px]"
                  >
                    <option value="">Pilih Siswa</option>
                    {siswa.map(s => <option key={s.id} value={s.nisn}>{s.namaSiswa}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Total Partisipasi</span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalParticipants}</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">Siswa</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Persentase</span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{participationRate}%</span>
                <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Persiswa</span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-1 uppercase truncate block">
                {statScope === 'student' ? (siswa.find(s => s.nisn === selectedStudentNisn)?.namaSiswa || '-') : 'N/A'}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Perkelas</span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-1 uppercase truncate block">
                {statScope === 'class' ? (selectedClass || '-') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Dynamic Chart Content */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Visualisasi Hasil {activeTab}</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400">Analisis distribusi skor dan kecenderungan berdasarkan parameter terpilih</p>
                </div>
                <PieChart className="w-6 h-6 text-indigo-50" />
              </div>

              {statsAsesmen.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Belum ada data yang tersedia untuk cakupan statistik ini.</p>
                </div>
              ) : (
                <div className="space-y-8">
                   {/* Logic to render bars/distribution based on assessment type */}
                   {activeTab === 'Tes Gaya Belajar' && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {(() => {
                          const { visual, auditory, kinesthetic } = calculateStyleStats(statsAsesmen);
                          const grandTotal = (visual + auditory + kinesthetic) || 1;
                          
                          return [
                            { label: 'VISUAL', val: visual, color: 'bg-indigo-500', pct: Math.round((visual/grandTotal)*100) },
                            { label: 'AUDITORI', val: auditory, color: 'bg-emerald-500', pct: Math.round((auditory/grandTotal)*100) },
                            { label: 'KINESTETIK', val: kinesthetic, color: 'bg-amber-500', pct: Math.round((kinesthetic/grandTotal)*100) }
                          ].map(item => (
                            <div key={item.label} className="space-y-4">
                              <div className="flex justify-between items-end">
                                <div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{item.val}</p>
                                </div>
                                <span className="text-sm font-black text-slate-455">{item.pct}%</span>
                              </div>
                              <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
                              </div>
                            </div>
                          ));
                        })()}
                     </div>
                   )}

                   {activeTab === 'Tes Minat Bakat' && (
                     <div className="space-y-6">
                        {(() => {
                          const riasecTotals = calculateRiasecStats(statsAsesmen);
                          const maxVal = Math.max(...Object.values(riasecTotals), 1);
                          
                          return Object.entries(riasecTotals).map(([key, val]) => (
                            <div key={key} className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide">
                                <span className="text-slate-600 dark:text-slate-300">{key}</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{val} Skor Total</span>
                              </div>
                              <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${(val/maxVal)*100}%` }} />
                              </div>
                            </div>
                          ));
                        })()}
                     </div>
                   )}

                   {activeTab === 'Daftar Cek Masalah' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                        {(() => {
                          const compTotals = calculateDcmStats(statsAsesmen);
                          const maxVal = Math.max(...Object.values(compTotals), 1);
                          
                          return Object.entries(compTotals).map(([key, val]) => (
                            <div key={key} className="space-y-1.5">
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wide">
                                <span className="text-slate-655 dark:text-slate-400 truncate max-w-[200px]">{key}</span>
                                <span className="text-rose-600 dark:text-rose-400 font-bold">{val}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${(val/maxVal)*100}%` }} />
                              </div>
                            </div>
                          ));
                        })()}
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Asesmen: {activeTab}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Langkah {wizardStep} dari 2</p>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Wizard Form */}
            <form onSubmit={handleSubmitWizard} className="p-6 space-y-4">
              {/* STEP 1: Select Student */}
              {wizardStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">Pilih Siswa yang Diases*</label>
                    <select 
                      value={selectedNisn}
                      onChange={(e) => setSelectedNisn(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-350"
                      required
                    >
                      <option value="" disabled>-- Pilih Siswa --</option>
                      {siswa.map(s => (
                        <option key={s.id} value={s.nisn}>{s.namaSiswa} - Kelas {s.kelas} ({s.nisn})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/50 rounded-2xl">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Informasi Asesmen
                    </h4>
                    <p className="text-[11px] text-indigo-750 dark:text-indigo-400 leading-relaxed mt-1.5">
                      Anda akan memulai pengisian <b>{activeTab}</b>. Sistem akan memandu Anda mengisi kuesioner interaktif atau form isian, kemudian menyimpannya ke database secara otomatis.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="button" 
                      onClick={handleNextStep}
                      className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Mulai Pengisian
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Fill Content based on type */
                <div className="space-y-4">
                  {/* Visual Indicator of Student */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Clipboard className="w-4 h-4 text-slate-450" />
                    <span>Siswa: {siswa.find(x => x.nisn === selectedNisn)?.namaSiswa} ({siswa.find(x => x.nisn === selectedNisn)?.kelas})</span>
                  </div>

                  {/* A. STYLE BELAJAR WIZARD */}
                  {activeTab === 'Tes Gaya Belajar' && (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {GAYA_BELAJAR_QUESTIONS.map((item, idx) => (
                        <div key={idx} className="space-y-2 border-b border-slate-50 dark:border-slate-850 pb-3 last:border-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.q}</p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {[
                              { label: item.a, val: 'A' },
                              { label: item.b, val: 'B' },
                              { label: item.c, val: 'C' }
                            ].map(opt => (
                              <label key={opt.val} className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/30 ${styleAnswers[idx] === opt.val ? 'border-indigo-400 bg-indigo-50/20 text-indigo-750 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-800'}`}>
                                <input 
                                  type="radio" 
                                  name={`q-${idx}`} 
                                  checked={styleAnswers[idx] === opt.val}
                                  onChange={() => setStyleAnswers({...styleAnswers, [idx]: opt.val})}
                                  className="text-indigo-650"
                                  required
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* B. DCM (Daftar Cek Masalah) 11 Komponen x 20 Pertanyaan */}
                  {activeTab === 'Daftar Cek Masalah' && (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3 shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Daftar Cek Masalah: 11 Komponen, 220 Pertanyaan</p>
                            <p className="text-[10px] text-slate-500 mt-1">Pilih <b>Ya</b> jika pernyataan sesuai dengan kondisi siswa. Semua pertanyaan wajib dijawab.</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setDcmAnswers(fillRemainingAsTidak(dcmAnswers));
                              triggerNotification("Sisa jawaban otomatis diisi dengan 'Tidak'", "success");
                            }}
                            className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            Isi Sisa 'Tidak'
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                            <span>Progress Pengisian</span>
                            <span>{Math.round((Object.values(dcmAnswers).filter(a => a !== '').length / 220) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-300" 
                              style={{ width: `${(Object.values(dcmAnswers).filter(a => a !== '').length / 220) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {DCM_COMPONENTS.map(component => {
                        const yaCount = component.questions.filter((_, questionIndex) => dcmAnswers[`${component.code}-${questionIndex + 1}`] === 'Ya').length;
                        return (
                          <div key={component.code} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                            <div className="bg-indigo-50 dark:bg-slate-800 px-4 py-3 flex items-center justify-between gap-3">
                              <span className="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">
                                {component.code}. {component.title}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                Ya: {yaCount}/20
                              </span>
                            </div>

                            <div className="divide-y divide-slate-50 dark:divide-slate-800/70">
                              {component.questions.map((question, questionIndex) => {
                                const answerKey = `${component.code}-${questionIndex + 1}`;
                                return (
                                  <div key={answerKey} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 px-4 py-3 text-xs">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {questionIndex + 1}. {question}
                                    </p>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                      {(['Ya', 'Tidak'] as const).map(option => (
                                        <label key={option} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${dcmAnswers[answerKey] === option ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                          <input
                                            type="radio"
                                            name={`dcm-${answerKey}`}
                                            value={option}
                                            checked={dcmAnswers[answerKey] === option}
                                            onChange={() => setDcmAnswers(prev => ({ ...prev, [answerKey]: option }))}
                                            className="text-indigo-600"
                                            required
                                          />
                                          <span className="font-bold text-[11px]">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* C. TES MINAT BAKAT WIZARD (RIASEC + Qualitative) */}
                  {activeTab === 'Tes Minat Bakat' && (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                      {/* Qualitative Questions first for ease of flow */}
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl space-y-3">
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Aspirasi & Refleksi Kelas</span>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">1. Apa cita-citamu?</label>
                          <input type="text" value={citaCita} onChange={(e) => setCitaCita(e.target.value)} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="Contoh: Dokter, Arsitek, Guru..." required />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">2. Guru siapa yang paling kamu senang cara mengajarnya di kelas?</label>
                          <input type="text" value={guruSenang} onChange={(e) => setGuruSenang(e.target.value)} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="Nama Guru" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">3. Guru siapa yang paling kamu tidak senang cara mengajarnya di kelas?</label>
                          <input type="text" value={guruTidakSenang} onChange={(e) => setGuruTidakSenang(e.target.value)} className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="Nama Guru (Opsional)" />
                        </div>
                      </div>

                      {/* RIASEC RIASEC (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) */}
                      {RIASEC_COMPONENTS.map(comp => (
                        <div key={comp.code} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Komponen: {comp.title}</span>
                          </div>
                          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                            {comp.questions.map((q, idx) => {
                              const key = `${comp.code}-${idx + 1}`;
                              return (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 text-xs">
                                  <p className="font-medium text-slate-655 dark:text-slate-400">{idx+1}. {q}</p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {(['Ya', 'Tidak'] as const).map(opt => (
                                      <label key={opt} className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg cursor-pointer transition-all ${riasecAnswers[key] === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                        <input type="radio" name={`riasec-${key}`} checked={riasecAnswers[key] === opt} onChange={() => setRiasecAnswers(prev => ({...prev, [key]: opt}))} className="text-emerald-600 w-3 h-3" />
                                        <span className="font-bold text-[10px]">{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}



                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <button 
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-655 dark:text-slate-400 hover:bg-slate-55/10 cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Simpan & Selesai
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
