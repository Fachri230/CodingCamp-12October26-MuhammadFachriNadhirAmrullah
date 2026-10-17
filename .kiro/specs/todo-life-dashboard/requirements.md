# Requirements Document

## Introduction

To-Do List Life Dashboard adalah aplikasi web personal yang membantu pengguna mengatur aktivitas harian melalui satu halaman dashboard yang modern, minimalis, dan responsif. Aplikasi ini dibangun murni dengan HTML, CSS, dan Vanilla JavaScript tanpa framework, tidak memerlukan backend, dan menyimpan seluruh data di sisi klien menggunakan Browser Local Storage API. Dashboard mencakup lima fitur utama: Greeting & Clock, Focus Timer, To-Do List, Quick Links, dan Light/Dark Mode.

## Glossary

- **Dashboard**: Halaman tunggal (`index.html`) yang menampilkan seluruh fitur aplikasi.
- **Clock_Widget**: Komponen yang menampilkan waktu, tanggal, dan sapaan dinamis.
- **Focus_Timer**: Komponen timer hitung mundur 25 menit untuk sesi fokus kerja.
- **Todo_Manager**: Komponen yang mengelola daftar tugas pengguna.
- **Todo_Item**: Satu entri tugas yang memiliki teks, status selesai, dan pengenal unik.
- **Quick_Links_Manager**: Komponen yang mengelola kumpulan tautan favorit pengguna.
- **Quick_Link**: Satu entri tautan yang memiliki label dan URL.
- **Theme_Controller**: Komponen yang mengelola preferensi tema terang/gelap.
- **Local_Storage**: Browser Local Storage API yang digunakan sebagai mekanisme persistensi data.
- **Storage_Module**: Lapisan abstraksi JavaScript yang membungkus operasi baca/tulis ke Local_Storage.
- **Validator**: Modul JavaScript yang memvalidasi input pengguna sebelum diproses.
- **User**: Pengguna akhir yang berinteraksi dengan Dashboard melalui browser.

---

## Requirements

### Requirement 1: Inisialisasi Aplikasi & Kompatibilitas Browser

**User Story:** As a User, I want the dashboard to load correctly in all major modern browsers, so that I can access my personal dashboard regardless of which browser I use.

#### Acceptance Criteria

1. THE Dashboard SHALL berjalan tanpa uncaught JavaScript exception dan tanpa resource load failure di versi terbaru (N) dan satu versi sebelumnya (N-1) dari Chrome, Firefox, Edge, dan Safari.
2. THE Dashboard SHALL dimuat hanya dari satu file `index.html`, satu file `css/style.css`, dan satu file `js/script.js` tanpa dependensi eksternal yang memerlukan koneksi server atau CDN.
3. WHEN halaman dimuat, THE Dashboard SHALL membaca semua data yang tersimpan dari Local_Storage dan merender seluruh section UI (Clock_Widget, Focus_Timer, Todo_Manager, Quick_Links_Manager) sebelum interaksi pertama pengguna.
4. IF Local_Storage tidak tersedia atau diblokir oleh browser, THEN THE Storage_Module SHALL menampilkan pesan peringatan yang terlihat oleh User di bagian atas halaman bahwa fitur penyimpanan data tidak aktif, dan aplikasi tetap dapat digunakan tanpa persistensi.
5. THE Dashboard SHALL menampilkan layout yang seluruh konten utamanya dapat dibaca tanpa horizontal scrolling pada lebar layar 320px, 768px, 1024px, dan 1920px.

---

### Requirement 2: Greeting & Clock Widget

**User Story:** As a User, I want to see the current time, date, and a personalized greeting, so that I get a contextual overview when I open my dashboard.

#### Acceptance Criteria

1. THE Clock_Widget SHALL menampilkan waktu saat ini dengan format `HH:MM:SS` (24 jam, zero-padded) dan nilai yang ditampilkan diperbarui setiap detik berdasarkan jam lokal perangkat.
2. THE Clock_Widget SHALL menampilkan tanggal saat ini dengan format nama hari, tanggal, nama bulan, dan tahun dalam Bahasa Indonesia (contoh: "Jumat, 17 Oktober 2026").
3. WHEN jam lokal perangkat berada antara 05:00–11:59, THE Clock_Widget SHALL menampilkan sapaan "Selamat Pagi".
4. WHEN jam lokal perangkat berada antara 12:00–14:59, THE Clock_Widget SHALL menampilkan sapaan "Selamat Siang".
5. WHEN jam lokal perangkat berada antara 15:00–17:59, THE Clock_Widget SHALL menampilkan sapaan "Selamat Sore".
6. WHEN jam lokal perangkat berada antara 18:00–04:59, THE Clock_Widget SHALL menampilkan sapaan "Selamat Malam".
7. THE Clock_Widget SHALL menampilkan nama pengguna yang tersimpan sebagai bagian dari sapaan (contoh: "Selamat Pagi, Budi!"); IF tidak ada nama yang tersimpan di Local_Storage, THEN THE Clock_Widget SHALL menggunakan "Pengguna" sebagai nama default.
8. WHEN User mengklik nama pengguna yang ditampilkan, THE Clock_Widget SHALL mengaktifkan mode edit berupa input field yang telah terisi dengan nama saat ini agar User dapat mengubah nama tersebut.
9. WHEN User menyimpan nama pengguna baru (menekan Enter atau tombol simpan), THE Storage_Module SHALL menyimpan nama tersebut ke Local_Storage sehingga tetap tersedia setelah halaman dimuat ulang.
10. IF User menyimpan nama pengguna yang kosong atau hanya berisi spasi, THEN THE Validator SHALL mencegah penyimpanan, mempertahankan nama yang sudah ada, dan menutup mode edit tanpa perubahan.
11. THE Clock_Widget SHALL membatasi panjang nama pengguna maksimal 50 karakter; WHEN User menekan tombol batal pada mode edit, THE Clock_Widget SHALL menutup mode edit tanpa mengubah nama yang tersimpan.

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a 25-minute focus timer with start, stop, and reset controls, so that I can manage my work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN halaman dimuat, THE Focus_Timer SHALL menampilkan hitungan mundur pada nilai awal 25:00, dengan tombol Start dalam keadaan aktif (enabled) dan tombol Stop dalam keadaan nonaktif (disabled).
2. WHEN User menekan tombol Start, THE Focus_Timer SHALL memulai hitungan mundur dari nilai yang saat ini ditampilkan dengan pengurangan tepat satu detik per detik menggunakan mekanisme berbasis timestamp.
3. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol Start dan mengaktifkan tombol Stop.
4. WHEN User menekan tombol Stop, THE Focus_Timer SHALL menghentikan hitungan mundur dan mempertahankan nilai yang saat ini ditampilkan.
5. WHILE Focus_Timer dalam keadaan berhenti dan nilai bukan 00:00, THE Focus_Timer SHALL mengaktifkan tombol Start dan menonaktifkan tombol Stop.
6. WHEN User menekan tombol Reset, THE Focus_Timer SHALL menghentikan hitungan mundur, mengembalikan tampilan ke 25:00, dan mengatur ulang ke keadaan berhenti dengan tombol Start aktif dan tombol Stop nonaktif.
7. WHEN hitungan mundur mencapai 00:00, THE Focus_Timer SHALL berhenti secara otomatis dan menampilkan pesan notifikasi yang terlihat di layar bahwa sesi fokus telah selesai; pesan tersebut SHALL tetap ditampilkan hingga User menutupnya secara eksplisit.
8. THE Focus_Timer SHALL menampilkan waktu tersisa dalam format `MM:SS` dengan zero-padding (contoh: "04:07").

---

### Requirement 4: To-Do List

**User Story:** As a User, I want to add, edit, complete, and delete tasks, so that I can track and manage my daily activities in one place.

#### Acceptance Criteria

1. WHEN User memasukkan teks tugas (maksimal 200 karakter) dan menekan tombol tambah atau tombol Enter, THE Todo_Manager SHALL membuat Todo_Item baru dengan ID unik dan menambahkannya ke daftar.
2. WHEN daftar Todo_Item berubah (ditambah, diedit, dihapus, atau status berubah), THE Storage_Module SHALL segera menyimpan seluruh daftar Todo_Item ke Local_Storage dalam format JSON.
3. WHEN halaman dimuat, THE Todo_Manager SHALL memuat dan merender semua Todo_Item yang tersimpan dari Local_Storage, mempertahankan teks dan status selesai masing-masing item.
4. IF User mencoba menambahkan Todo_Item dengan teks yang kosong atau hanya berisi spasi, THEN THE Validator SHALL mencegah penambahan tanpa membuat entri baru.
5. IF User mencoba menambahkan Todo_Item dengan teks yang identik (case-insensitive, setelah trim spasi) dengan Todo_Item yang sudah ada dan belum selesai, THEN THE Validator SHALL mencegah penambahan dan menampilkan pesan peringatan yang menyebutkan bahwa tugas tersebut sudah ada di daftar.
6. WHEN User mengklik checkbox atau area status pada Todo_Item, THE Todo_Manager SHALL mengubah status Todo_Item tersebut dari belum selesai menjadi selesai atau sebaliknya dan segera memperbarui Local_Storage.
7. WHEN User mengklik tombol edit pada Todo_Item, THE Todo_Manager SHALL mengaktifkan mode edit berupa input field yang telah terisi dengan teks Todo_Item saat ini.
8. WHEN User menekan tombol simpan atau Enter pada mode edit, THE Validator SHALL memeriksa bahwa teks baru tidak kosong, tidak hanya berisi spasi, dan tidak duplikat dengan Todo_Item lain yang belum selesai (kecuali item itu sendiri).
9. IF validasi edit berhasil, THEN THE Todo_Manager SHALL memperbarui teks Todo_Item tersebut dan menyimpan perubahan ke Local_Storage; THEN mode edit SHALL ditutup.
10. IF validasi edit gagal, THEN THE Todo_Manager SHALL menampilkan pesan peringatan yang sesuai dan tetap mempertahankan mode edit agar User dapat memperbaiki input.
11. WHEN User mengklik tombol hapus pada Todo_Item, THE Todo_Manager SHALL menghapus Todo_Item tersebut dari daftar dan memperbarui Local_Storage.
12. WHILE Todo_Item memiliki status selesai, THE Todo_Manager SHALL menampilkan teks Todo_Item tersebut dengan garis coret (text-decoration: line-through) untuk membedakannya secara visual dari tugas yang belum selesai.

---

### Requirement 5: Quick Links

**User Story:** As a User, I want to save and access my favorite websites quickly, so that I can navigate to frequently visited sites without leaving my dashboard.

#### Acceptance Criteria

1. WHEN User memasukkan label (maksimal 50 karakter) dan URL yang valid lalu menekan tombol tambah, THE Quick_Links_Manager SHALL membuat Quick_Link baru dan menambahkannya ke daftar.
2. WHEN daftar Quick_Link berubah (ditambah atau dihapus), THE Storage_Module SHALL segera menyimpan seluruh daftar Quick_Link ke Local_Storage dalam format JSON.
3. WHEN halaman dimuat, THE Quick_Links_Manager SHALL memuat dan merender semua Quick_Link yang tersimpan dari Local_Storage, menampilkan label dan URL masing-masing.
4. WHEN User mengklik sebuah Quick_Link, THE Dashboard SHALL membuka URL yang terkait di tab baru browser menggunakan atribut `target="_blank"` dan `rel="noopener noreferrer"`.
5. IF User mencoba menambahkan Quick_Link dengan label yang kosong atau hanya berisi spasi, THEN THE Validator SHALL mencegah penambahan dan menampilkan pesan peringatan yang sesuai.
6. IF User memasukkan URL yang tidak diawali dengan skema `http://` atau `https://` dan tidak mengandung karakter titik (`.`), THEN THE Validator SHALL mencegah penambahan dan menampilkan pesan peringatan kepada User; URL tanpa skema yang mengandung titik SHALL otomatis ditambahkan prefiks `https://`.
7. WHEN User mengklik tombol hapus pada Quick_Link, THE Quick_Links_Manager SHALL menghapus Quick_Link tersebut dari daftar dan memperbarui Local_Storage.
8. IF jumlah Quick_Link yang tersimpan telah mencapai 20, THEN THE Quick_Links_Manager SHALL mencegah penambahan Quick_Link baru dan menampilkan pesan peringatan bahwa batas maksimum telah tercapai.
9. IF User mencoba menambahkan Quick_Link dengan URL yang identik (case-insensitive) dengan Quick_Link yang sudah ada, THEN THE Validator SHALL mencegah penambahan dan menampilkan pesan bahwa tautan tersebut sudah ada.
10. THE Validator SHALL menerima URL dengan panjang maksimal 2048 karakter; IF URL melebihi panjang tersebut, THEN THE Validator SHALL mencegah penambahan dan menampilkan pesan peringatan.

---

### Requirement 6: Light/Dark Mode

**User Story:** As a User, I want to switch between light and dark themes and have my preference saved, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN User menekan tombol toggle tema, THE Theme_Controller SHALL mengubah tema Dashboard dari terang ke gelap atau dari gelap ke terang dengan menambahkan atau menghapus class CSS pada elemen `<body>` atau `<html>`.
2. WHEN tema diubah, THE Storage_Module SHALL segera menyimpan preferensi tema (nilai "light" atau "dark") ke Local_Storage menggunakan kunci yang konsisten.
3. WHEN halaman dimuat, THE Theme_Controller SHALL membaca preferensi tema dari Local_Storage dan menerapkan class CSS tema yang sesuai pada elemen `<body>` atau `<html>` sebelum browser melakukan rendering pertama untuk menghindari flash of unstyled content (FOUC).
4. IF tidak ada preferensi tema yang tersimpan di Local_Storage, THEN THE Theme_Controller SHALL menerapkan tema terang ("light") sebagai tema default.
5. THE Dashboard SHALL menampilkan ikon matahari (☀️ atau SVG setara) pada tombol toggle WHEN tema aktif adalah terang, dan ikon bulan (🌙 atau SVG setara) WHEN tema aktif adalah gelap.

---

### Requirement 7: Persistensi & Integritas Data

**User Story:** As a User, I want my data to be saved reliably so that my tasks, links, and settings are always available when I reopen the dashboard.

#### Acceptance Criteria

1. THE Storage_Module SHALL menggunakan kunci Local_Storage yang unik, konsisten, dan terdokumentasi: `tld_todos` untuk tugas, `tld_links` untuk tautan, `tld_username` untuk nama pengguna, dan `tld_theme` untuk preferensi tema.
2. WHEN Storage_Module membaca data dari Local_Storage, THE Storage_Module SHALL mem-parsing JSON menggunakan blok try-catch; IF parsing gagal atau nilai yang dibaca adalah `null`, THEN THE Storage_Module SHALL mengembalikan nilai default yang sesuai (`[]` untuk array, `""` untuk string, `"light"` untuk tema) dan tidak melempar error yang tidak tertangani ke konsol.
3. THE Storage_Module SHALL menyerialisasi data ke format JSON menggunakan `JSON.stringify` sebelum menulis ke Local_Storage.
4. FOR ALL data bertipe array atau objek yang ditulis ke kemudian dibaca kembali dari Local_Storage, THE Storage_Module SHALL menghasilkan struktur data yang secara deep-equal ekuivalen dengan data yang ditulis (round-trip property).

---

### Requirement 8: Responsivitas & Aksesibilitas UI

**User Story:** As a User, I want the dashboard to look good and be usable on any device size, so that I can access it from my desktop, tablet, or mobile phone.

#### Acceptance Criteria

1. THE Dashboard SHALL menggunakan CSS Responsive Design (media queries kombinasi dengan CSS Grid atau Flexbox) untuk menyesuaikan tata letak secara otomatis pada breakpoint: mobile (320px–767px), tablet (768px–1023px), dan desktop (≥1024px).
2. THE Dashboard SHALL memastikan semua elemen interaktif (tombol, input, tautan) memiliki area tap/klik minimal 44×44 piksel CSS pada tampilan mobile sesuai panduan WCAG 2.5.5.
3. THE Dashboard SHALL memastikan semua elemen `<input>` memiliki elemen `<label>` yang terhubung melalui atribut `for`/`id` atau atribut `aria-label` yang deskriptif.
4. THE Dashboard SHALL memastikan kontras warna antara teks dan latar belakang memenuhi rasio kontras minimum WCAG 2.1 Level AA (4.5:1 untuk teks normal berukuran di bawah 18pt, 3:1 untuk teks besar atau tebal ≥18pt) pada kedua tema terang dan gelap.
5. THE Dashboard SHALL menggunakan elemen HTML semantik (`<header>`, `<main>`, `<section>`, `<button>`, `<ul>`, `<li>`, dll.) untuk struktur halaman yang dapat diinterpretasi oleh screen reader dan teknologi bantu lainnya.
