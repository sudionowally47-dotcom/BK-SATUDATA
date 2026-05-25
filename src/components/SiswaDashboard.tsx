import React, { useState } from 'react';
import { 
  User, BookOpen, FileCheck, Calendar, MapPin, Phone, 
  Sparkles, Award, CheckCircle2 
} from 'lucide-react';
import { Siswa, LayananBK, AsesmenSiswa, JadwalKonseling, IdentitasSekolah } from '../types';

interface SiswaDashboardProps {
  studentData: Siswa;
  layanan: LayananBK[];
  asesmen: AsesmenSiswa[];
  jadwal: JadwalKonseling[];
  currentTab: string;
  identitas: IdentitasSekolah;
  onUpdateProfil: (id: string, data: Partial<Siswa>) => void;
  onAddAsesmen: (asesmen: Omit<AsesmenSiswa, 'id'>) => void;
  triggerNotification: (msg: string, type: 'success' | 'error') => void;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  studentData,
  layanan,
  asesmen,
  jadwal,
  currentTab,
  identitas,
  onUpdateProfil,
  onAddAsesmen,
  triggerNotification
}) => {
  // Student-specific data filtering
  const myLayanan = layanan.filter(l => l.nisn === studentData.nisn);
  const myAsesmen = asesmen.filter(a => a.nisn === studentData.nisn);
  const myJadwal = jadwal.filter(j => j.nisn === studentData.nisn);

  // Edit Profil States
  const [noHp, setNoHp] = useState(studentData.noHp);
  const [alamat, setAlamat] = useState(studentData.alamat);
  const [isSavingProfil, setIsSavingProfil] = useState(false);

  // Quiz States for Student Asesmen
  const [activeQuiz, setActiveQuiz] = useState<'style' | 'minat' | 'dcm' | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Style Belajar questions (30 Questions)
  const styleQuestions = [
    { q: "1. Ketika belajar materi baru, saya lebih mudah memahami dengan cara…", a: "Melihat gambar, diagram, atau video", b: "Mendengarkan penjelasan guru", c: "Mempraktikkan langsung" },
    { q: "2. Saat mengingat sebuah informasi, saya cenderung…", a: "Membayangkan tulisan/gambarnya", b: "Mengingat suara atau ucapannya", c: "Mengingat gerakan/pengalamannya" },
    { q: "3. Saat guru menjelaskan, saya paling fokus jika…", a: "Ada slide / tulisan di papan", b: "Penjelasan suaranya jelas", c: "Disertai contoh praktik" },
    { q: "4. Cara saya menghafal pelajaran adalah…", a: "Membaca berulang-ulang", b: "Mengucapkan dengan keras", c: "Menulis atau memperagakan" },
    { q: "5. Ketika di kelas, saya lebih suka…", a: "Memperhatikan papan tulis", b: "Mendengarkan diskusi", c: "Ikut aktif bergerak/praktik" },
    { q: "6. Saat membaca buku, saya…", a: "Membayangkan isinya seperti gambar", b: "Membaca dalam hati seolah mendengar", c: "Mudah bosan jika hanya duduk diam" },
    { q: "7. Kalau diberi petunjuk arah, saya lebih paham jika…", a: "Diberi peta atau tulisan", b: "Dijelaskan secara lisan", c: "Diajak berjalan langsung" },
    { q: "8. Saat bosan dalam pelajaran, saya biasanya…", a: "Menggambar atau mencoret-coret buku", b: "Berbicara/berbisik dengan teman", c: "Menggerakkan tangan atau kaki" },
    { q: "9. Saya lebih mudah mengingat orang dari…", a: "Wajahnya", b: "Suaranya", c: "Cara bersalaman/berjalannya" },
    { q: "10. Ketika belajar di rumah, saya suka…", a: "Membuat catatan berwarna/peta konsep", b: "Membaca dengan suara keras", c: "Belajar sambil berjalan/bergerak" },
    { q: "11. Saat mengerjakan tugas, saya…", a: "Suka melihat contoh visual dahulu", b: "Suka mendengar penjelasan dahulu", c: "Suka langsung mencoba mengerjakan" },
    { q: "12. Hal yang paling mengganggu konsentrasi saya adalah…", a: "Ruangan berantakan/tidak rapi", b: "Suara berisik", c: "Harus duduk diam terlalu lama" },
    { q: "13. Saya lebih mudah memahami soal cerita jika…", a: "Dibuat gambar/skema", b: "Dibacakan oleh orang lain", c: "Diperagakan langsung" },
    { q: "14. Saat presentasi, saya suka…", a: "Menggunakan banyak gambar/slide", b: "Berbicara dengan jelas and ekspresif", c: "Bergerak/berinteraksi dengan audiens" },
    { q: "15. Cara saya beristirahat yang menyenangkan adalah…", a: "Menonton film/membaca", b: "Mendengar musik", c: "Olahraga/jalan-jalan" },
    { q: "16. Ketika menerima pelajaran baru, saya ingin…", a: "Melihat contohnya", b: "Mendengar penjelasannya", c: "Mencoba sendiri" },
    { q: "17. Saya merasa nyaman belajar di tempat…", a: "Rapi dan terang", b: "Tenang/ada musik lembut", c: "Bebas bergerak" },
    { q: "18. Saat berbicara, saya sering…", a: "Menggunakan istilah \"lihat\", \"tampak\"", b: "Menggunakan istilah \"dengar\", \"bunyi\"", c: "Menggunakan istilah \"rasakan\", \"coba\"" },
    { q: "19. Saya paling cepat lelah jika harus…", a: "Membaca terlalu lama", b: "Mendengarkan ceramah panjang", c: "Duduk diam tanpa aktivitas" },
    { q: "20. Saat menghadapi masalah, saya cenderung…", a: "Membuat daftar/diagram", b: "Membicarakannya dengan orang lain", c: "Langsung mencoba menyelesaikannya" },
    { q: "21. Saya lebih mudah mengikuti instruksi jika…", a: "Ditulis langkah-langkahnya", b: "Diucapkan dengan jelas", c: "Diperagakan caranya" },
    { q: "22. Saat menonton film, saya paling memperhatikan…", a: "Visual/adegan dan warna", b: "Dialog dan musik", c: "Aksi dan gerakan tokoh" },
    { q: "23. Saya mengingat nomor telepon dengan cara…", a: "Membayangkan angkanya", b: "Mengucapkannya berulang", c: "Menuliskannya/menekan tombol" },
    { q: "24. Saat ulangan, saya lebih mudah jika soalnya…", a: "Disertai gambar/tabel", b: "Dibacakan", c: "Berbentuk praktik" },
    { q: "25. Saya senang pelajaran yang…", a: "Banyak ilustrasi/visual", b: "Banyak diskusi/cerita", c: "Banyak praktik/eksperimen" },
    { q: "26. Ketika sedang berpikir, saya biasanya…", a: "Memandang ke atas/jauh", b: "Berbicara sendiri pelan", c: "Memutar pena/menggerakkan tangan" },
    { q: "27. Saya lebih mudah belajar bahasa asing dengan…", a: "Membaca tulisan/teks", b: "Mendengar percakapan", c: "Langsung mempraktikkannya berbicara" },
    { q: "28. Saat mengikuti pelatihan, saya senang jika…", a: "Diberi modul bergambar", b: "Diberi penjelasan lisan", c: "Diberi simulasi/praktik" },
    { q: "29. Hobi yang paling saya sukai adalah…", a: "Menggambar/menonton/membaca", b: "Menyanyi/mendengar musik/bercerita", c: "Olahraga/menari/berkarya tangan" },
    { q: "30. Jika diminta menjelaskan sesuatu, saya akan…", a: "Menggambarkan/menuliskannya", b: "Menjelaskan secara lisan", c: "Menunjukkan dengan gerakan/praktik" }
  ];

  // DCM States
  const DCM_COMPONENTS = [
    { code: 'A', title: 'KESEHATAN', questions: ['Saya sering sakit kepala.', 'Saya sering merasa pusing.', 'Saya sering merasa cepat lelah.', 'Saya sulit tidur pada malam hari.', 'Saya kurang nafsu makan.', 'Saya sering sakit perut.', 'Penglihatan saya sering terganggu.', 'Pendengaran saya sering terganggu.', 'Saya mempunyai penyakit yang sering kambuh.', 'Saya mudah merasa cemas tentang kesehatan.', 'Saya jarang berolahraga.', 'Saya sering terlambat makan.', 'Saya merasa berat badan saya bermasalah.', 'Saya sering mengantuk saat belajar.', 'Saya kurang menjaga kebersihan diri.', 'Saya sering merasa tidak bugar di sekolah.', 'Saya memiliki alergi yang mengganggu kegiatan.', 'Saya takut memeriksakan diri ke tenaga kesehatan.', 'Saya sering tidak masuk sekolah karena sakit.', 'Saya membutuhkan bantuan untuk menjaga pola hidup sehat.'] },
    { code: 'B', title: 'KEADAAN KEHIDUPAN EKONOMI', questions: ['Saya sering khawatir tentang biaya sekolah.', 'Saya sering kekurangan uang saku.', 'Saya sulit membeli perlengkapan sekolah.', 'Saya sering membantu orang tua mencari uang.', 'Saya merasa keadaan ekonomi keluarga mengganggu belajar.', 'Saya tidak mempunyai tempat belajar yang memadai.', 'Saya sering menunda tugas karena tidak ada alat tulis.', 'Saya malu dengan keadaan ekonomi keluarga.', 'Saya sulit mengikuti kegiatan sekolah karena biaya.', 'Saya sering meminjam barang sekolah dari teman.', 'Saya ingin membantu ekonomi keluarga tetapi bingung caranya.', 'Saya merasa kebutuhan belajar belum terpenuhi.', 'Saya sering tidak membawa bekal atau uang makan.', 'Saya sulit mengakses internet untuk belajar.', 'Saya sering cemas jika ada iuran sekolah.', 'Saya pernah tidak ikut kegiatan karena tidak mampu membayar.', 'Saya merasa iri dengan fasilitas teman.', 'Saya membutuhkan beasiswa atau bantuan belajar.', 'Saya belum bisa mengatur uang saku.', 'Saya ingin berkonsultasi tentang masalah ekonomi keluarga.'] },
    { code: 'C', title: 'REKREASI', questions: ['Saya jarang memiliki waktu untuk beristirahat.', 'Saya tidak memiliki kegiatan hiburan yang sehat.', 'Saya sering merasa bosan di rumah.', 'Saya menghabiskan waktu luang terlalu lama dengan gawai.', 'Saya tidak tahu cara mengisi waktu luang dengan baik.', 'Saya jarang mengikuti kegiatan olahraga atau seni.', 'Saya merasa hiburan saya mengganggu waktu belajar.', 'Saya sering bermain sampai lupa waktu.', 'Saya tidak memiliki teman untuk kegiatan positif.', 'Saya sulit membatasi permainan online.', 'Saya merasa kurang mendapat kesempatan rekreasi keluarga.', 'Saya sering merasa jenuh dengan rutinitas sekolah.', 'Saya belum memiliki hobi yang bermanfaat.', 'Saya sering menggunakan waktu libur tanpa rencana.', 'Saya merasa kegiatan rekreasi saya tidak produktif.', 'Saya ingin mengikuti kegiatan ekstrakurikuler tetapi ragu.', 'Saya sulit menyeimbangkan belajar dan hiburan.', 'Saya sering mencari hiburan yang kurang sehat.', 'Saya merasa kurang bahagia saat waktu luang.', 'Saya membutuhkan saran kegiatan rekreasi positif.'] },
    { code: 'D', title: 'KEHIDUPAN SOSIAL KEAKTIFAN BERORGANISASI', questions: ['Saya sulit bergaul dengan teman baru.', 'Saya jarang mengikuti kegiatan organisasi sekolah.', 'Saya kurang percaya diri berbicara di depan kelompok.', 'Saya sering merasa tidak diterima teman.', 'Saya sulit bekerja sama dalam kelompok.', 'Saya kurang aktif dalam kegiatan kelas.', 'Saya takut menyampaikan pendapat.', 'Saya pernah merasa dikucilkan teman.', 'Saya sulit menjadi pengurus atau pemimpin kelompok.', 'Saya kurang peduli terhadap kegiatan sekolah.', 'Saya sering menolak ajakan kegiatan positif.', 'Saya bingung memilih ekstrakurikuler yang sesuai.', 'Saya merasa tidak punya teman dekat di sekolah.', 'Saya sulit menyesuaikan diri dalam kelompok baru.', 'Saya pernah mengalami konflik dalam organisasi.', 'Saya kurang bertanggung jawab dalam tugas kelompok.', 'Saya malu mengikuti lomba atau kegiatan sekolah.', 'Saya sulit membagi waktu antara organisasi dan belajar.', 'Saya merasa kemampuan sosial saya perlu ditingkatkan.', 'Saya ingin dibantu menjadi lebih aktif berorganisasi.'] },
    { code: 'E', title: 'HUBUNGAN PRIBADI', questions: ['Saya kurang percaya diri terhadap diri sendiri.', 'Saya mudah tersinggung.', 'Saya sulit mengendalikan emosi.', 'Saya sering merasa minder.', 'Saya merasa tidak mempunyai kelebihan.', 'Saya sulit mengambil keputusan sendiri.', 'Saya sering menyimpan masalah sendiri.', 'Saya mudah marah kepada orang lain.', 'Saya sulit meminta maaf.', 'Saya sering merasa kesepian.', 'Saya takut gagal sebelum mencoba.', 'Saya mudah putus asa.', 'Saya sulit menerima kritik.', 'Saya sering membandingkan diri dengan orang lain.', 'Saya merasa belum mengenal diri sendiri.', 'Saya sering cemas tanpa sebab jelas.', 'Saya sulit mengatakan tidak pada ajakan teman.', 'Saya kurang disiplin terhadap janji pribadi.', 'Saya ingin meningkatkan rasa percaya diri.', 'Saya membutuhkan tempat curhat yang aman.'] },
    { code: 'F', title: 'MUDA-MUDI', questions: ['Saya mulai tertarik pada lawan jenis and bingung menyikapinya.', 'Saya pernah merasa terganggu karena urusan pacaran.', 'Saya sulit membatasi komunikasi dengan lawan jenis.', 'Saya merasa hubungan pertemanan lawan jenis mengganggu belajar.', 'Saya takut ditolak oleh teman yang saya sukai.', 'Saya cemburu berlebihan kepada teman dekat.', 'Saya pernah bertengkar karena masalah hubungan muda-mudi.', 'Saya bingung menjaga batas pergaulan yang sehat.', 'Saya pernah mendapat tekanan untuk berpacaran.', 'Saya merasa malu membicarakan perkembangan remaja.', 'Saya kurang memahami perubahan fisik masa remaja.', 'Saya kurang memahami etika pergaulan lawan jenis.', 'Saya pernah menerima pesan yang membuat tidak nyaman.', 'Saya sulit menolak ajakan yang tidak sesuai nilai saya.', 'Saya ingin tahu cara menjaga diri dalam pergaulan.', 'Saya pernah menjadi bahan ejekan terkait hubungan muda-mudi.', 'Saya takut mengecewakan teman dekat.', 'Saya ingin belajar membangun hubungan yang sehat.', 'Saya merasa butuh bimbingan tentang masa pubertas.', 'Saya ingin berkonsultasi tentang pergaulan remaja.'] },
    { code: 'G', title: 'KEHIDUPAN KELUARGA', questions: ['Saya kurang dekat dengan orang tua.', 'Saya sering bertengkar dengan saudara.', 'Saya merasa kurang diperhatikan keluarga.', 'Saya takut bercerita kepada orang tua.', 'Saya sering merasa suasana rumah tidak nyaman.', 'Saya merasa terlalu banyak tuntutan dari keluarga.', 'Saya kurang mendapat dukungan belajar di rumah.', 'Saya sering dimarahi tanpa diberi penjelasan.', 'Saya merasa keluarga kurang memahami saya.', 'Saya sering menyembunyikan masalah dari keluarga.', 'Saya sulit membagi waktu membantu keluarga and belajar.', 'Saya merasa aturan rumah terlalu ketat.', 'Saya merasa kurang bebas menyampaikan pendapat di rumah.', 'Saya pernah melihat konflik serius di rumah.', 'Saya tinggal jauh dari salah satu orang tua.', 'Saya merasa sedih karena kondisi keluarga.', 'Saya ingin hubungan keluarga lebih harmonis.', 'Saya kurang mendapat tempat belajar yang tenang di rumah.', 'Saya merasa tanggung jawab rumah mengganggu sekolah.', 'Saya membutuhkan bantuan terkait masalah keluarga.'] },
    { code: 'H', title: 'AGAMA DAN MORAL', questions: ['Saya jarang beribadah sesuai agama saya.', 'Saya kurang memahami ajaran agama saya.', 'Saya sering melanggar aturan meskipun tahu salah.', 'Saya mudah terpengaruh ajakan negatif teman.', 'Saya pernah berbohong kepada orang tua atau guru.', 'Saya sulit membedakan pergaulan baik and buruk.', 'Saya kurang menghormati orang yang lebih tua.', 'Saya merasa nilai moral saya perlu diperbaiki.', 'Saya pernah mengambil barang tanpa izin.', 'Saya sering berkata kasar.', 'Saya sulit menjaga sopan santun.', 'Saya kurang peduli terhadap kegiatan keagamaan.', 'Saya merasa bersalah setelah melakukan kesalahan.', 'Saya belum konsisten menjalankan kewajiban agama.', 'Saya ingin memperbaiki akhlak/perilaku.', 'Saya sulit meminta maaf setelah salah.', 'Saya pernah mengejek keyakinan atau kebiasaan orang lain.', 'Saya ingin lebih disiplin dalam ibadah.', 'Saya membutuhkan bimbingan nilai moral.', 'Saya ingin menjadi pribadi yang lebih baik.'] },
    { code: 'I', title: 'PENYESUAIAN TERHADAP SEKOLAH', questions: ['Saya belum nyaman dengan lingkungan sekolah.', 'Saya sering terlambat masuk sekolah.', 'Saya kurang memahami tata tertib sekolah.', 'Saya sering takut kepada guru tertentu.', 'Saya merasa sulit mengikuti suasana kelas.', 'Saya kurang akrab dengan teman sekelas.', 'Saya merasa sekolah kurang menyenangkan.', 'Saya sering tidak membawa perlengkapan sekolah.', 'Saya takut bertanya kepada guru.', 'Saya merasa kurang aman di sekolah.', 'Saya pernah mengalami perundungan di sekolah.', 'Saya sulit mengikuti kegiatan upacara atau pembinaan.', 'Saya merasa kurang dikenal oleh guru.', 'Saya sering ingin pulang lebih cepat.', 'Saya kurang berani mengikuti kegiatan sekolah.', 'Saya bingung mencari bantuan saat ada masalah di sekolah.', 'Saya merasa aturan sekolah membebani saya.', 'Saya sering mendapat teguran di sekolah.', 'Saya ingin lebih mudah menyesuaikan diri.', 'Saya membutuhkan bimbingan agar betah di sekolah.'] },
    { code: 'J', title: 'MASA DEPAN DAN CITA-CITA', questions: ['Saya belum mempunyai cita-cita yang jelas.', 'Saya bingung memilih sekolah lanjutan.', 'Saya kurang mengetahui bakat and minat saya.', 'Saya takut gagal meraih cita-cita.', 'Saya belum tahu pekerjaan yang cocok untuk saya.', 'Saya kurang mendapat informasi tentang SMA/SMK.', 'Saya belum punya rencana setelah lulus SMP.', 'Saya merasa cita-cita saya tidak didukung keluarga.', 'Saya kurang percaya diri menghadapi masa depan.', 'Saya bingung menentukan jurusan yang sesuai.', 'Saya belum tahu cara mencapai cita-cita saya.', 'Saya mudah berubah-ubah dalam memilih tujuan.', 'Saya jarang berdiskusi tentang masa depan.', 'Saya merasa nilai pelajaran belum mendukung cita-cita.', 'Saya ingin mengetahui peluang karier di masa depan.', 'Saya bingung memilih antara SMA and SMK.', 'Saya khawatir keadaan ekonomi menghambat cita-cita.', 'Saya belum mengenal potensi diri.', 'Saya membutuhkan konseling karier.', 'Saya ingin menyusun rencana masa depan yang jelas.'] },
    { code: 'K', title: 'PENYESUAIAN TERHADAP KURIKULUM', questions: ['Saya kesulitan mengikuti beberapa mata pelajaran.', 'Saya sulit memahami cara belajar kurikulum sekarang.', 'Saya sering kewalahan dengan tugas sekolah.', 'Saya belum terbiasa belajar mandiri.', 'Saya sulit memahami materi berbasis proyek.', 'Saya kurang mampu mengatur jadwal belajar.', 'Saya sering menunda mengerjakan tugas.', 'Saya sulit memahami instruksi tugas guru.', 'Saya kurang aktif dalam diskusi kelas.', 'Saya kesulitan membuat rangkuman pelajaran.', 'Saya sulit mempersiapkan asesmen/ujian.', 'Saya kurang paham cara menilai kemajuan belajar sendiri.', 'Saya merasa beban pelajaran terlalu berat.', 'Saya kurang memahami penggunaan teknologi pembelajaran.', 'Saya sering lupa jadwal tugas.', 'Saya sulit bekerja dalam tugas kelompok proyek.', 'Saya belum menemukan strategi belajar yang tepat.', 'Saya sering takut nilai saya rendah.', 'Saya ingin meningkatkan motivasi belajar.', 'Saya membutuhkan bantuan menyesuaikan diri dengan kurikulum.'] }
  ];

  const createInitialDcmAnswers = () => DCM_COMPONENTS.reduce<Record<string, 'Ya' | 'Tidak' | ''>>((acc, component) => {
    component.questions.forEach((_, idx) => {
      acc[`${component.code}-${idx + 1}`] = '';
    });
    return acc;
  }, {});

  const [dcmAnswers, setDcmAnswers] = useState<Record<string, 'Ya' | 'Tidak' | ''>>(() => createInitialDcmAnswers());

  // Minat Bakat (RIASEC + Qualitative) States
  const [riasecAnswers, setRiasecAnswers] = useState<Record<string, 'Ya' | 'Tidak' | ''>>({});
  const [citaCita, setCitaCita] = useState('');
  const [guruSenang, setGuruSenang] = useState('');
  const [guruTidakSenang, setGuruTidakSenang] = useState('');

  const RIASEC_COMPONENTS = [
    { code: 'R', title: 'Realistic (Praktis/Teknis)', questions: ['Saya suka bekerja dengan tangan dan peralatan mekanik.', 'Saya senang merakit atau memperbaiki peralatan elektronik.', 'Saya lebih suka kegiatan fisik di luar ruangan.', 'Saya senang menggunakan perkakas atau mesin untuk membuat sesuatu.'] },
    { code: 'I', title: 'Investigative (Penelitian)', questions: ['Saya senang memecahkan masalah matematika atau logika.', 'Saya tertarik mempelajari cara kerja alam atau teknologi.', 'Saya suka melakukan eksperimen atau penelitian kecil.', 'Saya senang membaca artikel tentang sains atau ilmu pengetahuan.'] },
    { code: 'A', title: 'Artistic (Seni/Kreatif)', questions: ['Saya senang menggambar, melukis, atau membuat desain.', 'Saya suka menulis cerita, puisi, atau lirik lagu.', 'Saya tertarik pada pertunjukan seni, drama, atau musik.', 'Saya senang mengekspresikan ide dengan cara yang unik/kreatif.'] },
    { code: 'S', title: 'Social (Sosial/Membantu)', questions: ['Saya senang membantu teman yang sedang dalam kesulitan.', 'Saya tertarik menjadi sukarelawan dalam kegiatan sosial.', 'Saya senang mengajar atau menjelaskan sesuatu kepada orang lain.', 'Saya merasa bahagia ketika bisa bekerja sama dengan orang banyak.'] },
    { code: 'E', title: 'Enterprising (Kepemimpinan/Bisnis)', questions: ['Saya senang memimpin diskusi atau organisasi.', 'Saya tertarik belajar tentang cara memulai bisnis.', 'Saya suka meyakinkan orang lain tentang pendapat saya.', 'Saya senang merencanakan strategi untuk mencapai target/keuntungan.'] },
    { code: 'C', title: 'Conventional (Administratif/Teratur)', questions: ['Saya senang menata dokumen atau barang dengan rapi.', 'Saya suka bekerja dengan data angka yang detail.', 'Saya lebih nyaman bekerja with aturan dan instruksi jelas.', 'Saya senang memastikan segala sesuatu sesuai dengan rencana.'] }
  ];

  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfil(true);
    setTimeout(() => {
      onUpdateProfil(studentData.id, { noHp, alamat });
      setIsSavingProfil(false);
      triggerNotification("Biodata kontak Anda berhasil diperbarui!", "success");
    }, 500);
  };

  const handleSaveQuizGayaBelajar = () => {
    let visual = 0, auditory = 0, kinesthetic = 0;
    Object.values(answers).forEach(val => {
      if (val === 'A') visual++;
      if (val === 'B') auditory++;
      if (val === 'C') kinesthetic++;
    });

    const total = Math.max(Object.keys(answers).length, 1);
    const visPct = Math.round((visual / total) * 100);
    const audPct = Math.round((auditory / total) * 100);
    const kinPct = Math.round((kinesthetic / total) * 100);

    let dominant = 'Visual';
    if (auditory > visual && auditory > kinesthetic) dominant = 'Auditorial';
    if (kinesthetic > visual && kinesthetic > auditory) dominant = 'Kinestetik';

    onAddAsesmen({
      tanggal: new Date().toISOString().split('T')[0],
      nisn: studentData.nisn,
      namaSiswa: studentData.namaSiswa,
      kelas: studentData.kelas,
      jenisAsesmen: 'Tes Gaya Belajar',
      hasil: `Gaya Belajar Dominan: ${dominant.toUpperCase()} (Visual: ${visPct}%, Auditory: ${audPct}%, Kinestetik: ${kinPct}%)`,
      detailSkor: JSON.stringify({ visual, auditory, kinesthetic })
    });

    setActiveQuiz(null);
    setAnswers({});
    setTimeout(() => window.location.reload(), 800);
    triggerNotification("Tes Gaya Belajar mandiri berhasil disimpan!", "success");
  };

  const handleSaveMinatBakat = (e: React.FormEvent) => {
    e.preventDefault();
    
    const unanswered = RIASEC_COMPONENTS.reduce((acc, comp) => {
      return acc + comp.questions.filter((_, idx) => !riasecAnswers[`${comp.code}-${idx + 1}`]).length;
    }, 0);

    if (unanswered > 0) {
      triggerNotification(`Mohon lengkapi ${unanswered} pertanyaan minat bakat yang tersisa.`, "error");
      return;
    }

    if (!citaCita.trim()) {
      triggerNotification("Mohon isi cita-cita Anda.", "error");
      return;
    }

    const skorRiasec = RIASEC_COMPONENTS.map(comp => {
      const ya = comp.questions.filter((_, idx) => riasecAnswers[`${comp.code}-${idx + 1}`] === 'Ya').length;
      return { title: comp.title, ya };
    });
    const dominant = [...skorRiasec].sort((a, b) => b.ya - a.ya)[0];

    onAddAsesmen({
      tanggal: new Date().toISOString().split('T')[0],
      nisn: studentData.nisn,
      namaSiswa: studentData.namaSiswa,
      kelas: studentData.kelas,
      jenisAsesmen: 'Tes Minat Bakat',
      hasil: `Dominan: ${dominant.title}. Cita-cita: ${citaCita}.`,
      detailSkor: JSON.stringify({ skorRiasec, citaCita, guruSenang, guruTidakSenang, jawaban: riasecAnswers })
    });
    setActiveQuiz(null);
    // Force immediate UI update for cards
    setTimeout(() => window.location.reload(), 800);
    triggerNotification("Tes Minat Bakat mandiri berhasil disimpan!", "success");
  };

  const handleSaveDcm = (e: React.FormEvent) => {
    e.preventDefault();
    const unanswered = Object.values(dcmAnswers).filter(a => a === '').length;
    if (unanswered > 0) {
      triggerNotification(`Masih ada ${unanswered} pertanyaan DCM yang belum dijawab.`, "error");
      return;
    }

    const skorPerKomponen = DCM_COMPONENTS.map(component => {
      const ya = component.questions.filter((_, idx) => dcmAnswers[`${component.code}-${idx + 1}`] === 'Ya').length;
      return { title: component.title, ya, total: 20 };
    });
    
    const totalYa = skorPerKomponen.reduce((sum, item) => sum + item.ya, 0);
    const topProblems = [...skorPerKomponen].sort((a, b) => b.ya - a.ya).slice(0, 3);

    onAddAsesmen({
      tanggal: new Date().toISOString().split('T')[0],
      nisn: studentData.nisn,
      namaSiswa: studentData.namaSiswa,
      kelas: studentData.kelas,
      jenisAsesmen: 'Daftar Cek Masalah',
      hasil: `DCM Mandiri: ${totalYa} Masalah. Fokus Utama: ${topProblems.map(p => p.title).join(', ')}.`,
      detailSkor: JSON.stringify({ totalYa, skorPerKomponen, jawaban: dcmAnswers })
    });

    setActiveQuiz(null);
    setTimeout(() => window.location.reload(), 800);
    triggerNotification("Daftar Cek Masalah (DCM) mandiri berhasil disimpan!", "success");
  };



  return (
    <div className="space-y-6">
      
      {/* 1. STUDENT DASHBOARD HOME */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-lg shadow-indigo-650/15">
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
              <User className="w-80 h-80" />
            </div>
            <div className="relative z-10 max-w-xl space-y-2">
              <span className="bg-indigo-600/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Portal BK {identitas.namaSekolah}
              </span>
              <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                Halo, {studentData.namaSiswa}!
              </h1>
              <p className="text-xs text-indigo-150 font-normal leading-relaxed">
                Di sini Anda dapat melihat riwayat konseling Anda, mengecek jadwal pertemuan dengan Guru BK, serta mengisi Asesmen Gaya Belajar atau Minat Bakat secara mandiri.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-6 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Riwayat Konseling</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{myLayanan.length} Pertemuan</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-6 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Asesmen Saya</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{myAsesmen.length} Selesai</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-6 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Jadwal Menunggu</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {myJadwal.filter(j => j.statusKehadiran === 'Menunggu').length} Pertemuan
                </p>
              </div>
            </div>
          </div>

          {/* Quick info about next meeting */}
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-4">
              Jadwal Konseling Terdekat Anda
            </h3>
            {myJadwal.filter(j => j.statusKehadiran === 'Menunggu').length === 0 ? (
              <p className="text-xs text-slate-450">Tidak ada jadwal konseling terdekat yang direncanakan.</p>
            ) : (
              <div className="space-y-4">
                {myJadwal.filter(j => j.statusKehadiran === 'Menunggu').map(j => (
                  <div key={j.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-indigo-50/30 dark:bg-slate-800/80 rounded-2xl border border-indigo-100/30 dark:border-slate-700 text-xs gap-3">
                    <div className="space-y-1">
                      <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-755 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {j.tipeKonseling}
                      </span>
                      <p className="font-bold text-slate-850 dark:text-slate-200">Dengan Guru: {j.namaGuru}</p>
                      <p className="text-slate-500">Membahas: {j.keterangan || '-'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-indigo-650 dark:text-indigo-400">{j.tanggal}</p>
                      <p className="font-semibold text-slate-500">{j.waktu} WIT</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. BIODATA SAYA (PROFIL) */}
      {currentTab === 'profil-siswa' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left card bio summary */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center font-bold text-3xl">
              {studentData.namaSiswa.charAt(0)}
            </div>
            <div>
              <h2 className="font-extrabold text-slate-850 dark:text-slate-200">{studentData.namaSiswa}</h2>
              <span className="text-[11px] text-slate-400 font-bold uppercase">Kelas {studentData.kelas}</span>
            </div>
            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-slate-450">NISN:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-350">{studentData.nisn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Jenis Kelamin:</span>
                <span className="font-bold">{studentData.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Agama:</span>
                <span className="font-bold">{studentData.agama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Orang Tua / Wali:</span>
                <span className="font-bold">{studentData.orangTua}</span>
              </div>
            </div>
          </div>

          {/* Right card update contact */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-4 pb-2 border-b border-slate-50 dark:border-slate-850">
              Perbarui Informasi Kontak Saya
            </h3>
            
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">
                  No. HP / WhatsApp Siswa*
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Contoh: 0812345678"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Alamat Lengkap Rumah*
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200"
                    placeholder="Alamat lengkap RT/RW, Wagom, Fakfak"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSavingProfil}
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfil ? 'Menyimpan...' : 'Simpan Kontak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RIWAYAT LAYANAN */}
      {currentTab === 'layanan-siswa' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-6">
            Riwayat Layanan Konseling & Bimbingan Saya
          </h3>

          {myLayanan.length === 0 ? (
            <div className="text-center py-12 text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-xs">
              Belum ada riwayat layanan bimbingan konseling tercatat untuk Anda.
            </div>
          ) : (
            <div className="relative border-l border-indigo-100 dark:border-slate-800 pl-6 space-y-6">
              {myLayanan.map((l) => (
                <div key={l.id} className="relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 shadow-md" />
                  
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 max-w-2xl">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        {l.jenisLayanan}
                      </span>
                      <span className="font-mono text-slate-450 text-[10px]">{l.tanggal}</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Pokok Bahasan / Jurnal:</p>
                    <p className="text-slate-655 dark:text-slate-350 leading-relaxed font-normal">{l.uraian}</p>
                    {l.dokumenNama && (
                      <div className="pt-2 border-t border-slate-100/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                        Dokumen: <span className="font-bold text-indigo-600 dark:text-indigo-400">{l.dokumenNama}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ASESMEN MANDIRI */}
      {currentTab === 'asesmen-siswa' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-4">
              Lakukan Asesmen BK Mandiri
            </h3>
            
            {(() => {
              const hasGayaBelajar = myAsesmen.some(a => a.jenisAsesmen === 'Tes Gaya Belajar');
              const hasDCM = myAsesmen.some(a => a.jenisAsesmen === 'Daftar Cek Masalah');
              const hasMinatBakat = myAsesmen.some(a => a.jenisAsesmen === 'Tes Minat Bakat');
              const allDone = hasGayaBelajar && hasDCM && hasMinatBakat;

              if (allDone && !activeQuiz) {
                return (
                  <div className="py-16 px-6 text-center space-y-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-[40px] animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                      <CheckCircle2 className="w-16 h-16" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="text-2xl font-black text-emerald-800 dark:text-emerald-200">Selesai!</h4>
                      <p className="text-base text-emerald-700 dark:text-emerald-400 font-bold tracking-tight">
                        Anda telah mengisi semua Asesmen BK Mandiri.
                      </p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-500 font-medium">
                        Terima kasih telah berpartisipasi. Data Anda telah tersimpan aman secara permanen di database sekolah untuk membantu bimbingan masa depan Anda.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Style Belajar */}
                  {!hasGayaBelajar && (
                    <div className="border border-slate-200 dark:border-slate-805 p-5 rounded-2xl space-y-3.5 transition-all hover:shadow-md">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl inline-block">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-205 text-sm">Tes Gaya Belajar</h4>
                        <p className="text-[11px] text-slate-455 leading-relaxed mt-1">Cari tahu tipe belajar dominan Anda (Visual, Auditorial, atau Kinestetik) dengan kuesioner singkat.</p>
                      </div>
                      <button 
                        onClick={() => { setActiveQuiz('style'); setQuizStep(0); setAnswers({}); }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mulai Tes Gaya Belajar
                      </button>
                    </div>
                  )}

                  {/* Card 2: DCM */}
                  {!hasDCM && (
                    <div className="border border-slate-200 dark:border-slate-805 p-5 rounded-2xl space-y-3.5 transition-all hover:shadow-md">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl inline-block">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-205 text-sm">Tes DCM</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed mt-1">Lengkapi 220 pertanyaan Daftar Cek Masalah (DCM) untuk membantu konselor BK memahami Anda.</p>
                      </div>
                      <button 
                        onClick={() => { setActiveQuiz('dcm'); setDcmAnswers(createInitialDcmAnswers()); }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mulai Tes DCM
                      </button>
                    </div>
                  )}

                  {/* Card 3: Minat Bakat */}
                  {!hasMinatBakat && (
                    <div className="border border-slate-200 dark:border-slate-805 p-5 rounded-2xl space-y-3.5 transition-all hover:shadow-md">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl inline-block">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-205 text-sm">Tes Minat Bakat</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed mt-1">Isi kuesioner RIASEC dan aspirasi cita-cita Anda untuk rekomendasi karir masa depan.</p>
                      </div>
                      <button 
                        onClick={() => { 
                          setActiveQuiz('minat'); 
                          setRiasecAnswers({}); 
                          setCitaCita(''); 
                          setGuruSenang(''); 
                          setGuruTidakSenang('');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mulai Tes Minat Bakat
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ACTIVE QUIZ WIZARD DRAWER */}
          {activeQuiz === 'style' && (
            <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 rounded-3xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-indigo-755 dark:text-indigo-300">Pengisian: Tes Gaya Belajar Mandiri</h3>
                <button 
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Batalkan Tes
                </button>
              </div>

              {/* Questions wrapper */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-850 dark:text-slate-300">
                  {styleQuestions[quizStep].q}
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: styleQuestions[quizStep].a, val: 'A' },
                    { label: styleQuestions[quizStep].b, val: 'B' },
                    { label: styleQuestions[quizStep].c, val: 'C' }
                  ].map(opt => (
                    <label key={opt.val} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40 ${answers[quizStep] === opt.val ? 'border-indigo-500 bg-indigo-50/10 text-indigo-750 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input 
                        type="radio" 
                        name={`student-quiz-${quizStep}`}
                        checked={answers[quizStep] === opt.val}
                        onChange={() => setAnswers({ ...answers, [quizStep]: opt.val })}
                        className="text-indigo-650"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    disabled={quizStep === 0}
                    onClick={() => setQuizStep(p => p - 1)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
                  >
                    Kembali
                  </button>
                  {quizStep < styleQuestions.length - 1 ? (
                    <button
                      disabled={!answers[quizStep]}
                      onClick={() => setQuizStep(p => p + 1)}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Pertanyaan Berikutnya
                    </button>
                  ) : (
                    <button
                      disabled={!answers[quizStep]}
                      onClick={handleSaveQuizGayaBelajar}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Simpan & Kirim Tes
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeQuiz === 'dcm' && (
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-3xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-rose-755 dark:text-rose-300">Pengisian: Daftar Cek Masalah (DCM) Mandiri</h3>
                <button 
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Batalkan Tes
                </button>
              </div>

              <form onSubmit={handleSaveDcm} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-500">
                    Progres Pengisian: {Object.values(dcmAnswers).filter(a => a !== '').length} / 220 Pertanyaan
                  </div>
                </div>

                <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {DCM_COMPONENTS.map(comp => (
                    <div key={comp.code} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-rose-50 dark:bg-slate-850 px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wide">{comp.code}. {comp.title}</span>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {comp.questions.map((q, idx) => {
                          const key = `${comp.code}-${idx + 1}`;
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 text-[11px]">
                              <p className="font-medium text-slate-655 dark:text-slate-350">{idx + 1}. {q}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                {(['Ya', 'Tidak'] as const).map(opt => (
                                  <label key={opt} className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${dcmAnswers[key] === opt ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                    <input type="radio" name={`dcm-s-${key}`} checked={dcmAnswers[key] === opt} onChange={() => setDcmAnswers(prev => ({...prev, [key]: opt}))} className="text-rose-600 w-3 h-3" required />
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

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/10 transition-all cursor-pointer">
                    Simpan & Kirim DCM
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeQuiz === 'minat' && (
            <div className="bg-white dark:bg-slate-900 border border-emerald-250 dark:border-slate-800 rounded-3xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-805">
                <h3 className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">Pengisian: Tes Minat Bakat Karir Mandiri</h3>
                <button 
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs text-rose-650 hover:underline font-bold"
                >
                  Batalkan Tes
                </button>
              </div>

              <form onSubmit={handleSaveMinatBakat} className="space-y-6">
                {/* Qualitative Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aspirasi Saya</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">1. Apa cita-citamu?*</label>
                      <input type="text" value={citaCita} onChange={(e) => setCitaCita(e.target.value)} className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500" placeholder="Cita-cita saya adalah..." required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">2. Guru siapa yang paling kamu senang cara mengajarnya di kelas?</label>
                      <input type="text" value={guruSenang} onChange={(e) => setGuruSenang(e.target.value)} className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500" placeholder="Nama Guru" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">3. Guru siapa yang paling kamu tidak senang cara mengajarnya di kelas?</label>
                      <input type="text" value={guruTidakSenang} onChange={(e) => setGuruTidakSenang(e.target.value)} className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500" placeholder="Nama Guru" />
                    </div>
                  </div>
                </div>

                {/* RIASEC Section */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {RIASEC_COMPONENTS.map(comp => (
                    <div key={comp.code} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{comp.title}</span>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {comp.questions.map((q, idx) => {
                          const key = `${comp.code}-${idx + 1}`;
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 text-[11px]">
                              <p className="font-medium text-slate-655 dark:text-slate-350">{idx + 1}. {q}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                {(['Ya', 'Tidak'] as const).map(opt => (
                                  <label key={opt} className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${riasecAnswers[key] === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                    <input type="radio" name={`riasec-s-${key}`} checked={riasecAnswers[key] === opt} onChange={() => setRiasecAnswers(prev => ({...prev, [key]: opt}))} className="text-emerald-600 w-3 h-3" required />
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

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button type="button" onClick={() => setActiveQuiz(null)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer">Simpan & Kirim Tes</button>
                </div>
              </form>
            </div>
          )}

          {/* List of my previous assessment results */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-4">
              Daftar Riwayat Asesmen Mandiri Saya
            </h3>

            {myAsesmen.length === 0 ? (
              <p className="text-xs text-slate-450">Belum ada hasil analisis asesmen tersimpan.</p>
            ) : (
              <div className="space-y-3.5">
                {myAsesmen.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[10px] text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
                        {a.jenisAsesmen}
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">{a.tanggal}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-655 dark:text-slate-350">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p>{a.hasil}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. JADWAL SAYA */}
      {currentTab === 'jadwal-siswa' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-4">
            Daftar Jadwal Konseling Saya
          </h3>

          {myJadwal.length === 0 ? (
            <div className="text-center py-12 text-slate-450 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl text-xs">
              Tidak ada janji temu / jadwal konseling terdaftar untuk Anda saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {myJadwal.map((j) => (
                <div key={j.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-slate-700 text-indigo-755 dark:text-indigo-300 rounded font-bold uppercase text-[9px]">
                        {j.tipeKonseling}
                      </span>
                      <span className={`
                        px-2 py-0.5 rounded uppercase font-bold text-[9px]
                        ${j.statusKehadiran === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                          j.statusKehadiran === 'Reschedule' ? 'bg-amber-100 text-amber-800' :
                          j.statusKehadiran === 'Tidak Hadir' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-600'}
                      `}>
                        {j.statusKehadiran}
                      </span>
                    </div>
                    <p className="font-bold text-slate-850 dark:text-slate-200">Dengan Guru: {j.namaGuru}</p>
                    <p className="text-slate-500 font-normal">Keterangan: {j.keterangan || '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-indigo-650 dark:text-indigo-400">{j.tanggal}</p>
                    <p className="text-slate-455 font-semibold">{j.waktu} WIT</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
