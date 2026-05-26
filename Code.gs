/**
 * LAYANAN BK SATU DATA - BACKEND GOOGLE APPS SCRIPT (FINAL VERSION)
 * Sekolah: SMP NEGERI 4 FAKFAK
 * 
 * Petunjuk:
 * 1. Hapus semua kode di editor Apps Script Anda.
 * 2. Tempel seluruh kode di bawah ini.
 * 3. Klik Simpan.
 * 4. Jalankan fungsi 'setup' untuk membuat 21 sheet otomatis.
 * 5. Terapkan (Deploy) sebagai Aplikasi Web.
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
 */
function setup() {
  initDatabase();
  SpreadsheetApp.getUi().alert('✅ Inisialisasi Database Berhasil! 21 sheet data telah dibuat.');
}

/**
 * Helper untuk response JSON (Bebas Error CORS)
 */
function corsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handler untuk HTTP GET requests
 */
function doGet(e) {
  // Endpoint untuk ping/status
  if (e && e.parameter && e.parameter.action === 'ping') {
    return corsResponse({ status: "success", message: "Koneksi Aktif!" });
  }
  
  const action = e.parameter.action;
  
  // Tampilkan informasi API jika tidak ada action
  if (!action) {
    return HtmlService.createHtmlOutput(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4F46E5;">LAYANAN BK SATU DATA API</h1>
        <p style="color: #666;">Backend Google Apps Script telah aktif dan berjalan dengan sukses.</p>
        <p style="color: #666;">Salin URL ini dan masukkan ke menu <b>Pengaturan</b> di aplikasi utama.</p>
      </div>
    `);
  }
  
  try {
    initDatabase();
    
    if (action === 'readAll') {
      return corsResponse({ status: "success", data: readAllRecords(e.parameter.sheetName) });
    }
    
    if (action === 'getIdentitas') {
      return corsResponse({ status: "success", data: getIdentitasSekolah() });
    }
    
    return corsResponse({ status: "error", message: "Aksi tidak dikenal" });
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Handler untuk HTTP POST requests
 */
function doPost(e) {
  try {
    initDatabase();
    let postData;
    
    // Parse data dari POST request
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }
    
    const action = postData.action;
    const sheetName = postData.sheetName;
    
    // Router untuk berbagai action
    switch (action) {
      case 'saveIdentitas':
        saveIdentitasSekolah(postData.data);
        return corsResponse({ status: "success", message: "Identitas disimpan" });
        
      case 'create':
        const createResult = createRecord(sheetName, postData.data);
        return corsResponse({ status: "success", data: createResult });
        
      case 'update':
        const updateResult = updateRecord(sheetName, postData.id, postData.data);
        return corsResponse({ status: "success", data: updateResult });
        
      case 'delete':
        deleteRecord(sheetName, postData.id);
        return corsResponse({ status: "success", message: "Terhapus" });
        
      case 'importSiswa':
        importSiswaBatch(postData.data);
        return corsResponse({ status: "success", message: "Import Berhasil" });
        
      case 'resetModule':
        resetModuleSheet(postData.moduleName);
        return corsResponse({ status: "success", message: "Data dibersihkan" });
        
      default:
        return corsResponse({ status: "error", message: "Aksi POST tidak dikenal" });
    }
  } catch (err) {
    return corsResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Inisialisasi Database dan Membuat Sheet
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    "Identitas": ["Key", "Value"],
    "Siswa": ["id", "nisn", "namaSiswa", "kelas", "jk", "agama", "orangTua", "alamat", "noHp", "createdAt"],
    "GuruBK": ["id", "nip", "nama", "jk", "jabatan", "noHp", "email", "createdAt"],
    "Kelas": ["id", "namaKelas", "tingkat", "waliKelas", "createdAt"],
    
    // Layanan Bimbingan dan Konseling
    "Layanan_Klasikal": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Belajar": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Pribadi": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Sosial": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Bimbingan_Karier": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Konseling_Individual": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    "Layanan_Konseling_Kelompok": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "topik", "konselor", "uraian", "hasil", "absensi", "dokumenUrl", "dokumenNama", "createdAt"],
    
    // Asesmen
    "Asesmen_Catatan_Anekdot": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "lokasi", "pencatat", "peristiwa", "interpretasi", "tindakLanjut", "createdAt"],
    "Asesmen_Daftar_Cek_Masalah": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    "Asesmen_Tes_Gaya_Belajar": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    "Asesmen_Tes_Minat_Bakat": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "hasil", "detailSkor", "createdAt"],
    
    // Surat Menyurat
    "Surat_Panggilan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    "Surat_Pernyataan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    "Surat_Keterangan": ["id", "nomorSurat", "tanggal", "nisn", "namaSiswa", "kelas", "detail", "createdAt"],
    
    // Jadwal dan Kasus
    "Jadwal_Konseling": ["id", "tanggal", "waktu", "nisn", "namaSiswa", "kelas", "nipGuru", "namaGuru", "tipeKonseling", "statusKehadiran", "keterangan", "createdAt"],
    "Buku_Kasus": ["id", "tanggal", "nisn", "namaSiswa", "kelas", "jenisKasus", "status", "deskripsiKasus", "tindakLanjut", "buktiUrl", "buktiNama", "createdAt"],
    "Home_Visit": ["id", "tanggalKunjungan", "nisn", "namaSiswa", "kelas", "petugas", "tujuanKunjungan", "alamat", "temuan", "rekomendasi", "dokumentasiUrl", "dokumentasiNama", "createdAt"]
  };
  
  // Buat atau update setiap sheet
  for (let name in sheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      formatHeaderRow(sheet, sheets[name].length);
    }
  }
}

/**
 * Format Header Row dengan styling
 */
function formatHeaderRow(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight("bold")
    .setBackground("#4F46E5")
    .setFontColor("#FFFFFF");
}

/**
 * Membaca semua records dari sheet
 */
function readAllRecords(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
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

/**
 * Membuat record baru
 */
function createRecord(sheetName, recordData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    initDatabase();
    return createRecord(sheetName, recordData);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate ID jika tidak ada
  if (!recordData.id) {
    recordData.id = "ID-" + Utilities.getUuid().substring(0, 8);
  }
  
  recordData.createdAt = new Date().toISOString();
  const newRow = headers.map(h => recordData[h] !== undefined ? recordData[h] : "");
  
  sheet.appendRow(newRow);
  return recordData;
}

/**
 * Update record yang sudah ada
 */
function updateRecord(sheetName, id, recordData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      headers.forEach((h, j) => {
        if (h !== "id" && recordData[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(recordData[h]);
        }
      });
      return recordData;
    }
  }
  
  throw new Error("Data tidak ditemukan");
}

/**
 * Hapus record
 */
function deleteRecord(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf("id");
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  
  return false;
}

/**
 * Import Siswa dalam batch
 */
function importSiswaBatch(list) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Siswa");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  list.forEach(s => {
    s.id = s.nisn;
    s.createdAt = new Date().toISOString();
    sheet.appendRow(headers.map(h => s[h] || ""));
  });
}

/**
 * Reset/Bersihkan data sheet tertentu
 */
function resetModuleSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.clear().appendRow(headers);
  formatHeaderRow(sheet, headers.length);
}

/**
 * Ambil data identitas sekolah
 */
function getIdentitasSekolah() {
  const records = readAllRecords("Identitas");
  const config = {};
  
  records.forEach(r => config[r.Key] = r.Value);
  return config;
}

/**
 * Simpan data identitas sekolah
 */
function saveIdentitasSekolah(config) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Identitas");
  sheet.clear().appendRow(["Key", "Value"]);
  
  for (let key in config) {
    sheet.appendRow([key, config[key]]);
  }
}
