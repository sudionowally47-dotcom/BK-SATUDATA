export const CODE_GS = `/**
 * LAYANAN BK SATU DATA - BACKEND GOOGLE APPS SCRIPT
 * Sekolah: SMP NEGERI 4 FAKFAK
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets baru.
 * 2. Klik menu Ekstensi -> Apps Script.
 * 3. Hapus kode bawaan, lalu paste kode ini.
 * 4. Simpan proyek dengan nama "Layanan BK Satu Data Backend".
 * 5. Klik Penerapan (Deploy) -> Penerapan Baru (New Deployment).
 * 6. Pilih Jenis: Aplikasi Web (Web App).
 * 7. Konfigurasi:
 *    - Jalankan sebagai: Saya (Urusan Anda / Me).
 *    - Siapa yang memiliki akses: Siapa saja (Anyone).
 * 8. Klik Terapkan, berikan izin akses (Authorize), lalu salin URL Aplikasi Web.
 * 9. Paste URL tersebut di menu Pengaturan Aplikasi ini.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * Menu otomatis saat Spreadsheet dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 BK SATU DATA')
    .addItem('Inisialisasi / Buat Sheet Baru', 'setup')
    .addItem('Sinkronisasi Identitas', 'initDatabase')
    .addToUi();
}

/**
 * Fungsi Setup Utama
 * Jalankan fungsi ini dari Editor Apps Script jika sheet belum muncul
 */
function setup() {
  initDatabase();
  SpreadsheetApp.getUi().alert('✅ Inisialisasi Database Berhasil! Semua sheet data telah dibuat.');
}

// CORS Response helper
function corsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Handle preflight options request
  if (e && e.parameter && e.parameter.action === 'ping') {
    return corsResponse({ status: "success", message: "Koneksi BK Satu Data Aktif!" });
  }
  
  const action = e.parameter.action;
  if (!action) {
    return HtmlService.createHtmlOutput(\`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4F46E5;">LAYANAN BK SATU DATA API</h1>
        <p style="color: #666;">Backend Google Apps Script telah aktif dan berjalan dengan sukses.</p>
        <p style="color: #666;">Salin URL di browser Anda dan masukkan ke menu <b>Pengaturan</b> di aplikasi utama.</p>
      </div>
    \`);
  }
  
  try {
    initDatabase(); // Pastikan spreadsheet siap
    
    if (action === 'readAll') {
      const sheetName = e.parameter.sheetName;
      const data = readAllRecords(sheetName);
      return corsResponse({ status: "success", data: data });
    }
    
    if (action === 'getIdentitas') {
      const data = getIdentitasSekolah();
      return corsResponse({ status: "success", data: data });
    }

    return corsResponse({ status: "error", message: "Action tidak dikenal" });
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Handle Preflight OPTIONS
 */
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function doPost(e) {
  try {
    initDatabase();
    
    let postData;
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter;
      }
    } else if (e && e.parameter && e.parameter.action) {
      postData = e.parameter;
    } else {
      throw new Error("Payload (data) tidak ditemukan.");
    }
    
    const action = postData.action;
    if (!action) {
      return corsResponse({ status: "error", message: "Action (aksi) diperlukan." });
    }
    
    // 1. Simpan/Update Identitas Sekolah
    if (action === 'saveIdentitas') {
      saveIdentitasSekolah(postData.data);
      return corsResponse({ status: "success", message: "Identitas sekolah berhasil disimpan" });
    }
    
    // 2. CRUD Records
    const sheetName = postData.sheetName;
    if (action === 'create') {
      const result = createRecord(sheetName, postData.data);
      return corsResponse({ status: "success", data: result, message: "Data berhasil ditambahkan" });
    }
    
    if (action === 'update') {
      const result = updateRecord(sheetName, postData.id, postData.data);
      return corsResponse({ status: "success", data: result, message: "Data berhasil diperbarui" });
    }
    
    if (action === 'delete') {
      deleteRecord(sheetName, postData.id);
      return corsResponse({ status: "success", message: "Data berhasil dihapus" });
    }
    
    if (action === 'importSiswa') {
      const count = importSiswaBatch(postData.data);
      return corsResponse({ status: "success", message: count + " data siswa berhasil diimport" });
    }
    
    if (action === 'resetModule') {
      resetModuleSheet(postData.moduleName);
      return corsResponse({ status: "success", message: "Data modul " + postData.moduleName + " berhasil dibersihkan" });
    }
    
    return corsResponse({ status: "error", message: "Action POST tidak dikenal" });
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}

// Inisialisasi Database Spreadsheet (21 Sheet Otomatis)
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = {
    // 1-4: Master Data
    "Identitas": ["Key", "Value"],
    "Siswa": ["id", "nisn", "namaSiswa", "kelas", "jk", "agama", "orangTua", "alamat", "noHp", "createdAt"],
    "GuruBK": ["id", "nip", "nama", "jk", "jabatan", "noHp", "email", "createdAt"],
    "Kelas": ["id", "namaKelas", "tingkat", "waliKelas", "createdAt"],
    
    // 5-11: Submenu Layanan BK
    "Layanan_Klasikal": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Belajar": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Pribadi": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Sosial": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Karier": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Konseling_Individual": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Konseling_Kelompok": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    
    // 12-15: Submenu Asesmen
    "Asesmen_Catatan_Anekdot": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "lokasi", "pencatat", "peristiwa", "interpretasi", "tindakLanjut", "createdAt"],
    "Asesmen_Daftar_Cek_Masalah": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    "Asesmen_Tes_Gaya_Belajar": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    "Asesmen_Tes_Minat_Bakat": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    
    // 16-18: Administrasi Surat
    "Surat_Panggilan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    "Surat_Pernyataan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    "Surat_Keterangan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    
    // 19-21: Penunjang Lainnya
    "Jadwal_Konseling": ["id", "tanggal", "waktu", "nisn", "namaSiswa", "kelas", "nipGuru", "namaGuru", "tipeKonseling", "statusKehadiran", "keterangan", "createdAt"],
    "Buku_Kasus": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "jenisKasus", "status", "deskripsiKasus", "tindakLanjut", "buktiUrl", "buktiNama", "createdAt"],
    "Home_Visit": ["id", "tanggalKunjungan", "nisn", "namaSiswa", "kelas", "petugas", "tujuanKunjungan", "alamat", "temuan", "rekomendasi", "dokumentasiUrl", "dokumentasiNama", "createdAt"]
  };
  
  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      // Format Header
      sheet.getRange(1, 1, 1, sheets[sheetName].length)
        .setFontWeight("bold")
        .setBackground("#4F46E5")
        .setFontColor("#FFFFFF");
    }
  }
}

// CRUD: Read
function readAllRecords(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j];
    }
    records.push(record);
  }
  return records;
}

// CRUD: Create
function createRecord(sheetName, recordData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initDatabase();
    return createRecord(sheetName, recordData);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Keamanan Anti-Duplicate (untuk siswa berdasarkan NISN, Guru berdasarkan NIP)
  if (sheetName === 'Siswa') {
    const existing = readAllRecords('Siswa');
    const isDuplicate = existing.some(s => s.nisn === recordData.nisn);
    if (isDuplicate) throw new Error("Siswa dengan NISN " + recordData.nisn + " sudah terdaftar!");
    recordData.id = recordData.nisn;
  } else if (sheetName === 'GuruBK') {
    const existing = readAllRecords('GuruBK');
    const isDuplicate = existing.some(g => g.nip === recordData.nip);
    if (isDuplicate) throw new Error("Guru dengan NIP " + recordData.nip + " sudah terdaftar!");
    recordData.id = recordData.nip;
  } else if (sheetName === 'Kelas') {
    const existing = readAllRecords('Kelas');
    const isDuplicate = existing.some(k => k.namaKelas === recordData.namaKelas);
    if (isDuplicate) throw new Error("Kelas " + recordData.namaKelas + " sudah terdaftar!");
    recordData.id = recordData.namaKelas;
  } else if (!recordData.id) {
    recordData.id = "ID-" + Utilities.getUuid().substring(0, 8);
  }
  
  recordData.createdAt = new Date().toISOString();
  
  const newRow = headers.map(header => {
    return recordData[header] !== undefined ? recordData[header] : "";
  });
  
  sheet.appendRow(newRow);
  return recordData;
}

// CRUD: Update
function updateRecord(sheetName, id, recordData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIndex = headers.indexOf("id");
  
  if (idColIndex === -1) throw new Error("Kolom ID tidak ditemukan");
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(id)) {
      rowIndex = i + 1; // 1-based index + header row
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("Data dengan ID " + id + " tidak ditemukan");
  
  // Update fields
  headers.forEach((header, colIndex) => {
    if (header !== "id" && header !== "createdAt" && recordData[header] !== undefined) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(recordData[header]);
    }
  });
  
  return { id: id, ...recordData };
}

// CRUD: Delete
function deleteRecord(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIndex = headers.indexOf("id");
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("Data dengan ID " + id + " tidak ditemukan");
  
  sheet.deleteRow(rowIndex);
  return true;
}

// Import Siswa Batch
function importSiswaBatch(siswaList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Siswa");
  const existing = readAllRecords("Siswa");
  const existingNisns = new Set(existing.map(s => String(s.nisn)));
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let importedCount = 0;
  
  siswaList.forEach(siswa => {
    if (existingNisns.has(String(siswa.nisn))) return; // Skip duplicate
    
    siswa.id = String(siswa.nisn);
    siswa.createdAt = new Date().toISOString();
    
    const row = headers.map(h => siswa[h] !== undefined ? siswa[h] : "");
    sheet.appendRow(row);
    existingNisns.add(String(siswa.nisn));
    importedCount++;
  });
  
  return importedCount;
}

// Reset data per module
function resetModuleSheet(moduleName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(moduleName);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#4F46E5")
    .setFontColor("#FFFFFF");
}

// Save/Get Identitas Sekolah
function getIdentitasSekolah() {
  const records = readAllRecords("Identitas");
  const config = {};
  records.forEach(r => {
    config[r.Key] = r.Value;
  });
  return config;
}

function saveIdentitasSekolah(configObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Identitas");
  sheet.clear();
  sheet.appendRow(["Key", "Value"]);
  sheet.getRange(1, 1, 1, 2)
    .setFontWeight("bold")
    .setBackground("#4F46E5")
    .setFontColor("#FFFFFF");
    
  for (let key in configObj) {
    sheet.appendRow([key, configObj[key]]);
  }
}
`;



export const DOKUMENTASI_SETUP = `### DOKUMENTASI INSTALASI & SETUP BACKEND

#### A. Persiapan Google Spreadsheet & Google Apps Script
1. Buka [Google Sheets](https://sheets.google.com) dan buat sebuah Spreadsheet baru.
2. Namai spreadsheet tersebut, misalnya: **Database Layanan BK SMPN 4 Fakfak**.
3. Di bilah menu atas, klik **Ekstensi** > **Apps Script**.
4. Di editor Apps Script, hapus semua kode bawaan di file \`Code.gs\`.
5. Salin seluruh isi dari tab **Source Code (Code.gs)** di atas, lalu tempelkan (paste) ke dalam file \`Code.gs\` Anda.
6. Klik ikon **Simpan** (Floppy Disk) di bagian atas editor.
7. **Penting**: Pada toolbar di atas, pilih fungsi **setup**, lalu klik tombol **Run** (Ikon ▶️). Ini akan membuat semua sheet database secara otomatis. Berikan izin akses (Authorize) jika diminta.
8. Simpan kembali seluruh proyek Anda. (Anda hanya memerlukan SATU file \`Code.gs\`).

#### B. Melakukan Deployment Sebagai Web App
1. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas editor Apps Script, lalu pilih **Penerapan baru (New deployment)**.
2. Di jendela pop-up, klik ikon **Gigi Roda (Pilih jenis)** lalu pilih **Aplikasi web (Web app)**.
3. Konfigurasikan detail penerapan berikut:
   - **Deskripsi**: Versi 1.0.0
   - **Jalankan sebagai (Execute as)**: Pilih **Saya (email-anda@gmail.com)**.
   - **Siapa yang memiliki akses (Who has access)**: Pilih **Siapa saja (Anyone)**. Hal ini wajib.
4. Klik **Terapkan (Deploy)**.
5. Salin **URL Aplikasi Web (Web App URL)** yang dihasilkan.

**CATATAN PENTING**: Jika Anda mengubah kode di \`Code.gs\`, Anda **WAJIB** melakukan **Terapkan (Deploy) > Kelola Penerapan (Manage deployments) > Edit (ikon pensil) > Pilih Versi: Versi Baru** agar perubahan tersimpan. Jika tidak, URL lama akan tetap menjalankan kode yang lama.

#### C. Menghubungkan ke Aplikasi Frontend (React)
1. Buka aplikasi **Layanan BK Satu Data** ini di peramban Anda.
2. Masuk sebagai Admin (Username: \`admin\`, Password: \`admin55\`).
3. Masuk ke menu **Pengaturan** di sidebar sebelah kiri.
4. Pada bagian **API & Google Apps Script Setup**, temukan kolom input **URL Google Apps Script Web App**.
5. Tempelkan URL yang sudah Anda salin tadi ke kolom tersebut.
6. Klik **Simpan URL & Tes Koneksi**.
7. Sistem akan secara otomatis menguji koneksi. Jika sukses, maka seluruh data di Google Sheets akan sinkron secara real-time dua arah!

#### D. Keuntungan Metode ini:
- **Tahan Lama**: Data Anda tidak akan hilang meskipun riwayat peramban dibersihkan karena tersimpan di cloud spreadsheet Anda sendiri.
- **Gratis Selamanya**: Google Apps Script & Sheets disediakan tanpa biaya oleh Google.
- **Mudah Dipantau**: Kepala Sekolah atau Guru BK lainnya bisa membuka file Google Spreadsheet secara langsung untuk melihat data mentah.
`;
