# Implementation Plan: To-Do Life Dashboard

## Overview

Implementasi aplikasi web satu halaman menggunakan HTML5, CSS3, dan Vanilla JavaScript ES6+. Tidak ada framework, tidak ada build tool, tidak ada dependensi eksternal. Semua logika dikemas dalam tiga file: `index.html`, `css/style.css`, dan `js/script.js`. Data disimpan di Browser Local Storage API. Urutan pengerjaan mengikuti urutan inisialisasi desain: scaffold → StorageModule → ValidatorModule → ThemeController → ClockWidget → FocusTimerModule → TodoManager → QuickLinksManager → App.init() → CSS layout & theming → Accessibility pass.

---

## Tasks

- [x] 1. Scaffold proyek — struktur file dan kerangka HTML

  - Buat file `index.html` dengan doctype HTML5, `lang="id"`, dan struktur semantik lengkap: `<header>`, `<main>`, semua section widget (`#clock-widget`, `#focus-timer-section`, `#todo-section`, `#quick-links-section`), dan elemen-elemen dengan ID stabil persis seperti yang didefinisikan di Skema HTML Widget pada design.md.
  - Buat file `css/style.css` (kosong, terhubung via `<link>` di `<head>`).
  - Buat file `js/script.js` dengan `<script type="module" src="js/script.js">` di bagian akhir `<body>`.
  - Pastikan semua elemen interaktif sudah memiliki `<label>` / `aria-label` placeholder sejak awal.
  - _Requirements: 1.2, 1.3, 8.3, 8.5_

- [x] 2. Implementasi StorageModule

  - [x] 2.1 Tulis `StorageModule` dengan konstanta `KEYS` (`tld_todos`, `tld_links`, `tld_username`, `tld_theme`), metode `isAvailable()`, `get(key, defaultValue)`, `set(key, value)`, dan `showUnavailableWarning()`.
    - `isAvailable()`: coba tulis dan hapus kunci sentinel; tangkap semua exception, kembalikan boolean.
    - `get()`: bungkus `localStorage.getItem` + `JSON.parse` dalam `try-catch`; jika `null` atau parse gagal kembalikan `defaultValue`.
    - `set()`: gunakan `JSON.stringify`; tangkap `QuotaExceededError`; kembalikan `true`/`false`.
    - `showUnavailableWarning()`: tampilkan elemen `#storage-warning` (set `hidden = false`).
    - _Requirements: 1.4, 7.1, 7.2, 7.3_

  - [ ]* 2.2 Tulis property test untuk StorageModule — Property 22 & 23
    - **Property 22: Round-Trip General StorageModule** — `fc.jsonValue()` → `set` → `get` harus deep-equal.
    - **Property 23: StorageModule Menangani JSON Rusak dengan Aman** — inject string JSON tidak valid langsung ke `localStorage[key]`, panggil `get()`, harus kembalikan `defaultValue` tanpa exception.
    - **Validates: Requirements 7.2, 7.4**

- [x] 3. Implementasi ValidatorModule

  - [x] 3.1 Tulis `ValidatorModule` dengan metode: `isBlank(str)`, `exceedsMaxLength(str, max)`, `isDuplicateTodo(text, todos, excludeId?)`, `isValidUrl(url)`, `isDuplicateLink(url, links)`, `exceedsUrlMaxLength(url)`.
    - `isBlank`: `str.trim().length === 0`.
    - `exceedsMaxLength`: `str.trim().length > max`.
    - `isDuplicateTodo`: case-insensitive trim, hanya item `completed === false`, abaikan `excludeId`.
    - `isValidUrl`: valid jika diawali `http://`/`https://`; jika tidak ada skema tapi ada titik → prefix `https://`; jika tidak ada titik dan tidak ada skema valid → `{ valid: false }`.
    - `isDuplicateLink`: case-insensitive comparison.
    - `exceedsUrlMaxLength`: `url.length > 2048`.
    - _Requirements: 2.10, 2.11, 4.4, 4.5, 4.8, 5.5, 5.6, 5.9, 5.10_

  - [ ]* 3.2 Tulis property tests untuk ValidatorModule — Property 5, 10, 13, 16, 17
    - **Property 5: Validasi Nama Pengguna — Blank dan Panjang** — `fc.string().filter(s => s.trim() === '')` harus `isBlank → true`; `fc.string({ minLength: 51 })` harus `exceedsMaxLength(str, 50) → true`.
    - **Property 10: Todo Duplikat (Case-Insensitive) Ditolak** — buat todo list dengan satu item aktif, generate semua variasi casing dari teks tersebut, `isDuplicateTodo` harus selalu `true`.
    - **Property 13: Validasi Edit Todo — Duplikat Kecuali Diri Sendiri** — `isDuplicateTodo(text, todos, item.id)` harus `false` saat cocok hanya dengan item itu sendiri.
    - **Property 16: Normalisasi URL — Domain Tanpa Skema Mendapat Prefiks https://** — `fc.domain()` tanpa skema → `normalizedUrl` diawali `https://`; string tanpa titik dan tanpa skema → `valid === false`.
    - **Property 17: URL Duplikat (Case-Insensitive) Ditolak** — `fc.webUrl()` + variasi casing → `isDuplicateLink` selalu `true`.
    - **Validates: Requirements 2.10, 2.11, 4.5, 4.8, 5.6, 5.9**

- [x] 4. Implementasi ThemeController

  - [x] 4.1 Tulis `ThemeController` dengan metode `init()`, `toggle()`, `_apply(theme)`, `_updateIcon(theme)`.
    - `init()`: baca tema dari `StorageModule.get(KEYS.THEME, 'light')`, panggil `_apply()` dan `_updateIcon()`, pasang event listener pada `#theme-toggle`.
    - `_apply()`: tambah/hapus class `dark-mode` pada `<html>`.
    - `_updateIcon()`: set teks/HTML `#theme-toggle` ke ikon ☀️ (light) atau 🌙 (dark).
    - `toggle()`: flip tema, simpan via `StorageModule.set`, panggil `_apply` dan `_updateIcon`.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.2 Tulis property tests untuk ThemeController — Property 20 & 21
    - **Property 20: Toggle Tema Bersifat Idempoten dalam Pasangan** — `fc.constantFrom('light', 'dark')` → toggle dua kali → tema kembali ke semula.
    - **Property 21: Round-Trip Penyimpanan Tema** — `_apply(theme)` + `StorageModule.set(KEYS.THEME, theme)` → `StorageModule.get(KEYS.THEME, 'light')` harus identik.
    - **Validates: Requirements 6.1, 6.2**

- [x] 5. Implementasi ClockWidget

  - [x] 5.1 Tulis `ClockWidget` dengan metode `init()`, `_tick()`, `_getGreeting(hour)`, `_formatTime(date)`, `_formatDate(date)`, `enableEditMode()`, `disableEditMode()`, `saveUsername(name)`.
    - `_formatTime`: pad dua digit untuk HH, MM, SS.
    - `_formatDate`: gunakan array nama hari dan nama bulan Bahasa Indonesia; format "Nama-Hari, DD Nama-Bulan YYYY".
    - `_getGreeting`: 5–11 → "Selamat Pagi", 12–14 → "Selamat Siang", 15–17 → "Selamat Sore", 18–23 dan 0–4 → "Selamat Malam".
    - `init()`: muat username dari storage (default "Pengguna"), panggil `_tick()`, pasang `setInterval(_tick, 1000)`, pasang event listener pada `#username-display` (klik → `enableEditMode`), `#username-save` (simpan), `#username-cancel` (batal).
    - `saveUsername`: validasi via `ValidatorModule.isBlank` dan `exceedsMaxLength(name, 50)`; jika valid simpan via `StorageModule.set(KEYS.USERNAME, name)` dan panggil `disableEditMode`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 5.2 Tulis property tests untuk ClockWidget — Property 1, 2, 3, 4, 5
    - **Property 1: Format Waktu Selalu Valid** — `fc.date()` → `_formatTime(date)` harus cocok regex `/^\d{2}:\d{2}:\d{2}$/` dengan HH∈[00–23], MM∈[00–59], SS∈[00–59].
    - **Property 2: Format Tanggal Bahasa Indonesia** — `fc.date()` → `_formatDate(date)` harus mengandung nama hari valid (Senin–Minggu), angka tanggal, nama bulan valid (Januari–Desember), dan tahun 4 digit.
    - **Property 3: Sapaan Berbasis Jam Selalu Tepat** — `fc.integer({ min: 0, max: 23 })` → tepat satu sapaan valid dikembalikan; tidak ada celah, tidak ada tumpang-tindih.
    - **Property 4: Round-Trip Penyimpanan Nama Pengguna** — `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)` → `saveUsername` → `StorageModule.get(KEYS.USERNAME, '')` harus identik.
    - **Property 5: Validasi Nama Pengguna — Blank** — string blank → `saveUsername` menolak, nama sebelumnya di storage tidak berubah.
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9, 2.10**

- [x] 6. Implementasi FocusTimerModule

  - [x] 6.1 Tulis `FocusTimerModule` dengan state internal (`_intervalId`, `_endTimestamp`, `_remainingSeconds`, `_isRunning`) dan metode `init()`, `start()`, `stop()`, `reset()`, `_tick()`, `_formatDisplay(seconds)`, `_onComplete()`.
    - `start()`: hitung `_endTimestamp = Date.now() + _remainingSeconds * 1000`, pasang `setInterval(_tick, 200)` (polling lebih sering untuk akurasi), set `_isRunning = true`, update tombol.
    - `_tick()`: hitung `remaining = Math.ceil((_endTimestamp - Date.now()) / 1000)`, clamp ke 0; jika `<= 0` panggil `_onComplete()`; update display.
    - `stop()`: `clearInterval(_intervalId)`, simpan `_remainingSeconds` dari display, set `_isRunning = false`, update tombol.
    - `reset()`: `clearInterval`, `_remainingSeconds = 1500`, update display ke "25:00", set `_isRunning = false`, update tombol.
    - `_onComplete()`: `clearInterval`, tampilkan `#timer-notification` dengan pesan, pasang event listener pada tombol tutup notifikasi.
    - `_formatDisplay`: `MM:SS` zero-padded, MM = `Math.floor(seconds / 60)`, SS = `seconds % 60`.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 6.2 Tulis property test untuk FocusTimerModule — Property 6
    - **Property 6: Format Timer MM:SS Selalu Valid** — `fc.integer({ min: 0, max: 1500 })` → `_formatDisplay(seconds)` harus cocok regex `/^\d{2}:\d{2}$/` dengan MM = ⌊s/60⌋ dan SS = s%60, keduanya zero-padded.
    - **Validates: Requirements 3.2, 3.8**

- [x] 7. Implementasi TodoManager

  - [x] 7.1 Tulis `TodoManager` dengan tipe data `TodoItem` (`id`, `text`, `completed`, `createdAt`) dan metode `init()`, `_render()`, `addTodo(text)`, `toggleTodo(id)`, `editTodo(id, newText)`, `deleteTodo(id)`, `_createTodoItem(text)`, `_saveToStorage()`, `_loadFromStorage()`.
    - `_createTodoItem`: gunakan `crypto.randomUUID()` jika tersedia, fallback ke `Date.now().toString(36) + Math.random().toString(36).slice(2)`.
    - `addTodo`: validasi via `ValidatorModule.isBlank`, `exceedsMaxLength(text, 200)`, `isDuplicateTodo`; jika gagal tampilkan pesan di `#todo-warning`; jika lolos buat item baru, push ke array, `_saveToStorage()`, `_render()`.
    - `toggleTodo`: flip `completed`, `_saveToStorage()`, `_render()`.
    - `editTodo`: validasi teks baru (tidak blank, tidak duplikat kecuali diri sendiri); jika lolos update `text`, `_saveToStorage()`, `_render()`; jika gagal tampilkan pesan dan pertahankan mode edit.
    - `deleteTodo`: filter array, `_saveToStorage()`, `_render()`.
    - `_render()`: bersihkan `#todo-list`; untuk setiap item buat `<li>` dengan checkbox, teks (dengan `text-decoration: line-through` jika `completed`), tombol edit, tombol hapus; pasang semua event listener.
    - `init()`: muat dari storage via `_loadFromStorage()`, `_render()`, pasang submit handler `#todo-form`.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12_

  - [ ]* 7.2 Tulis property tests untuk TodoManager — Property 7, 8, 9, 11, 12
    - **Property 7: Round-Trip Todo List ke Local Storage** — `fc.array(todoItemArbitrary)` → `_saveToStorage()` → `_loadFromStorage()` harus deep-equal.
    - **Property 8: Penambahan Todo Menambah Panjang List** — teks valid → `addTodo` → `length === sebelumnya + 1`, item baru ada di array.
    - **Property 9: Todo Blank Ditolak** — `fc.string().filter(s => s.trim() === '')` → `addTodo` → panjang tidak berubah.
    - **Property 11: Toggle Status Todo Bersifat Idempoten dalam Pasangan** — `fc.record(...)` → `toggleTodo(id)` dua kali → `completed` kembali ke nilai awal.
    - **Property 12: Penghapusan Todo Menghilangkan Item dari Daftar** — `fc.array(todoItemArbitrary, { minLength: 1 })` → `deleteTodo(id)` → item hilang, panjang berkurang tepat 1.
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.11**

- [x] 8. Checkpoint — Pastikan semua fungsi inti berjalan
  - Pastikan semua module (`StorageModule`, `ValidatorModule`, `ThemeController`, `ClockWidget`, `FocusTimerModule`, `TodoManager`) dapat diinisialisasi tanpa error di konsol browser.
  - Pastikan semua property tests yang sudah ditulis lulus.
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [x] 9. Implementasi QuickLinksManager

  - [x] 9.1 Tulis `QuickLinksManager` dengan tipe data `QuickLink` (`id`, `label`, `url`, `createdAt`), konstanta `MAX_LINKS: 20`, dan metode `init()`, `_render()`, `addLink(label, url)`, `deleteLink(id)`, `_createQuickLink(label, url)`, `_saveToStorage()`, `_loadFromStorage()`.
    - `addLink`: validasi `isBlank(label)`, `exceedsMaxLength(label, 50)`, `isValidUrl(url)`, `exceedsUrlMaxLength(url)`, `isDuplicateLink(url, links)`, dan cek `links.length >= MAX_LINKS`; tampilkan pesan di `#link-warning` jika validasi gagal; jika lolos buat item baru dengan `normalizedUrl` dari `isValidUrl`, push, `_saveToStorage()`, `_render()`.
    - `deleteLink`: filter array, `_saveToStorage()`, `_render()`.
    - `_render()`: bersihkan `#link-list`; untuk setiap link buat `<li>` dengan `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>` dan tombol hapus.
    - `init()`: `_loadFromStorage()`, `_render()`, pasang submit handler `#link-form`.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 9.2 Tulis property tests untuk QuickLinksManager — Property 14, 15, 18, 19
    - **Property 14: Round-Trip Quick Links ke Local Storage** — `fc.array(quickLinkArbitrary)` → `_saveToStorage()` → `_loadFromStorage()` harus deep-equal.
    - **Property 15: Penambahan Link Menambah Panjang List** — label + URL valid, `links.length < 20` → `addLink` → panjang bertambah tepat 1.
    - **Property 18: Penghapusan Link Menghilangkan Item dari Daftar** — `fc.array(quickLinkArbitrary, { minLength: 1 })` → `deleteLink(id)` → item hilang, panjang berkurang tepat 1.
    - **Property 19: Anchor Quick Link Selalu Aman** — render setiap `QuickLink` → `<a>` harus memiliki `target="_blank"` dan `rel="noopener noreferrer"`.
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**

- [x] 10. Implementasi App.init() — Wiring semua modul

  - [x] 10.1 Tulis fungsi `App.init()` yang dipanggil di dalam event `DOMContentLoaded` (atau langsung di akhir script setelah DOM siap) dengan urutan inisialisasi yang tepat.
    - Urutan wajib: `ThemeController.init()` → `StorageModule` check (`isAvailable()` → jika false panggil `showUnavailableWarning()`) → `ClockWidget.init()` → `FocusTimerModule.init()` → `TodoManager.init()` → `QuickLinksManager.init()`.
    - Pastikan seluruh alur berjalan tanpa uncaught exception; bungkus dalam `try-catch` tingkat atas yang mencetak error ke konsol tanpa merusak UI.
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 10.2 Tambahkan penanganan error global dan toast notification untuk `StorageModule.set()` yang gagal (QuotaExceededError).
    - Buat fungsi `showToast(message, type)` yang menampilkan notifikasi non-blocking selama ±3 detik.
    - Setiap titik `StorageModule.set()` yang mengembalikan `false` harus memicu toast peringatan.
    - _Requirements: 1.4, 7.2_

- [x] 11. CSS — Variabel tema, layout responsif, dan gaya komponen

  - [x] 11.1 Tulis variabel CSS tema (light & dark) di `:root` dan `html.dark-mode`, dan gaya dasar reset/base di `css/style.css`.
    - Definisikan semua custom properties: `--bg-primary`, `--bg-surface`, `--text-primary`, `--text-muted`, `--accent`, `--accent-hover`, `--border`, `--shadow`, `--transition` persis seperti di design.md.
    - Tambahkan CSS reset minimal (box-sizing, margin/padding 0, font-family sans-serif).
    - _Requirements: 6.1, 6.3, 6.5_

  - [x] 11.2 Tulis CSS layout responsif dengan CSS Grid untuk `.dashboard-grid` dan Flexbox untuk komponen internal.
    - Mobile-first: `grid-template-columns: 1fr` (default).
    - Tablet (`≥768px`): `grid-template-columns: 1fr 1fr`.
    - Desktop (`≥1024px`): `grid-template-columns: 380px 1fr`, `max-width: 1200px`, `margin: 0 auto`.
    - Pastikan tidak ada horizontal scroll pada 320px, 768px, 1024px, dan 1920px.
    - _Requirements: 1.5, 8.1_

  - [x] 11.3 Tulis gaya untuk semua komponen: Clock_Widget, Focus_Timer, Todo_Manager, Quick_Links_Manager, storage warning banner, dan timer notification.
    - Semua elemen interaktif (tombol, input, tautan) harus memiliki `min-height: 44px; min-width: 44px` untuk WCAG 2.5.5.
    - Gunakan CSS custom properties untuk semua warna agar tema otomatis bekerja.
    - Terapkan gaya `text-decoration: line-through` untuk Todo_Item dengan status selesai.
    - Gaya `#timer-notification` sebagai alert yang prominent dan dismissible.
    - _Requirements: 8.1, 8.2, 4.12_

- [x] 12. Accessibility pass — Semantik HTML, ARIA, dan kontras WCAG

  - [x] 12.1 Audit dan perbaiki struktur HTML semantik dan atribut ARIA di `index.html`.
    - Pastikan semua `<input>` memiliki `<label for="...">` atau `aria-label` yang deskriptif.
    - Pastikan semua tombol memiliki teks atau `aria-label` yang bermakna (termasuk tombol edit dan hapus di setiap item).
    - Pastikan elemen notifikasi (`#timer-notification`, `#todo-warning`, `#link-warning`) memiliki `role="alert"`.
    - Pastikan `<header>`, `<main>`, `<section aria-label="...">`, `<ul>`, `<li>`, `<button>` digunakan sesuai semantik.
    - _Requirements: 8.3, 8.5_

  - [x] 12.2 Audit dan perbaiki nilai warna CSS untuk memenuhi kontras WCAG 2.1 Level AA (4.5:1 teks normal, 3:1 teks besar/tebal) pada tema terang dan gelap.
    - Periksa pasangan `--text-primary` vs `--bg-primary`, `--text-primary` vs `--bg-surface`, `--text-muted` vs background, dan warna teks tombol vs background tombol.
    - Sesuaikan nilai warna jika ada yang tidak memenuhi rasio minimum.
    - _Requirements: 8.4_

- [x] 13. Checkpoint akhir — Verifikasi menyeluruh
  - Pastikan semua tests (property tests dan unit tests) lulus.
  - Pastikan tidak ada uncaught JavaScript exception di konsol browser.
  - Pastikan layout tidak horizontal scroll pada lebar 320px.
  - Tanyakan kepada user jika ada pertanyaan sebelum menyelesaikan.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat.
- Setiap task mereferensikan requirements spesifik untuk keterlacakan.
- `fast-check` digunakan sebagai library property-based testing; dapat diimpor via CDN `https://cdn.jsdelivr.net/npm/fast-check/+esm` di file test terpisah atau ditambahkan sebagai modul dev.
- Checkpoint memastikan validasi bertahap sebelum melanjutkan ke modul berikutnya.
- Property tests memvalidasi correctness properties universal; unit tests memvalidasi contoh konkret dan kasus tepi.
- `ThemeController.init()` **harus** selalu dipanggil pertama dalam `App.init()` untuk mencegah FOUC.
- Timer menggunakan `endTimestamp` berbasis `Date.now()` — bukan decrement naif — agar tetap akurat saat tab dilatarbelakangi.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 2, "tasks": ["4.2", "5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["7.2", "9.1"] },
    { "id": 6, "tasks": ["9.2", "10.1"] },
    { "id": 7, "tasks": ["10.2", "11.1"] },
    { "id": 8, "tasks": ["11.2", "11.3"] },
    { "id": 9, "tasks": ["12.1", "12.2"] }
  ]
}
```
