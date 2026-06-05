## Penerapan Metode *Best-Worst Method* (BWM) pada Sistem Penilaian Kinerja Teknisi

### Kriteria Penilaian Kinerja (C1–C5)

Sistem penilaian kinerja menggunakan lima kriteria yang seluruhnya berjenis *benefit*, artinya semakin besar nilai suatu kriteria menunjukkan semakin baik kinerja teknisi yang bersangkutan. Kelima kriteria tersebut ditampilkan pada Tabel 3.X.

**Tabel 3.X Kriteria Penilaian Kinerja Teknisi**

| Kode | Nama Kriteria       | Rentang Nilai       | Sumber Data                                                                   |
|------|---------------------|---------------------|-------------------------------------------------------------------------------|
| C1   | Kecepatan Penyelesaian | 0–100            | Selisih antara tanggal penyelesaian aktual dengan batas waktu penugasan       |
| C2   | Kualitas Laporan    | 0–100               | Proporsi laporan progres teknisi yang mendapat status *Disetujui*             |
| C3   | Kepatuhan Laporan   | 0–100               | Proporsi hari pelaporan unik dibandingkan jumlah hari pelaporan yang diharapkan |
| C4   | Proaktivitas        | 0–tak terbatas      | Jumlah pengajuan kendala yang mendapat status *Disetujui* dalam satu penugasan |
| C5   | Kompetensi Teknisi  | 0–1.500.000         | Nilai tunjangan jabatan berdasarkan level lisensi teknisi                     |

Rumus pengukuran masing-masing kriteria adalah sebagai berikut.

#### C1 – Kecepatan Penyelesaian

Kriteria ini mengukur seberapa cepat penugasan diselesaikan secara keseluruhan relatif terhadap tenggat waktu yang telah ditetapkan. Nilai C1 bersifat global, artinya seluruh teknisi dalam satu penugasan memperoleh nilai yang sama karena penugasan dinyatakan selesai secara kolektif oleh supervisor.

$$C1_i = \max\left(0,\ \frac{t_{\text{deadline}} - t_{\text{selesai}}}{t_{\text{deadline}} - t_{\text{mulai}}} \times 100\right) \tag{1}$$

di mana $t_{\text{selesai}}$ adalah tanggal supervisor menandai penugasan selesai, $t_{\text{deadline}}$ adalah batas waktu akhir penugasan, dan $t_{\text{mulai}}$ adalah tanggal mulai penugasan. Apabila penugasan diselesaikan tepat pada tenggat, C1 = 0; apabila diselesaikan lebih awal, C1 > 0 secara proporsional terhadap sisa waktu yang ada.

#### C2 – Kualitas Laporan

Kriteria ini mengukur proporsi laporan progres teknisi yang dinyatakan valid oleh supervisor. Hanya laporan dengan status validasi *Disetujui* yang diperhitungkan sebagai laporan berkualitas. Apabila teknisi belum pernah mengirimkan laporan, maka C2 = 0.

$$C2_i = \frac{\text{jumlah laporan disetujui}_i}{\text{total laporan}_i} \times 100 \tag{2}$$

#### C3 – Kepatuhan Laporan

Kriteria ini mengukur konsistensi teknisi dalam melaporkan perkembangan pekerjaannya sesuai frekuensi yang telah ditetapkan. Nilai kepatuhan dihitung berdasarkan jumlah tanggal laporan unik yang tercatat dibandingkan dengan total hari lapor yang diharapkan dalam periode penugasan.

$$C3_i = \min\left(100,\ \frac{\text{hari lapor unik}_i}{\text{total hari lapor yang diharapkan}} \times 100\right) \tag{3}$$

Total hari lapor yang diharapkan ditentukan berdasarkan frekuensi pelaporan yang ditetapkan pada penugasan: apabila frekuensi *Harian*, maka total yang diharapkan sama dengan selisih hari antara tanggal mulai dan tenggat; apabila frekuensi *Mingguan*, maka total yang diharapkan adalah $\lceil \text{selisih hari} / 7 \rceil$. Nilai C3 dibatasi maksimum 100 untuk memastikan skor tidak melebihi batas normal.

#### C4 – Proaktivitas

Kriteria ini menghitung jumlah kendala yang berhasil diajukan dan mendapat persetujuan dalam satu penugasan. C4 bersifat global (per tim penugasan), karena setiap kendala yang disetujui berdampak pada keseluruhan anggota tim melalui pemunduran tenggat waktu secara kolektif.

$$C4 = \left|\left\{ k \mid k \in \text{pengajuan kendala},\ \text{penugasan}_k = p,\ \text{status}_k = \text{Disetujui} \right\}\right| \tag{4}$$

Nilai minimum C4 adalah 0 dan tidak memiliki batas atas teoretis; nilai yang besar menunjukkan tim aktif dalam mengidentifikasi dan melaporkan hambatan pekerjaan.

#### C5 – Kompetensi Teknisi

Kriteria ini mencerminkan tingkat keahlian teknisi berdasarkan level lisensi yang dimiliki. Nilai C5 diperoleh dari tabel referensi tunjangan jabatan sebagaimana tercantum pada Tabel 3.X+1. Kriteria ini bersifat statis per teknisi dan tidak dipengaruhi oleh aktivitas dalam penugasan tertentu.

**Tabel 3.X+1 Pemetaan Level Lisensi ke Nilai C5**

| Level Lisensi | Nilai C5 (Rp)  |
|---------------|----------------|
| Level 1       | 500.000        |
| Level 2       | 1.000.000      |
| Level 3       | 1.500.000      |

---

### Penentuan Kriteria Terbaik (*Best*) dan Terburuk (*Worst*)

Langkah awal dalam BWM adalah pengambil keputusan — dalam konteks sistem ini adalah manajer — menentukan satu kriteria yang dianggap paling penting (*Best*, $c_B$) dan satu kriteria yang dianggap paling rendah pengaruhnya (*Worst*, $c_W$) dari kelima kriteria yang tersedia. Penentuan ini dilakukan secara subjektif berdasarkan prioritas operasional yang berlaku pada periode penilaian.

Sebagai ilustrasi pada penelitian ini, manajer menetapkan:

- **Best** ($c_B$) : C1 – Kecepatan Penyelesaian
- **Worst** ($c_W$) : C5 – Kompetensi Teknisi

---

### Penyusunan Vektor *Best-to-Others* (BO)

Manajer selanjutnya memberikan penilaian seberapa lebih penting kriteria terbaik $c_B$ dibandingkan dengan setiap kriteria $c_j$ menggunakan skala perbandingan 1–9 sebagaimana tercantum pada Tabel 3.X+2. Penilaian ini disusun menjadi Vektor *Best-to-Others* ($A_B$):

$$A_B = (a_{B1},\ a_{B2},\ \ldots,\ a_{Bn}) \tag{5}$$

di mana $a_{Bj}$ menyatakan tingkat kepentingan $c_B$ relatif terhadap $c_j$, dan $a_{BB} = 1$ (kriteria terbaik dibandingkan dengan dirinya sendiri).

**Tabel 3.X+2 Skala Perbandingan Preferensi**

| Nilai | Keterangan                  |
|-------|-----------------------------|
| 1     | Sama penting                |
| 2     | Sedikit lebih penting       |
| 3     | Lebih penting               |
| 4     | Cukup lebih penting         |
| 5     | Jauh lebih penting          |
| 6     | Jauh lebih penting (kuat)   |
| 7     | Sangat lebih penting        |
| 8     | Sangat lebih penting (kuat) |
| 9     | Mutlak lebih penting        |

**Tabel 3.X+3 Vektor *Best-to-Others* (Best = C1)**

| Kriteria | Nilai C1 (*Best*) terhadap $c_j$ |
|----------|------------------------------------|
| C1       | 1                                  |
| C2       | 2                                  |
| C3       | 3                                  |
| C4       | 5                                  |
| C5       | 7                                  |

---

### Penyusunan Vektor *Others-to-Worst* (OW)

Selanjutnya, manajer memberikan penilaian seberapa lebih penting setiap kriteria $c_j$ dibandingkan dengan kriteria terburuk $c_W$. Penilaian ini disusun menjadi Vektor *Others-to-Worst* ($A_W$):

$$A_W = (a_{1W},\ a_{2W},\ \ldots,\ a_{nW})^T \tag{6}$$

di mana $a_{jW}$ menyatakan tingkat kepentingan $c_j$ relatif terhadap $c_W$, dan $a_{WW} = 1$ (kriteria terburuk dibandingkan dengan dirinya sendiri).

**Tabel 3.X+4 Vektor *Others-to-Worst* (Worst = C5)**

| Kriteria | Nilai $c_j$ terhadap C5 (*Worst*) |
|----------|------------------------------------|
| C1       | 7                                  |
| C2       | 5                                  |
| C3       | 4                                  |
| C4       | 2                                  |
| C5       | 1                                  |

---

### Model Optimasi Linear BWM

Tujuan utama BWM adalah mencari vektor bobot optimal $w^* = (w_1^*, w_2^*, \ldots, w_n^*)$ yang meminimalkan ketidakkonsistenan ($\xi^*$) antara rasio bobot yang diperoleh dengan nilai preferensi yang diberikan manajer. Model awal berbentuk non-linear sebagai berikut.

$$\min\ \xi^* \tag{7}$$

dengan kendala:

$$\left|\frac{w_B}{w_j} - a_{Bj}\right| \leq \xi^*, \quad \forall j \tag{8}$$

$$\left|\frac{w_j}{w_W} - a_{jW}\right| \leq \xi^*, \quad \forall j \tag{9}$$

$$\sum_{j=1}^{n} w_j = 1, \quad w_j \geq 0, \quad \forall j \tag{10}$$

Karena model non-linear lebih sulit diselesaikan secara komputasional, model tersebut ditransformasikan ke bentuk *Linear Programming* (LP) yang ekuivalen:

$$\min\ \xi^L \tag{11}$$

dengan kendala:

$$w_B - a_{Bj} \cdot w_j \leq \xi^L, \quad \forall j \tag{12}$$

$$a_{Bj} \cdot w_j - w_B \leq \xi^L, \quad \forall j \tag{13}$$

$$w_j - a_{jW} \cdot w_W \leq \xi^L, \quad \forall j \tag{14}$$

$$a_{jW} \cdot w_W - w_j \leq \xi^L, \quad \forall j \tag{15}$$

$$\sum_{j=1}^{n} w_j = 1, \quad w_j \geq 0, \quad \xi^L \geq 0, \quad \forall j \tag{16}$$

Persamaan (12)–(13) memastikan selisih antara $w_B$ dan $a_{Bj} \cdot w_j$ tidak melebihi $\xi^L$ dari kedua arah, sehingga rasio bobot *Best-to-Others* mendekati nilai preferensi manajer $a_{Bj}$. Persamaan (14)–(15) melakukan hal yang sama untuk rasio *Others-to-Worst*. Persamaan (16) menjamin bahwa total seluruh bobot sama dengan satu dan tidak ada bobot yang bernilai negatif.

Penyelesaian model LP tersebut dilakukan secara komputasional menggunakan algoritma iteratif yang dimulai dari bobot awal merata ($w_j = 1/n$) dan secara bertahap menyesuaikan bobot hingga nilai $\xi^L$ mencapai konvergensi. Hasil akhir berupa vektor bobot $[w_1, w_2, w_3, w_4, w_5]$ beserta nilai inkonsistensi minimal $\xi^*$.

---

### Uji Konsistensi (*Consistency Ratio*)

Nilai $\xi^*$ yang lebih kecil menunjukkan bahwa penilaian manajer lebih konsisten. Untuk mengukurnya secara formal, dihitung *Consistency Ratio* (CR):

$$CR = \frac{\xi^*}{CI} \tag{17}$$

Keterangan:
- $CR$ : rasio konsistensi
- $\xi^*$ : nilai inkonsistensi minimal hasil penyelesaian LP
- $CI$ : *Consistency Index*, yaitu nilai referensi berdasarkan $a_{BW}$

Nilai $CI$ ditentukan berdasarkan $a_{BW}$, yaitu nilai perbandingan antara $c_B$ dan $c_W$ yang diambil dari Vektor BO, sebagaimana tercantum pada Tabel 3.X+5.

**Tabel 3.X+5 Tabel *Consistency Index* (CI)**

| $a_{BW}$ | 1    | 2    | 3    | 4    | 5    | 6    | 7    | 8    | 9    |
|----------|------|------|------|------|------|------|------|------|------|
| CI       | 0,00 | 0,44 | 1,00 | 1,63 | 2,30 | 3,00 | 3,73 | 4,47 | 5,23 |

Kriteria penerimaan hasil:

$$CR \leq 0{,}10 \Rightarrow \text{bobot dinyatakan konsisten dan dapat digunakan}$$

$$CR > 0{,}10 \Rightarrow \text{penilaian preferensi harus diulang}$$

Sebagai contoh, apabila $a_{BW} = 7$ dan diperoleh $\xi^* = 0{,}025$, maka:

$$CR = \frac{0{,}025}{3{,}73} = 0{,}007 \leq 0{,}10 \quad \Rightarrow \text{konsisten} \ ✓$$

---

### Normalisasi Matriks Kinerja

Sebelum bobot diterapkan, nilai mentah masing-masing kriteria dari setiap teknisi perlu diseragamkan ke rentang yang sama. Proses ini dilakukan menggunakan *Min-Max Normalization* agar perbedaan satuan antar kriteria tidak memengaruhi perhitungan skor akhir. Karena seluruh kriteria pada penelitian ini berjenis *benefit*, rumus normalisasi yang digunakan adalah:

$$v_{ij} = \frac{x_{ij} - x_j^{\min}}{x_j^{\max} - x_j^{\min}} \times 100 \tag{18}$$

Keterangan:
- $v_{ij}$ : nilai ternormalisasi teknisi ke-$i$ pada kriteria ke-$j$ (skala 0–100)
- $x_{ij}$ : nilai mentah teknisi ke-$i$ pada kriteria ke-$j$
- $x_j^{\min}$ : nilai terendah kriteria $j$ di antara seluruh teknisi dalam satu *batch* penugasan
- $x_j^{\max}$ : nilai tertinggi kriteria $j$ di antara seluruh teknisi dalam satu *batch* penugasan

Normalisasi bersifat dinamis per *batch*, di mana nilai minimum dan maksimum dihitung dari seluruh teknisi yang terlibat dalam satu penugasan yang sama. Dengan demikian, peringkat setiap teknisi bersifat relatif terhadap rekan-rekannya dalam penugasan tersebut.

*Catatan implementasi:* Apabila $x_j^{\max} = x_j^{\min}$ — yang terjadi ketika seluruh teknisi dalam satu *batch* memiliki nilai yang identik pada suatu kriteria — maka $v_{ij}$ ditetapkan bernilai 100 untuk menghindari pembagian dengan nol dan untuk merefleksikan bahwa seluruh teknisi mencapai performa setara pada kriteria tersebut.

---

### Perhitungan Skor Akhir Kinerja

Setelah normalisasi selesai, skor akhir kinerja setiap teknisi ($S_i$) dihitung dengan menjumlahkan hasil perkalian antara nilai ternormalisasi dan bobot masing-masing kriteria. Metode ini dikenal sebagai *Weighted Sum Model* (WSM):

$$S_i = \sum_{j=1}^{n} w_j \times v_{ij} \tag{19}$$

Keterangan:
- $S_i$ : skor akhir kinerja teknisi ke-$i$ (rentang 0–100)
- $w_j$ : bobot kriteria ke-$j$ yang diperoleh dari penyelesaian model LP
- $v_{ij}$ : nilai ternormalisasi teknisi ke-$i$ pada kriteria ke-$j$

Skor akhir $S_i$ merangkum keseluruhan kinerja teknisi ke dalam satu nilai tunggal yang dapat dibandingkan secara langsung antar teknisi dalam satu penugasan.

---

### Rekomendasi Tunjangan Kinerja

Skor akhir $S_i$ digunakan sebagai dasar perhitungan nominal tunjangan kinerja. Besaran tunjangan dihitung secara proporsional terhadap plafon yang telah ditetapkan manajemen berdasarkan nilai skor absolut teknisi:

$$\text{TunjanganKinerja}_i = \text{TunjanganMaks} \times \frac{S_i}{100} \tag{20}$$

Keterangan:
- $\text{TunjanganMaks}$ : batas atas tunjangan kinerja per periode yang ditetapkan manajemen
- $S_i$ : skor kinerja akhir teknisi ke-$i$ pada periode tersebut (skala 0–100)

Pendekatan ini bersifat *absolute scoring*, di mana besaran tunjangan setiap teknisi ditentukan semata-mata oleh skor absolutnya sendiri tanpa bergantung pada skor teknisi lain. Apabila teknisi mencapai skor 100, ia memperoleh tunjangan penuh sebesar $\text{TunjanganMaks}$; apabila skornya di bawah 100, tunjangan yang diterima berkurang secara proporsional.

Hasil perhitungan ini bersifat rekomendasi sistem. Manajer tetap memiliki otoritas untuk melakukan peninjauan dan penyesuaian terhadap nominal yang direkomendasikan sebelum slip gaji diterbitkan.