# Simulasi Interaktif Hukum Induksi Diri pada Kumparan

Aplikasi web belajar mandiri (HTML, CSS, JavaScript murni, SVG, Canvas) tanpa backend dan tanpa dependensi eksternal. Semua path relatif, sehingga aman di GitHub Pages (`/nama-repository/`).

## Tujuan pembelajaran
- Menjelaskan GGL induksi diri dan Hukum Lenz.
- Menghitung L, τ, energi magnetik, XL, Z, dan fase pada rangkaian RL seri.
- Menjalankan eksperimen virtual dan membaca grafik i(t), v(t), W(t).

## Fitur
Tab Simulasi, Teori, Rumus, Grafik, Eksperimen (6), Kuis (10 soal), Tentang. Slider N, L, R, V DC, V AC rms, f, arus awal, A, l, μr. Tombol Mulai, Jeda, Lanjutkan, Reset, Sakelar, Mode DC/AC, medan magnet, grafik, tema terang/gelap.

## Model fisika
Persamaan: L·di/dt + R·i = vs(t), diselesaikan secara analitik (eksak): i(t) = i_partikular(t) + (i₀ − i_partikular(t₀))·e^(−(t−t₀)/τ), τ = L/R.
- DC: i_partikular = V/R. AC: Im·sin(ωt − φ), Im = Vm/Z, Z = √(R² + (ωL)²), φ = arctan(ωL/R).
- vL = L·di/dt, vR = R·i, εL = −vL, vL + vR = vs (KVL), W = ½Li², ΦB = L·i/N.
- Mode solenoida: L = μ₀μr·N²A/l, dibatasi 1 mH sampai 5 H. Mode langsung: L dari slider. Kedua model tidak dipakai bersamaan.
- Sakelar OFF: diasumsikan ada jalur pelepasan lewat R, sehingga arus meluruh eksponensial.
- Batas model: induktor ideal, L konstan, medan digambar skematis.

## Struktur folder
```
induksi-diri-simulation/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Menjalankan lokal
Klik dua kali `index.html`, atau jalankan `python -m http.server` di folder ini lalu buka `http://localhost:8000`.

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub (publik), mis. `induksi-diri-simulation`.
2. Unggah keempat file ke root repository (Add file → Upload files → Commit).
3. Buka Settings → Pages.
4. Pada Build and deployment, pilih Source: Deploy from a branch, Branch: `main`, folder `/ (root)`, lalu Save.
5. Tunggu 1 sampai 3 menit. URL: `https://USERNAME.github.io/induksi-diri-simulation/`.
6. Perbarui: ubah file, commit ke `main`, tunggu build ulang, muat ulang dengan Ctrl+F5.

Pemecahan masalah: halaman tanpa gaya berarti nama file/huruf besar-kecil tidak cocok (`style.css`, `script.js`) atau file tidak di root; periksa tab Console (F12) dan Actions; coba Ctrl+F5 untuk mengosongkan cache. Di HP, buka URL yang sama; layar sempit menyusun panel secara vertikal.

## Checklist pengujian (belum dijalankan; centang setelah Anda uji)
- [ ] V = 12 V, R = 100 Ω, L = 1 H: arus tunak 0,12 A dan τ = 10 ms.
- [ ] Pada t = τ arus ≈ 63,2% nilai tunak.
- [ ] vL + vR = V setiap saat (DC).
- [ ] W = ½Li² cocok dengan hitungan manual.
- [ ] Frekuensi lebih tinggi menaikkan XL (mode AC, L tetap).
- [ ] Tidak ada NaN/Infinity pada seluruh rentang slider.
- [ ] Reset mengembalikan parameter dan grafik.
- [ ] Sakelar, slider, tombol, tab, grafik, kuis berfungsi.
- [ ] Tata letak baik di layar HP (portrait dan landscape).
- [ ] Berjalan dari URL GitHub Pages.
