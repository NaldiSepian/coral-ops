# Hasil Ekstraksi PDF

**Total Halaman:** 43

---

=== HALAMAN 1 ===
TUGAS AKHIR  
 
PENGEMBANGAN SISTEM PENDUKUNG KEPUTUSAN PENGGAJIAN 
TENAGA KERJA BERBASIS KOMPETENSI DAN KINERJA  
MENGGUNAKAN METODE BEST  WORST METHOD  (BWM)  
PADA CV CORAL PALEMBANG  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Disusun  sebagai salah satu syarat menyelesaikan Pendidikan pada  
Jurusan Manajemen Informatika  
Program Studi Sarjana Terapan Manajemen Informatika  
 
 
 
 
 
OLEH:  
NALDI SEPTIAN  
062240833053  
 
 
 
 
 
MANAJEMEN INFORMATIKA  
POLITEKNIK NEGERI SRIWIJAYA  
PALEMBANG  
2026 


=== HALAMAN 2 ===
 
ii 
  DAFTAR ISI  
 
 
HALAMAN JUDU L ................................ ................................ ................................ ... i 
DAFTAR ISI  ................................ ................................ ................................ ...............  ii 
DAFTAR GAMBAR  ................................ ................................ ................................ . iv 
DAFTAR TABEL  ................................ ................................ ................................ ....... v 
BAB I PENDAHULUAN  ................................ ................................ ...........................  1 
1.1 Latar Belakang  ................................ ................................ .........................  1 
1.2 Rumusan Masalah  ................................ ................................ ....................  3 
1.3 Batasan Masalah  ................................ ................................ ......................  3 
1.4 Tujuan dan Manfaat Penelitian  ................................ ................................  3 
1.4.1 Tujuan Penelitian  ................................ ................................ ...........  3 
1.4.2 Manfaat Penelitian  ................................ ................................ .........  3 
1.5 Sistematika Penulisan  ................................ ................................ ..............  4 
BAB II TINJAUAN PUSTAKA  ................................ ................................ ................  5 
2.1 Landasan Teori  ................................ ................................ .........................  5 
2.1.1 Pengertian Sistem Pendukung Keputusan  ................................ ..... 5 
2.1.2 Metode BWM  ................................ ................................ ................  6 
2.1.3 Pengertian Penggajian  ................................ ................................ .... 7 
2.1.4 Pengertian Tenaga Kerja  ................................ ................................  7 
2.1.5 Pengertian Kompetensi  ................................ ................................ .. 7 
2.1.6 Pengertian Kinerja  ................................ ................................ .........  8 
2.1.7 UML ( Unified Modeling Language ) ................................ ..............  8 
2.1.8  Use Case Diagram  ................................ ................................ .........  9 
2.1.9  Activity Diagram  ................................ ................................ ..........  10 
2.1.10  Sequence  Diagram  ................................ ................................ ..... 11 

=== HALAMAN 3 ===
 
iii 
 2.1.11  Class Diagram  ................................ ................................ ...........  12 
2.2 State Of The Art  ................................ ................................ .....................  14 
BAB III METODOLOGI PENELITIAN  ................................ ..............................  17 
3.1 Tahapan Penelitian  ................................ ................................ .................  17 
3.2 Waktu dan Tempat Penelitian  ................................ ................................ . 19 
3.3 Metode Pengumpulan Data  ................................ ................................ .... 19 
3.4 Metode Pengembangan Sistem dan Metode Pemecahan Masalah  ........  20 
3.4.1 Metode Pengembangan Sistem  ................................ ....................  20 
3.4.2 Metode Pemecahan Masalah  ................................ .......................  22 
3.5 Analisis Data /  Analisis Kebutuhan Sistem  ................................ ...........  33 
3.5.1  Flowchart  yang berjalan  ................................ ..............................  33 
3.5.2  Flowchart  yang  diusulkan  ................................ ..........................  34 
3.5.3 Spesikasi Kebutuhan Hardware/Software  ................................ ... 35 
DAFTAR PUSTAKA ................................ ................................ ................................  36 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

=== HALAMAN 4 ===
 
iv 
  DAFTAR GAMBAR  
 
Gambar 3. 1  Tahapan Penelitian  ................................ ................................ ...............  17 
Gambar 3. 2  Metode Waterfall  ................................ ................................ .................  21 
Gambar 3. 3  Rekaptulasi Perhitungan Menggunakan Phyton  ................................ .. 32 
Gambar 3. 4  Flowchart Yang Berjalan  ................................ ................................ ..... 33 
Gambar 3. 5 Flowchart Yang Diusulkan  ................................ ................................ ... 34 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

=== HALAMAN 5 ===
 
v 
  DAFTAR TABEL  
 
Tabel 2. 1  Simbol - simbol Use Case  Diagram  ................................ ...........................  9 
Tabel 2. 2  Simbol - simbol Activity  Diagram  ................................ ............................  10 
Tabel 2. 3  Simbol - simbol Sequence  Diagram  ................................ .........................  11 
Tabel 2. 4  Simbol - simbol Class  Diagram  ................................ ................................  13 
Tabel 2. 6  State Of The Art  ................................ ................................ ........................  14 
Tabel 3. 1  Kriteria Penilaian Kinerja Teknisi  ................................ ............................  22 
Tabel 3. 2  Skala Perbandingan BWM  ................................ ................................ ....... 24 
Tabel 3. 3  Vektor Best -to-Others  (Best = 𝑐1) ................................ ............................  24 
Tabel 3. 4  Vektor Others -to-Worst    (Worst   = 𝑐5) ................................ ....................  25 
Tabel 3. 5  Tabel Consistency Index  (CI) ................................ ................................ .... 27 
Tabel 3. 6  Data Nilai Mentah Kinerja Teknisi  ................................ ...........................  29 
Tabel 3. 7  Matriks Nilai Ternormalisasi v_ij  ................................ .............................  29 
Tabel 3. 8  Hasil Skor dan Peringkat Kinerja Teknisi  ................................ .................  30 
Tabel 3. 9  Rekomendasi Tunjangan Kinerja Bulanan  ................................ ...............  30 
Tabel 3. 10  Rekomendasi Tunjangan Kinerja Proyek  ................................ ...............  31 

=== HALAMAN 6 ===
Politeknik  Negeri  Sriwijaya  
BAB I Pendahuluan  1 
 
 BAB I   
PENDAHULUAN  
1.1   Latar Belakang  
Transisi industri menuju Era 5.0 telah menandai pergeseran fundamental dalam 
cara organisasi memandang aset manusianya. Berbeda dengan Industri 4.0 yang sangat 
bertumpu pada otomatisasi masif, Industri 5.0 menempatkan kembali manusia sebagai 
pusat dari ino vasi teknologi, di mana kolaborasi harmonis antara kecerdasan buatan 
(AI) dan nilai -nilai kemanusiaan menjadi kunci produktivitas  (Iswandi & Kuswinarno, 
2025) . Salah satu instrumen paling krusial dalam M anajemen Sumber Daya Manusia  
yang mengalami tekanan transformasi adalah sistem penggajian atau kompensasi.  
Strategi pemberian imbalan modern telah bergeser menuju pendekatan yang 
lebih dinamis, yaitu penggajian berbasis kompetensi ( Competency -Based Pay ) dan 
penggajian berbasis kinerja ( Performance -Based Pay ). Integrasi kedua konsep ini 
bertujuan untuk memastikan bahwa setiap individu dihargai atas kapasitas 
profesionalnya serta luaran nyata yang dihasilkan bagi organisasi  (Iswandi & 
Kuswinarno, 2025) . Hasil penelitian menunjukkan bahwa terdapat hubungan positif 
dan signifikan antara tingkat kompetensi dengan kinerja karyawan; di mana setiap 
peningkatan kompetensi akan secara langsung meningkatkan kualitas output  kerja. 
Selain itu, kompensasi yang diberikan secara tepat terbukti menjadi faktor pendorong 
utama motivasi dan produktivitas karyawan  (Hapsari, 2023) .  
CV Coral Palembang merupakan entitas jasa yang bergerak di bidang konstruksi, 
pemeliharaan Gedung dan instalasi tower , di mana operasionalnya sangat bergantung 
pada tenaga kerja yang profesional. Bagi CV Coral, tantangan utama terletak pada 
bagaimana memberikan apresiasi yang adil bagi tenaga kerja  yang memiliki 
kompetensi tersertifikasi dan kinerja lapangan yang unggul. Saat ini, penentuan 
insentif masih menghadapi kendala subjektivitas karena belum adanya sistem 
pembobotan kriteria yang baku dan terintegrasi. Belum adanya sistem pembobotan 
kriteria yang baku dan terintegrasi menyebabkan proses pengambilan keputusan sering  
kali tidak konsisten. Pengembangan sistem pendukung keputusan di perusahaan ini 
menjadi sangat penting untuk meningkatkan akurasi perhitungan gaji, efisiensi 
administrasi, serta transparansi yang akan memperkuat loyalitas tenaga kerja ahli di 
tengah persaingan jasa konstruksi y ang semakin ketat.  

=== HALAMAN 7 ===
Politeknik  Negeri  Sriwijaya  
BAB I Pendahuluan  2 
 
 Sebagai upaya untuk mengatasi permasalahan tersebut, diperlukan suatu sistem 
berbasis web yang dapat membantu proses penentuan penggajian secara lebih objektif 
dengan menerapkan metode Best Worst   Method  (BWM). Metode ini dipilih karena 
memiliki kelebihan dalam proses penentuan bobot kriteria, di mana jumlah 
perbandingan yang dilakukan lebih sedikit dibandingkan metode pengambilan 
keputusan multikriteria lainnya, tetapi tetap mampu menghasilkan tingkat ko nsistensi 
penilaian yang tinggi. Penelitian yang dil akukan oleh  (Elanda et al., 2026)  
menunjukkan bahwa penerapan metode BWM dalam pembobotan kriteria evaluasi 
kinerja pemasok mampu menghasilkan bobot yang lebih stabil dan mengurangi 
ketidaksesuaian penilaian antar kriteria. Selain itu, penelitian (Arum, 2023)  juga 
membuktikan bahwa metode BWM efektif digunakan dalam pengukuran kinerja 
industri karena mampu menentukan prioritas kriteria secara sistematis sehingga 
menghasilkan penilaian yang lebih terstruktur.  
Penelitian lain yang dilakukan oleh (Arsetyo, 2021)  terkait pengukuran kinerja 
supplier di PT. Adhi Karya (Persero) Tbk juga menunjukkan bahwa metode BWM 
dapat digunakan untuk menentukan tingkat kepentingan setiap kriteria secara lebih 
akurat dengan tingkat konsistensi penilaian yang baik. Hasil penelitian tersebut 
menunjukkan bahwa BWM mampu memberikan pendekatan yang efektif dalam 
proses evaluasi kinerja yang melibatkan banyak kriteria. Temuan tersebut 
memperlihatkan bahwa metode BWM memiliki potensi yang besar untuk diterapkan 
dalam berbagai sistem penil aian berbasis multikriteria, termasuk dalam proses 
evaluasi kinerja tenaga kerja yang nantinya dapat digunakan sebagai dasar dalam 
penentuan penggajian yang lebih objektif dan terukur.  
Berdasarkan uraian diatas maka dilakukan penelitian tugas akhir untuk membuat 
suatu website  dengan judul  “Pengembangan sistem pendukung keputusan penggajian 
tenaga kerja berbasis kompetensi dan kinerja menggunakan metode Best Worst   
method  (BWM)  pada CV Coral Palembang”.  Diharapkan dengan adanya sistem  ini 
dapat membantu CV . Coral dalam menentukan penggajian berbasis kompetensi dan 
kinerja.  
 

=== HALAMAN 8 ===
Politeknik  Negeri  Sriwijaya  
BAB I Pendahuluan  3 
 
 1.2   Rumusan Masalah  
Berdasarkan latar belakang yang terlah diruaikan, maka rumusan masalah dalam 
penelitian ini yaitu "Bagaimana membuat  sistem pendukung keputusan penggajian 
yang mampu menghasilkan pembobotan kriteria kompetensi dan kinerja secara 
objektif, konsisten, dan transparan menggunakan metode Best Worst   Method  (BWM) 
pada CV Coral Palembang?"  
 
1.3  Batasan Masalah  
Agar penelitian ini lebih terarah dan mendalam, batasan masalah ditetapkan 
sebagai berikut:  
1. Studi kasus yang digunakan dalam penelitan ini yaitu  CV Coral Palembang.  
2. Kriteria penilaian dibatasi pada aspek Kompetensi dan Kinerja sesuai standar 
Perusahaan.  
3. Penentuan bobot prioritas kriteria menggunakan metode Best Worst   Method  
(BWM) untuk meminimalkan inkonsistensi perbandingan antar kriteria.  
 
1.4   Tujuan dan Manfaat Penelitian  
1.4.1 Tujuan Penelitian  
Tujuan dari penelitian ini adalah:  
1. Menganalisis kriteria -kriteria dominan dalam penilaian kompetensi dan kinerja 
tenaga kerja pada CV Coral Palembang.  
2. Menerapkan metode Best Worst   Method  (BWM) dalam menentukan bobot 
kepentingan setiap kriteria secara akurat dan konsisten.  
3. Membangun sebuah Sistem Pendukung Keputusan (SPK) penggajian yang 
transparan dan berbasis data ( data-driven ) untuk mendukung objektivitas 
pemberian upah.  
 
1.4.2 Manfaat Penelitian  
Manfaat yang diharapkan dari tercapainya tujuan penelitian ini adalah:  
1. Meminimalisir kesalahan manusia (human error)  dan subjektivitas dalam proses 
penentuan gaji tenaga kerja.  

=== HALAMAN 9 ===
Politeknik  Negeri  Sriwijaya  
BAB I Pendahuluan  4 
 
 2. Mempercepat proses perhitungan gaji yang sebelumnya dilakukan secara 
manual menjadi terintegrasi dalam sistem.  
3. Menciptakan sistem penggajian yang lebih adil berdasarkan kontribusi nyata 
karyawan, sehingga dapat meningkatkan motivasi kerja.  
 
1.5   Sistematika Penulisan  
Agar mendapatkan gambaran jelas mengenai isi dari pembahasannya, maka 
penelitian ini dibagi menjadi lima bab. Secara garis besar sistematika pembahasannya 
sebagai berikut:  
BAB I  PENDAHULUAN  
Pada bab ini penulis akan mengemukakan garis besar mengenai Penelitian 
ini secara singkat dan jelas mengenai latar belakang, perumusan masalah, 
batasan masalah, tujuan penelitian, manfaat penelitian, metodologi 
penelitian dan sistematika penulisan.  
BAB II  TINJAUAN PUSTAKA  
Pada bab ini penulis menguraikan secara singkat mengenai landasan teori 
yang digunakan dalam penelitian. Landasan teori dan state of the art yang 
berkaitan dengan judul dan istilah -istilah yang dipakai dalam pembuatan 
penelitian.  
BAB III  METODOLOGI PENELITIAN  
Pada bab ini penulis akan menjelaskan tentang tahapan penelitian, waktu 
dan tempat penelitian, metode yang akan digunakan, dan anasilis data data 
serta menguraikan konsep perangkat lunak yang akan dibuat.  
BAB IV  HASIL DAN PEMBAHASAN  
Pada bab ini penulis akan menjelaskan spesifikasi, rancangan perangkat 
lunak, dan pembahasan sistem yang dibuat serta hasil pengujian terhadap 
sistem yang telah dibuat.  
BAB V  KESIMPULAN DAN SARAN  
Pada bab ini berisi kesimpulan dari permasalahan yang telah dibahas dan 
dianalisa. Maka pada akhir penulisan dikemukakan saran -saran yang 
berhubungan dengan permasalahan yaang telah dibahas.  

=== HALAMAN 10 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   5 
 
 BAB II  
TINJAUAN PUSTAKA  
 
2.1      Landasan Teori  
2.1.1    Pengertian Sistem Pendukung Keputusan  
Dalam dunia manajemen, sistem pendukung keputusan hadir sebagai solusi 
berbasis komputer yang dirancang untuk membantu para pimpinan dalam 
memecahkan masalah yang kompleks dan tidak rutin melalui pemanfaatan data serta 
model analisis yang tepat. (Patanduk & Purnomo, 2025)  mencontohkan bahwa sistem 
ini sangat berguna untuk menilai kelayakan kebijakan perusahaan, seperti dalam 
menentukan kenaikan gaji karyawan secara lebih objektif.  
Sejalan dengan hal tersebut,  (Sari & Purba, 2025)  menekankan bahwa 
penggunaan sistem ini bertujuan untuk meminimalisir penilaian yang bersifat 
subjektif, sehingga proses seleksi atau perubahan status karyawan menjadi lebih 
akurat.  
Berdasarkan referensi tersebut,  bahwa sistem pendukung keputusan adalah alat 
bantu strategis yang mengintegrasikan data dengan metode perhitungan tertentu untuk 
menghasilkan keputusan organisasi yang lebih transparan dan dapat 
dipertanggungjawabkan.  
2.1.1.1  Manfaat dan Tujuan SPK  
Dalam literatur Sulianta, keberadaan SPK dipandang sebagai instrumen krusial 
untuk memperkuat kualitas keputusan dalam lingkungan yang dinamis.  
Tujuan Implementasi SPK:  
1) SPK hadir untuk mengisi celah pada masalah yang tidak bisa diselesaikan hanya 
dengan prosedur rutin, namun masih membutuhkan sentuhan intuisi manusia.  
2) Fokus utamanya adalah memastikan bahwa keputusan yang diambil adalah 
keputusan yang "tepat", bukan sekadar keputusan yang "cepat".  
3) Meletakkan teknologi sebagai mitra bagi pengambil keputusan untuk memperkuat 
argumen dan analisis, tanpa mengesampingkan kontrol manusia.  
Manfaat Implementasi SPK:  
1) Dengan menggunakan kriteria yang terukur, SPK membantu meminimalkan 
pengaruh emosional atau preferensi pribadi yang tidak relevan.  

=== HALAMAN 11 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   6 
 
 2) Memungkinkan pengguna untuk menguji berbagai skenario ( simulation ) guna 
melihat dampak dari setiap pilihan sebelum benar -benar diterapkan.  
3) Mempermudah pencarian dan pengolahan data dalam volume besar menjadi 
informasi yang siap pakai bagi para manajer.  
 
2.1.1.2  Struktur SPK  
Menurut kerangka kerja Sulianta, sistem ini terdiri dari beberapa lapisan 
struktur yang saling berinteraksi:  
1) Berperan sebagai fondasi yang menampung seluruh informasi (database). Tanpa 
penyimpanan data yang tertata, sistem tidak memiliki bahan mentah untuk diolah.  
2) Merupakan komponen mesin pengolah yang berisi logika, rumus statistik, atau 
algoritma tertentu. Di sinilah data diubah menjadi prediksi atau peringkat pilihan.  
3) Jembatan komunikasi antara sistem dan manusia. Struktur ini dirancang agar 
pengguna dapat memberikan perintah dan memahami hasil analisis tanpa harus 
menguasai bahasa pemrograman yang rumit.  
4) Lapisan pendukung yang menyediakan wawasan tambahan atau basis pengetahuan 
pakar untuk memperdalam akurasi rekomendasi yang diberikan oleh model.  
 
2.1.2 Metode BWM  
Metode Best Worst   Method  (BWM) merupakan salah satu teknik analisis yang 
populer dalam pengambilan keputusan karena kemampuannya menyederhanakan 
proses penentuan bobot kriteria. (Elanda et al., 2026)  memaparkan bahwa keunggulan 
utama BWM terletak pada efisiensinya dalam menghasilkan data yang konsisten, 
karena hanya memfokuskan perbandingan antara kriteria yang dianggap paling 
penting (terbaik) dan yang paling tidak penting (terburuk).  
(Arum, 2023)  juga menegaskan bahwa metode ini sangat efektif untuk 
mengukur performa di berbagai sektor industri karena mampu mengurai kompleksitas 
penilaian menjadi lebih sederhana melalui perbandingan referensi yang jelas.  
Berdasarkan uraian di atas, Best Worst   Method  adalah metode pembobotan 
yang praktis dan akurat, yang bekerja dengan cara membandingkan dua kutub kriteria 
utama untuk menghasilkan keputusan yang lebih konsisten dan objektif.  

=== HALAMAN 12 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   7 
 
 2.1.3    Pengertian Penggajian  
Penggajian merupakan bagian vital dalam manajemen SDM yang berkaitan 
erat dengan pemberian imbalan atas dedikasi dan kontribusi para tenaga kerja. 
(Pamungkas et al., 2025)  menjelaskan bahwa pengelolaan gaji yang mencakup 
pemberian bonus memerlukan perhitungan yang teliti berdasarkan kriteria tertentu 
agar pembagiannya terasa adil bagi seluruh karyawan.  
Sementara itu, (Patanduk & Purnomo, 2025)  melihat sistem penggajian sebagai 
proses evaluasi untuk menentukan imbalan yang layak, yang harus didasarkan pada 
standar yang jelas demi menjaga semangat kerja dan keseimbangan finansial 
perusahaan.  
Berdasarkan uraian di atas, penggajian adalah sistem pemberian kompensasi 
yang terukur, mencakup gaji pokok dan tambahan insentif, yang pengelolaannya 
memerlukan landasan evaluasi yang kuat agar tercipta keadilan di lingkungan kerja.  
 
2.1.4    Pengertian Tenaga Kerja  
Tenaga kerja adalah motor penggerak sekaligus aset paling berharga yang 
dimiliki oleh sebuah organisasi untuk mencapai target -target besarnya. (Iswandi & 
Kuswinarno, 2025)  menyoroti bahwa di tengah perkembangan teknologi, tenaga kerja 
dituntut untuk terus mengembangkan kapasitas diri agar tetap relevan dengan 
kebutuhan industri di era digital.  
Di sisi lain,  (Sari & Purba, 2025)  menjelaskan bahwa setiap tenaga kerja, baik 
yang berstatus kontrak maupun tetap, perlu dipantau kualitasnya melalui penilaian 
yang mendalam terhadap kontribusi yang mereka berikan selama ini.  
Dari kedua pendapat di atas, tenaga kerja merupakan modal manusia yang 
dinamis, di mana keberhasilannya sangat bergantung pada kemampuan untuk terus 
belajar dan konsistensi dalam memberikan performa terbaik bagi perusahaan.  
 
2.1.5    Pengertian Kompetensi  
Kompetensi bukan sekadar tentang apa yang diketahui seseorang, melainkan 
gabungan utuh antara pengetahuan, keterampilan praktis, dan sikap kerja yang 
ditunjukkan saat bertugas. (Hapsari, 2023)  mengungkapkan bahwa analisis terhadap 
kompetensi karyawan adalah kunci utama dalam merancang strategi untuk 

=== HALAMAN 13 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   8 
 
 mendongkrak performa kerja, karena kemampuan individu merupakan penentu utama 
kualitas hasil akhir.  
(Arsetyo, 2021)  juga menambahkan bahwa kompetensi teknis harus bisa 
diukur secara nyata melalui berbagai metode penilaian agar perusahaan memiliki 
standar kualitas yang terjaga.  
Berdasarkan definisi tersebut, kompetensi adalah kapasitas menyeluruh yang 
dimiliki seseorang, mencakup kecerdasan berpikir dan keterampilan teknis, yang 
menjadi landasan utama dalam mencapai target kerja yang profesional.  
 
2.1.6    Pengertian Kinerja  
Kinerja mencerminkan sejauh mana seorang karyawan mampu memberikan 
hasil nyata, baik secara kualitas maupun kuantitas, dalam menjalankan tanggung 
jawab yang diembannya. (Nurbaiti et al., 2026)  menjelaskan bahwa penilaian kinerja 
merupakan langkah sistematis untuk mengukur seberapa efektif kerja seseorang, yang 
nantinya akan menjadi basis data penting bagi pengambilan keputusan manajerial. 
Selain itu,  
(Yazid et al., 2024)  berpendapat bahwa kinerja yang baik tidak hanya diukur 
dari angka semata, tetapi juga dari kontribusi nyata karyawan dalam mendukung 
keberhasilan organisasi dalam jangka panjang. Berdasarkan referensi tersebut, kinerja 
adalah wujud keberhasilan kerja indiv idu dalam periode waktu tertentu yang 
dievaluasi dengan kriteria objektif sebagai cerminan produktivitas organisasi secara 
menyeluruh.  
 
2.1.7    UML ( Unified Modeling Language ) 
UML adalah bahasa pemodelan visual standar yang digunakan untuk 
merancang arsitektur, perilaku, dan struktur sistem perangkat lunak guna memastikan 
kesesuaian antara kebutuhan pengguna dan implementasi teknis.  (Lengkey et al., 
2024)  Dalam penelitian ini, UML didefinisikan sebagai "bahasa standar" ( standard 
language ) yang digunakan untuk memvisualisasikan, menspesifikasikan, 
membangun, dan sistem.  
Dalam pandangan  (Harliana et al., 2024) , UML adalah bahasa standar industri 
yang digunakan untuk memetakan dan mendokumentasikan komponen perangkat 

=== HALAMAN 14 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   9 
 
 lunak. Fungsi utamanya adalah memastikan adanya kesepahaman mengenai struktur 
dan perilaku sistem yang akan dibangun sebelum proses penulisan kode dilakukan.  
 
2.1.8    Use Case Diagram  
(Faruqi & Ramadhan, 2024)  menjelaskan bahwa Use Case  Diagram  adalah 
model yang menggambarkan perilaku sistem melalui interaksi antara aktor dan sistem 
itu sendiri.Fokus utamanya adalah mendeskripsikan urutan langkah -langkah yang 
dilakukan aktor dan bagaimana sistem merespons permintaan tersebut.  
Menurut (Nursaada, 2025) , Use Case  Diagram  didefinisikan sebagai diagram 
yang merincikan fungsionalitas sistem. Diagram ini berfungsi sebagai acuan dasar 
untuk mengetahui kebutuhan sistem dari sudut pandang pengguna, sehingga 
pengembang dapat memahami fitur -fitur apa saja yang wajib ada . 
Use Case  Diagram  adalah model visual yang memetakan fungsionalitas sistem 
dan interaksinya dengan pengguna (aktor), yang bertujuan untuk memperjelas ruang 
lingkup fitur yang akan dibangun.  Adapun daftar simbol -simbol utama yang digunakan 
dalam Use Case  Diagram  beserta fungsinya disajikan pada Tabel 2.1 berikut:  
Tabel 2. 1 Simbol - simbol Use Case  Diagram  
 
 No. Gambar  Nama  Keterangan  
1. 
 Actor  Mewakil pengguna,  yang 
berkomunikasi  dengan  Use Case  
2. 
 
 Use Case  Menunjukkan  gambaran  umum antara 
sistem dan aktor.  
3. 
 Association  Abstraksi  dari penghubung antara aktor 
dengan Use Case . 


=== HALAMAN 15 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   10 
 
 Lanjutan  Tabel 2. 1 Simbol - simbol Use Case Diagram  
Sumber: (Harefa et al., 2024)  
 
2.1.9  Activity Diagram  
Menurut (Darmawan et al., 2025) , Activity Diagram  adalah diagram yang 
memvisualisasikan urutan logika dari satu aktivitas ke aktivitas lainnya, bagaimana 
sistem memulai proses, keputusan yang mungkin terjadi ( decision ), dan bagaimana 
proses tersebut berakhir. Fungsinya mirip dengan Flowchart , namun dirancang khusus 
untuk memodelkan tingkah laku sistem berorientasi objek.  
Sementara itu, (Faruqi & Ramadhan, 2024)  menjelaskan bahwa Activity 
Diagram  berfungsi untuk sebagai representasi grafis yang menjelaskan aktivitas -
aktivitas apa saja yang dapat dilakukan oleh pengguna (aktor) terhadap sistem dan 
bagaimana respon sistem terhadap aksi tersebut.  
Activity Diagram adalah diagram yang memvisualisasikan rangkaian langkah 
atau aktivitas dalam sistem secara berurutan, mulai dari inisiasi hingga penyelesaian, 
untuk menjelaskan logika operasional suatu proses.  Adapun simbol -simbol standar 
yang digunakan dalam diagram aktivitas disajikan pada Tabel 2.2 berikut:  
Tabel 2. 2 Simbol - simbol Activity Diagram  
No. Gambar  Nama  Keterangan  
1.  
 Status  Awal  Titik  awal  dimulainya  proses dari 
sebuah diagram aktivitas  
 
No. Gambar  Nama  Keterangan  
4. 
  
Generalization  Spesialisasi peran aktor untuk dapat 
berpartisipasi dengan Use Case . 
5. 
<<include>>   
Include  Suatu  Use Case  mengandung fungsi 
dari Use Case  lainnya.  
6. 
<<ectend>>  Extend  Suatu Use Case  menambahkan fungsi 
dari Use Case  lain, jika suatu kondisi 
terpenuhi.  

=== HALAMAN 16 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   11 
 
 Lanjutan  Tabel 2. 2 Simbol - simbol Activity Diagram  
No. Gambar  Nama  Keterangan  
2.  
 Aktivitas  Tindakan  atau proses  yang 
dilakukan oleh sistem.  
3.  
 Percabangan/  
Decision  Keputusan yang memilih lebih dari 
satu pilihan tindakan.  
4.  
 Penggabungan/  
Join Beberapa  aktivitas  yang 
digabungkan menjadi satu.  
5.  
 Status Akhir  Titik  akhir  selesainya  proses dari 
sebuah diagram.  
 
6.  
  
Swimlane  Pemisah yang menunjukkan 
tanggung jawab entitas terhadap 
aktivitas dalam diagram.  
Sumber:  (Harefa et al., 2024)  
 
2.1.10   Sequence  Diagram  
(Setiawan et al., 2022)  menjelaskan bahwa Sequence Diagram  berfungsi untuk 
memodelkan perilaku objek dalam sebuah Use Case . Diagram ini secara spesifik 
mendeskripsikan masa hidup ( lifeline ) objek serta aliran pesan ( message ) yang dikirim 
dan diterima antar objek tersebut selama proses berlangsung.  
Dalam pandangan (Munthe et al., 2022) , Sequence Diagram  menggambarkan 
bagaimana objek -objek  termasuk komponen internal sistem dan aktor eksternal  
berinteraksi satu sama lain. Fokus utama diagram ini adalah representasi pesan 
(message ) yang diurutkan terhadap dimensi waktu.  
Sequence  Diagram  adalah diagram interaksi yang menggambarkan urutan 
waktu pengiriman pesan antar objek dalam sistem, yang berfungsi untuk memvalidasi 
logika alur eksekusi program secara detail.  Simbol -simbol dasar yang digunakan untuk 
menggambarkan interaksi tersebut dapat dilihat pada Tabel 2.3 berikut:  
Tabel 2. 3 Simbol - simbol Sequence  Diagram  
No. Gambar  Nama  Keterangan  
1  Actor  Segala sesuatu yang berinteraksi 
terhadap sistem aplikasi komputer.  


=== HALAMAN 17 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   12 
 
 Lanjutan  Tabel 2. 3 Simbol - simbol Sequence  Diagram  
No. Gambar  Nama  Keterangan  
2 
 
Entity  Class  Menunjukkan jenis hubungan yang 
akan dilaksanakan dalam sistem.  
3 
 Boundary  
Class  Menggambarkan  batas -batas  dari 
sebuah sistem . 
4 
 
Control  Class  Merepresentasikan penghubung 
antara batas ( boundary ) dengan tabel . 
5  
Pesan tipe  send Menandai  titik awal  hingga  akhir dari 
sebuah pesan ( message ). 
6 
 Message  Menggambarkan proses pengiriman 
atau pertukaran pesan.  
Sumber: (Harefa et al., 2024)  
 
2.1.11   Class  Diagram  
(Darmawan et al., 2025)  menjelaskan bahwa Class Diagram  berfungsi untuk 
membentuk struktur sistem dengan cara mendefinisikan komponen -komponen 
utamanya, yakni kelas ( classes ), atribut ( attributes ) yang melekat padanya, serta pola 
hubungan ( relationships ) yang terjalin antar kelas tersebut.  
(Ramadhan & Ma’sum, 2025)  menekankan peran Class Diagram  sebagai 
landasan pembentukan objek. diagram ini sering digunakan sebagai acuan utama untuk 
merancang skema basis data, karena ia memvisualisasikan relasi antar tabel (seperti 
One-to-One, One-to-Many ) yang diperlukan untuk menyimpan data laporan dan data 
pengguna secara terstruktur.  


=== HALAMAN 18 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   13 
 
 Class  Diagram  adalah diagram struktur yang memetakan elemen -elemen 
penyusun sistem (kelas) beserta properti dan hubungannya, yang digunakan sebagai 
cetak biru dalam perancangan basis data dan kode program.   
Tabel 2. 4 Simbol - simbol Class  Diagram  
No. Gambar  Nama  Keterangan  
1 
 Dependency  Pemakaian dependency dipilih 
untuk menunjukkan operasi pada 
suatu Class  yang menerapkan 
Class  yang lainnya.  
2  
Class  Kelompok  objek  dengan  atribut  
dan operasi yang identik.  
3 
 Nary 
Association  Kelompok  objek  dengan  atribut  
dan operasi yang identik.  
4 
 Realization  Implementasi  aktual  suatu  operasi 
oleh sebuah objek . 
5 
 
Collaboration  Uraian  tindakan  yang  
menghasilkan luaran terukur untuk 
suatu aktor.  
6 
 Generalization  Hubungan hierarkis antara objek 
child (anak) dan objek parent 
(induk)  dengan  perilaku  yang  
sama.  
Sumber: (Harefa et al., 2024)  
 


=== HALAMAN 19 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   14 
 
 2.2      State Of The Art  
 State Of The Art  berguna untuk memberikan gambaran mendalam mengenai 
barbagai inovasi, temuan, serta kemajuan yang telah dicapai dalam bidang yang 
berhubungan dengan temuan yang dilaksanakan . 
Tabel 2. 5 State Of The Art  
No Referensi (Penulis, Tahun, 
Judul)  Masalah  Metode  Hasil  
1 Elanda, R. W., dkk. (2026)  
Pembobotan Kriteria 
Evaluasi Kinerja Pemasok 
dengan Mempertimbangkan 
Risiko Gangguan 
Menggunakan Metode Best 
Worst   Method.  Ketidakpastian 
pasokan akibat 
risiko gangguan 
operasional pihak 
eksternal.  Best Worst   
Method  
(BWM)  Penentuan bobot 
kriteria yang 
lebih stabil 
terhadap risiko 
gangguan luar.  
2 Arum, W. M. (2023)  
Pengukuran kinerja industri 
asuransi di indonesia 
dengan menggunakan Best 
Worst   method (bwm) 
(doctoral dissertation, 
universitas lampung).  Kompleksitas 
indikator kinerja 
pada sektor 
industri keuangan 
asuransi.  Best Worst   
Method  
(BWM)  Identifikasi 
kriteria utama 
yang paling 
berpengaruh pada 
performa 
asuransi.  
3 Yazid, M., dkk. (2024)  
Evaluasi Kinerja Usaha 
Ternak Lebah Madu Dalam 
Mendukung Pengelolaan 
Hutan Lestari  Kurangnya 
evaluasi objektif 
pada usaha ternak 
madu di area 
hutan.  Evaluasi 
Kinerja 
(Analisis 
Deskriptif)  Strategi 
optimalisasi 
ternak lebah 
untuk 
keberlanjutan 
ekosistem hutan.  
4 Salva, L., dkk. (2025)  
Pengukuran Kinerja Gudang 
Bahan Baku Industri Semen 
Menggunakan Frazelle 
Model dan Best–Worst   
Method.  Rendahnya 
efisiensi 
manajemen stok 
dan operasional 
gudang semen.  Frazelle 
Model  & 
BWM  Rekomendasi 
perbaikan tata 
kelola gudang 
berdasarkan 
bobot 
kepentingan KPI.  
 
 

=== HALAMAN 20 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   15 
 
 Lanjutan  Tabel 2. 6 State Of The Art  
No Referensi (Penulis, 
Tahun, Judul)  Masalah  Metode  Hasil  
5 Arsetyo, R. (2021)  
Pengukuran Kinerja 
Supplier dengan 
Menggunakan Metode 
Best Worst   Method, 
OMAX, dan TLS di PT. 
Adhi Karya (Persero) 
TBK (Doctoral 
dissertation, Universitas 
Brawijaya).  Evaluasi 
pemasok di 
proyek 
konstruksi yang 
belum terukur 
secara 
mendalam.  BWM, OMAX, 
& Traffic Light 
System  Penilaian kinerja 
pemasok yang 
divisualisasikan 
melalui status 
indikator warna.  
6 Priyati, P., dkk. (2022)  
Analisis Pemilihan 
Pemasok Hijau Komoditi 
Kaolin Dengan 
Menggunakan Integrasi 
Metode BWM -
PROMETHEE Pada PT. 
XYZ.  Sulitnya 
memilih 
pemasok yang 
memenuhi 
standar ramah 
lingkungan 
(green ). Integrasi BWM 
& 
PROMETHEE  Pemilihan pemasok 
terbaik dengan 
kriteria 
keberlanjutan 
lingkungan yang 
akurat.  
7 Putra, M. R. Z. (2024)  
Evaluasi Pemilihan 
Supplier Sayur Pada PT 
Dwi Tunggal Citra 
Catering Dengan Metode 
Analitycal Hierarchy 
Process (AHP) dan Best 
Worst   Method (BWM).  Subjektivitas 
tinggi dalam 
pemilihan 
vendor bahan 
pangan catering.  AHP & Best 
Worst   Method  
(BWM)  Perbandingan 
efisiensi 
menunjukkan 
BWM lebih 
ringkas dibanding 
AHP.  
8 Rahmaningtyas (2022)  
Penentuan pemilihan 
posisi pemain basket 
dengan fuzzy dan Best 
Worst   method (Doctoral 
dissertation, Universitas 
Islam Negeri Maulana 
Malik Ibrahim).  Penentuan 
posisi pemain 
basket yang 
sering kali 
bersifat 
spekulatif.  Fuzzy Logic  & 
BWM  Sistem 
rekomendasi posisi 
pemain 
berdasarkan 
kemampuan teknis 
individu.  
 
 

=== HALAMAN 21 ===
Politeknik  Negeri  Sriwijaya  
BAB II Tinjauan Pustaka   16 
 
 Lanjutan  Tabel 2. 6 State Of The Art  
No Referensi (Penulis, 
Tahun, Judul)  Masalah  Metode  Hasil  
9 Patanduk & Purnomo 
(2025)  
Sistem Pendukung 
Keputusan Menentukan 
Kelayakan Kenaikan Gaji 
Karyawan Menggunakan 
Metode Weighted Product 
(WP)(Studi Kasus: Gading 
Mas Yogyakarta).  Ketidakadilan dan 
kurangnya 
transparansi dalam 
proses penilaian 
kenaikan upah.  Weighted 
Product  
(WP)  Terciptanya 
transparansi dan 
keakuratan dalam 
menentukan 
kelayakan gaji.  
10 Sari & Purba (2025)  
Sistem Pendukung 
Keputusan Penentuan 
Karyawan Kontrak 
Menjadi Karyawan Tetap 
Pada PT. Pilar Deli 
Labumas I Dengan 
Menggunakan Metode 
Simple Additive 
Weighting.  Sulitnya 
menetapkan 
standar objektif 
untuk 
pengangkatan 
karyawan tetap.  Simple 
Additive 
Weighting  
(SAW)  Memudahkan 
HRD dalam 
perangkingan 
karyawan 
berdasarkan 
kriteria 
perusahaan.  
 
Penelitian ini membawa sesuatu yang baru karena menggabungkan aspek 
kompetensi dan kinerja karyawan sebagai acuan utama dalam menentukan penggajian 
di CV Coral Palembang. Jika banyak penelitian sebelumnya lebih fokus menggunakan 
Best Worst   Method  (BWM) untuk urusan logistik atau pemilihan supplier, penelitian 
ini justru memanfaatkan keunggulan BWM untuk membedah kerumitan penilaian 
performa karyawan yang sering kali bersifat subjektif. Keunggulan utama dari 
pendekatan ini adalah efisiensinya; diba ndingkan metode lain seperti AHP atau SAW 
yang sering dipakai dalam studi serupa, BWM menawarkan proses penilaian yang 
lebih ringkas namun tetap memiliki akurasi tinggi. Dengan demikian, sistem yang 
dibangun tidak hanya menjadi alat hitung biasa, tetapi ma mpu memberikan 
rekomendasi gaji yang jauh lebih objektif, transparan, dan adil bagi seluruh karyawan.  
 
 

=== HALAMAN 22 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  17 
 
 BAB III  
METODOLOGI PENELITIAN  
 
3.1      Tahapan Penelitian  
Penelitian ini mencakup dari seluruh tahapan yang terstruktur. Setiap tahapan 
dirancang untuk mencapai tujuan penelitian secara efektif, mulai dari tahap  identifikasi 
masalah, pengumpulan data, analisis data, Penerapan Metode BWM, Evaluasi Metode 
BWM, Implementasi Sistem, Pengujian dan Evaluasi Sistem  
Berikut merupakan penjelasan dari tahapan penelitian:  
1. Tahap identifikasi masalah  
Pada tahap awal ini, dilakukan pengamatan terhadap proses penggajian yang 
berjalan di CV Coral Palembang. Fokus utama adalah mengidentifikasi kendala dalam 
penilaian kompetensi dan kinerja tenaga kerja yang masih bersifat subjektif atau belum 
terintegrasi,  sehingga diperlukan solusi berupa sistem pendukung keputusan.  
 
Gambar 3. 1 Taha pan Penelitian  

=== HALAMAN 23 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  18 
 
 2. Pengumpulan data  
Data yang dibutuhkan untuk penelitian ini dikumpulkan melalui beberapa teknik, 
antara lain:  
a) Observasi: Mengamati langsung proses administrasi dan manajemen SDM di 
CV Coral.  
b) Wawancara: Berdiskusi dengan pihak manajemen untuk menentukan kriteria -
kriteria kompetensi dan kinerja.  
c) Studi Pustaka: Mencari referensi terkait metode Best Worst   Method  (BWM) 
dan literatur sistem penggajian.  
d) Dokumentasi; Mengumpulkan dokumen pendukung yang digunakan sebagai 
bahan dalam pengembangan sistem.  
3. Analisis data  
Data yang telah terkumpul kemudian diolah untuk menentukan variabel -variabel 
yang akan digunakan dalam sistem. Tahap ini mencakup analisis kebutuhan fungsional 
sistem dan pendefinisian kriteria serta sub -kriteria yang akan dihitung menggunakan 
bobot BWM.  
4. Penerapan Metode BWM  
Langkah -langkah metode Best Worst   Method  (BWM) diterapkan untuk mencari 
bobot prioritas dari setiap kriteria.  
a) Menentukan kriteria terbaik ( Best) dan terburuk ( Worst  ). 
b) Melakukan perbandingan berpasangan antara kriteria terbaik dengan kriteria 
lainnya, serta kriteria lainnya dengan kriteria terburuk.  
c) Menghitung nilai bobot optimal untuk setiap kriteria penggajian.  
5. Evaluasi Metode BWM  
Setelah bobot diperoleh, dilakukan uji konsistensi ( Consistency Ratio ) untuk 
memastikan bahwa penilaian perbandingan yang dilakukan valid. Jika nilai rasio 
konsistensi mendekati nol, maka hasil pembobotan dianggap konsisten dan dapat 
digunakan sebagai dasar perhitungan gaji.  
6. Implementasi Sistem  
Pada tahap ini, hasil analisis dan metode yang telah diuji diterjemahkan ke dalam 
bahasa pemrograman (pengembangan web). Tahap ini meliputi pembuatan basis data, 

=== HALAMAN 24 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  19 
 
 perancangan antarmuka pengguna ( user interface ), dan pengkodean logika 
perhitungan gaji berbasis kompetensi dan kinerja.  
7. Pengujian dan Evaluasi Sistem  
Sistem yang telah selesai dibangun akan diuji menggunakan metode Black Box 
Testing  untuk memastikan semua fitur berfungsi dengan baik. Evaluasi dilakukan 
untuk melihat sejauh mana sistem ini membantu CV Coral Palembang dalam 
menghasilkan keputusan penggajian yang lebih akurat dan objektif.  
 
3.2      Waktu dan Tempat Penelit ian 
Penelitian ini dilaksanakan pada CV . Coral, yang beralamat di Jl. HKBP H. 
Umar No.26, Ario Kemuning, Kec. Kemuning, Kota Palembang, Sumatera Selatan.  
Penelitian ini dilaksanakan selama kurang lebih 4 bulan, terhitung mulai dari bulan 
Februari  sampai dengan Mei tahun 202 6. 
 
3.3     Metode Pengumpulan Data  
Metode pengumpulan data yang dilakukan penulis untuk mendukung 
tercapainya pengumpulan data yaitu melakukan kegiatan berikut:  
1. Metode Observasi  
Peneliti  melakukan pengamatan secara langsung terhadap proses operasional di 
CV Coral Palembang,  khususnya mengenai mekanisme penilaian kinerja, pendataan 
kompetensi karyawan, serta sistem penggajian yang sedang berjalan saat ini.  
2. Metode Wawancara  
Peneliti  melakukan tanya jawab secara langsung dengan pihak terkait, yaitu  
Manager  di CV Coral Palembang. Hal ini bertujuan untuk memahami kriteria 
kompetensi dan indikator kinerja yang akan digunakan dalam perhitungan metode 
BWM.  
Berikut beberapa pertanyaan yang penulis ajukan:  
a) Bagaimana prosedur perhitungan gaji karyawan di CV Coral Palembang saat 
ini? 
b) Apa saja indikator utama yang digunakan CV Coral Palembang  dalam menilai 
kompetensi (keahlian) dan kinerja karyawan sebagai dasar penentuan besaran 
gaji?  

=== HALAMAN 25 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  20 
 
 c) Dari semua kriteria yang ada , mana yang menurut Bapak/Ibu paling penting dan 
menjadi prioritas utama dalam sistem penggajian?  
d) Sebaliknya, kriteria mana yang dianggap memiliki pengaruh paling kecil atau 
kurang signifikan terhadap penentuan gaji di CV Coral Palembang  ini? 
3. Studi Pustaka  
Peneliti melakukan pengumpulan berbagai referensi dari buku, jurnal ilmia, serta 
penelitian penelitian terdahulu yang relevan, khususnya literatur yang mengkaji 
penerapan me tode Best Worst   Method  (BWM)  dan Teori manajemen sumber daya 
manusia terkait penggajian dan kinerja.  
4. Dokumentasi  
Seluruh tahapan penelitian didokumentasikan secara sistematis, mulai dari tahap 
perancangan sistem, pengumpulan data kriteria kompetensi dan kinerja, hingga 
implementasi perhitungan metode Best Worst   Method  (BWM) ke dalam sistem 
berbasis web. Dokumentasi ini juga mencakup hasil analisis serta pengujian sistem 
guna memastikan efektivitasnya dalam mendukung proses pengambilan keputusan 
penggajian tenaga kerja di CV Coral Palembang agar lebih transparan dan efi sien. 
 
3.4     Metode Pengembangan Sistem dan Metode Pemecahan Masalah  
3.4.1 Metode Pengembangan Sistem  
Metode pengembangan sistem yang digunakan dalam penelitian ini adalah 
Model Waterfall . Metode ini sering disebut juga sebagai Class ic life cycle  (siklus hidup 
klasik).  Metode Waterfall  adalah model pengembangan sistem yang dilakukan secara 
sekuensial atau terurut dari satu fase ke fase berikutnya. Menurut (Fadillah & 
Wulandari, 2025) , tahapan ini dimulai dari analisis kebutuhan, desain sistem, 
penulisan kode program, pengujian, hingga pemeliharaan. Setiap tahapan harus 
diselesaikan sepenuhnya sebelum melangkah ke tahapan selanjutnya . 
Pendekatan ini dipilih karena setiap tahapan dalam metode Waterfall  harus 
diselesaikan secara utuh sebelum melangkah ke tahapan berikutnya, sehingga 
meminimalisir kesalahan identifikasi kebutuhan di tahap awal dan menghasilkan 
dokumentasi sistem yang lebih terstruktur. Hal ini sangat relevan dengan 
pengembangan sistem pad a CV . Coral yang membutuhkan alur kerja yang jelas dan 
terukur . 

=== HALAMAN 26 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  21 
 
 Berikut adalah uraian rinci dari setiap tahapan metode Waterfall  yang 
diimplementasikan dalam penelitian ini:  
1. Analisis Kebutuhan ( Requirements Analysis ) 
Pada tahap ini, penulis menganalisis kebutuhan sistem berdasarkan data yang 
diperoleh dari hasil wawancara dan observasi di CV Coral Palembang. Fokus 
utamanya adalah menentukan kriteria kompetensi dan kinerja karyawan, serta 
memahami bagaimana algoritma BW M akan diterapkan untuk menghitung bobot gaji 
secara akurat.  
2. Desain Sistem ( System Design ) 
Penulis merancang arsitektur sistem pendukung keputusan sebelum masuk ke 
tahap pengodingan. Tahapan ini mencakup perancangan basis data ( database ), 
pemodelan sistem menggunakan UML ( Use Case Diagram, Class Diagram ), serta 
perancangan antarmuka ( user interface ) website agar mudah digunakan oleh pihak 
manajemen.  
3. Implementasi ( Coding ) 
Tahap ini adalah proses menerjemahkan hasil desain ke dalam bahasa 
pemrograman berbasis web. Penulis mengimplementasikan perhitungan Metode 
BWM ke dalam sistem untuk menentukan prioritas kriteria penggajian. Fokusnya 
adalah memastikan rumus matematika BWM dapat berjalan dengan benar di dalam 
aplikasi.  
Gambar 3. 2 Metode Waterfall  

=== HALAMAN 27 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  22 
 
 4. Pengujian ( Testing ) 
Setelah sistem selesai dibangun, penulis melakukan pengujian untuk 
memastikan semua fitur berjalan tanpa kendala. Pengujian dilakukan untuk 
memvalidasi apakah hasil perhitungan gaji berdasarkan kompetensi dan kinerja sudah 
sesuai dengan logika metode BWM d an kebutuhan di CV Coral Palembang.  
5. Pemeliharaan ( Maintenance ) 
Tahap akhir ini dilakukan dengan melakukan evaluasi terhadap sistem yang telah 
diuji. Penulis melakukan perbaikan jika ditemukan bug atau kesalahan kecil, serta 
memastikan sistem siap digunakan secara berkelanjutan untuk mendukung proses 
administrasi penggajian di perusahaan.  
 
3.4.2 Metode Peme cahan Masalah  
Metode Best Worst   Method  (BWM) merupakan salah satu teknik analisis yang 
populer dalam pengambilan keputusan karena kemampuannya menyederhanakan 
proses penentuan bobot kriteria. (Elanda et al., 2026)  memaparkan bahwa keunggulan 
utama BWM terletak pada efisiensinya dalam menghasilkan data yang konsisten, 
karena hanya memfokuskan perbandingan antara kriteria yang dianggap paling 
penting (terbaik) dan yang paling tidak penting (terburuk).  
Prinsip kerja BWM adalah dengan memilih satu kriteria yang dianggap  paling 
penting  (Best) dan satu kriteria yang dianggap  paling tidak penting  (Worst ), lalu 
membandingkannya terhadap semua kriteria yang tersisa menggunakan skala angka 1 
hingga 9.  
Pada penelitian ini, kriteria penilaian ditetapkan berdasarkan data operasional 
yang telah tersedia dan dapat dihasilkan secara  otomatis oleh sistem  tanpa input 
manual tambahan. Seluruh kriteria yang digunakan berjenis  Benefit, artinya semakin 
besar nilai yang diperoleh, semakin baik kinerja teknisi tersebut.  
Berikut adalah kriteria penilaian kinerja teknisi:  
Tabel 3. 1 Kriteria Penilaian Kinerja Teknisi  
Kode  Nama Kriteria  Tipe  Sumber Data  
𝑐1 Kecepatan 
Penyelesaian SPK  Benefit  Modul Penugasan — selisih tanggal 
selesai vs  end_date  
𝑐2 Kualitas Laporan  Benefit  Modul Laporan — rasio laporan 
disetujui SPV tanpa revisi  

=== HALAMAN 28 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  23 
 
 Lanjutan Tabel 3. 1 Kriteria Penilaian Kinerja Teknisi  
Kode  Nama Kriteria  Tipe  Sumber Data  
𝑐3 Kepatuhan Pelaporan 
Berkala  Benefit  Modul Laporan — rasio laporan 
dikirim sebelum tenggat  
𝑐4 Proaktivitas Pelaporan 
Kendala  Benefit  Modul Kendala — jumlah entri 
kendala yang diajukan proaktif  
𝑐5 Kompetensi Teknisi  Benefit  Profil Teknisi — nilai numerik dari 
level lisensi  
Nilai numerik untuk kriteria Kompetensi Teknisi ( 𝑐5) ditentukan sebagai berikut : 
Tingkat Lisensi  Nilai Kompetensi ( 𝑥𝑖5) 
Level 1  Rp 500.000  
Level 2  Rp 1.000.000  
Level 3  Rp 1.500.000  
 
Berikut adalah l angkah -Langkah Penerapan BWM : 
1. Penentuan Himpunan Kriteria  
Langkah pertama adalah mendefinisikan himpunan kriteria  𝐶 yang akan 
digunakan dalam evaluasi:  
𝐶={𝑐1, 𝑐2, 𝑐3, …, 𝑐𝑛} 
Pada penelitian ini,  𝑛=5 sehingga himpunan kriteria adalah  𝐶={𝑐1,𝑐2,𝑐3,𝑐4,𝑐5}  
 
2. Penentuan Kriteria Terbaik dan Terburuk  
Penentuan kriteria terbaik ( Best) dan terburuk ( Worst  ) dilakukan secara langsung 
oleh pakar atau manajemen perusahaan, tanpa perhitungan terlebih dahulu.  
a. Kriteria Terbaik  (𝑐𝐵) adalah kriteria yang dianggap paling berpengaruh terhadap 
kinerja.  
b. Kriteria Terburuk  (𝑐𝑊) adalah kriteria yang dianggap paling kecil pengaruhnya.  
Pada penelitian ini ditetapkan:  
Best: 𝑐1 (Kecepatan Penyelesaian SPK), sebagai indikator utama produktivitas 
lapangan.  
Worst : 𝑐5 (Kompetensi Teknisi), karena nilainya bersifat statis dan tidak berfluktuasi 
setiap bulan.  
 

=== HALAMAN 29 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  24 
 
 3. Penyusunan Vektor Best-to-Others (BO)  
Setelah kriteria terbaik ditentukan, pakar memberikan  nilai preferensi  yang 
menunjukkan seberapa lebih pentingnya  𝑐𝐵 dibandingkan setiap kriteria  𝑐𝑗 lainnya. 
Nilai ini menggunakan skala 1 hingga 9 sesuai Tabel 2.2  
Tabel 3. 2 Skala Perbandingan BWM  
Nilai  Makna  
1 Sama penting  
2 Sedikit lebih penting  
3 Lebih penting  
4 Cukup lebih penting  
5 Jauh lebih penting  
6 Jauh lebih penting (kuat)  
7 Sangat lebih penting  
8 Sangat lebih penting (kuat)  
9 Mutlak lebih penting  
Hasil penilaian disusun menjadi  Vektor Best-to-Others  (𝐴𝐵): 
𝐴𝐵=(𝑎𝐵1, 𝑎𝐵2, …, 𝑎𝐵𝑛) 
Keterangan:  𝑎𝐵𝑗 menyatakan tingkat kepentingan  𝑐𝐵 relatif terhadap  𝑐𝑗, dan  𝑎𝐵𝐵=1. 
Tabel 3. 3 Vektor Best-to-Others  (Best = 𝑐1) 
𝑐1 (Best) 𝑐1 𝑐2 𝑐3 𝑐4 𝑐5 
1 2 3 5 7 
Interpretasi:  𝑐1 dinilai 2 kali lebih penting dari  𝑐2, 3 kali lebih penting dari  𝑐3, 5 kali 
lebih penting dari  𝑐4, dan 7 kali lebih penting dari  𝑐5. 
 
4. Penyusunan Vektor Others -to-Worst   (OW)  
Selanjutnya, pakar memberikan penilaian seberapa lebih pentingnya setiap 
kriteria  𝑐𝑗 dibandingkan dengan kriteria terburuk  𝑐𝑊. Hasil penilaian disusun 
menjadi  Vektor Others -to-Worst   (𝐴𝑊): 
𝐴𝑊=(𝑎1𝑊, 𝑎2𝑊, …, 𝑎𝑛𝑊)𝑇 
Ket: 𝑎𝑗𝑊 menyatakan tingkat kepentingan  𝑐𝑗 relatif terhadap  𝑐𝑊, dan  𝑎𝑊𝑊=1. 

=== HALAMAN 30 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  25 
 
 Tabel 3. 4 Vektor Others -to-Worst   (Worst   = 𝑐5) 
Kriteria  Nilai terhadap  𝑐5 (Worst  ) 
𝑐1 7 
𝑐2 5 
𝑐3 4 
𝑐4 2 
𝑐5 1 
 
5. Model Optimasi Linier BWM  
Tujuan utama BWM adalah mencari bobot optimal  𝑤𝑗∗ yang  meminimalkan 
ketidakkonsistenan  (𝜉∗) antara rasio bobot yang diperoleh dengan nilai preferensi 
pakar. Model awal berbentuk  non-linear : 
min⁡𝜉∗(1) 
 
s.t.∣𝑤𝐵
𝑤𝑗−𝑎𝐵𝑗∣≤𝜉∗∀𝑗 (2) 
 
∣𝑤𝑗
𝑤𝑊−𝑎𝑗𝑊∣≤𝜉∗∀𝑗 (3) 
 
∑𝑤𝑗𝑛
𝑗=1=1,𝑤𝑗≥0∀𝑗 (4) 
 
Keterangan:  
1) kita mencari nilai 𝜉∗ yang paling kecil (optimal).  
2) Selisih antara perbandingan 𝑤𝐵 / 𝑤𝑗 dengan nilai 𝑎𝐵𝑗tidak boleh melebihi ξ*, 
untuk semua j.  
3) Selisih antara perbandingan 𝑤𝑗/ 𝑤𝑊 dengan nilai 𝑎𝑗𝑊 juga tidak boleh melebihi 
ξ*, untuk semua j.  
4) Total semua bobot = 1 Semua bobot tidak boleh negatif  

=== HALAMAN 31 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  26 
 
 Karena model non -linear lebih sulit diselesaikan secara komputasional, 
mentransformasikannya ke bentuk  Linear Programming (LP)  yang ekuivalen:  
 
min⁡𝜉𝐿(5) 
 
s.t.𝑤𝐵−𝑎𝐵𝑗⋅𝑤𝑗≤𝜉𝐿∀𝑗 (6) 
 
𝑎𝐵𝑗⋅𝑤𝑗−𝑤𝐵≤𝜉𝐿∀𝑗 (7) 
 
𝑤𝑗−𝑎𝑗𝑊⋅𝑤𝑊≤𝜉𝐿∀𝑗 (8) 
 
𝑎𝑗𝑊⋅𝑤𝑊−𝑤𝑗≤𝜉𝐿∀𝑗 (9) 
 
∑𝑤𝑗𝑛
𝑗=1=1,𝑤𝑗≥0∀𝑗 (10) 
 
Keterangan:  
5) kita mencari nilai ⁡𝜉𝐿yang paling kecil.  
6) Selisih antara 𝑤𝐵 dan 𝑎𝐵𝑗 × 𝑤𝑗 tidak boleh melebihi ⁡𝜉𝐿 (arah pertama), untuk 
semua j.  
7) Selisih kebalikannya ( 𝑎𝐵𝑗 × 𝑤𝑗 – 𝑤𝐵) juga tidak boleh melebihi 𝜉𝐿 
8) Selisih antara 𝑤𝑗 dan 𝑎𝑗𝑊× 𝑤𝑊 tidak boleh melebihi 𝜉𝐿. 
9) Selisih kebalikannya juga dibatasi oleh 𝜉𝐿. 
10) Total bobot = 1  Semua bobot tidak boleh negatif  
Persamaan (6) –(7) memastikan rasio bobot  Best-to-Others  mendekati nilai preferensi 
pakar  𝑎𝐵𝑗. Persamaan (8) –(9) melakukan hal yang sama untuk  Others -to-Worst  . 
 
6. Uji Konsistensi ( Consistency Ratio ) 
Nilai  𝜉∗ yang lebih kecil menunjukkan bahwa penilaian pakar lebih konsisten. 
Untuk mengukurnya secara formal, dihitung  Consistency Ratio (CR):  

=== HALAMAN 32 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  27 
 
 𝐶𝑅=𝜉∗
𝐶𝐼(11) 
Keterangan:  
1)  CR : rasio konsistensi  
2)  ξ*   : nilai kesalahan maksimum dari hasil optimasi sebelumnya  
3)  CI : nilai pembanding (indeks konsistensi)  
Di mana  𝐶𝐼 (Consistency Index ) merupakan nilai referensi berdasarkan  𝑎𝐵𝑊 (nilai 
pembanding antara Best dan Worst  ), sebagaimana tercantum pada Tabel 2.5.  
Tabel 3. 5 Tabel Consistency Index  (CI) 
𝑎𝐵𝑊 1 2 3 4 5 6 7 8 9 
CI 0,00 0,44 1,00 1,63 2,30 3,00 3,73 4,47 5,23 
Kriteria penerimaan hasil:  
𝐶𝑅≤0,10⇒Bobot dinyatakan Konsisten  
𝐶𝑅>0,10⇒Penilaian preferensi harus diulang  
 
7. Normalisasi Matriks Kinerja  
Sebelum bobot diterapkan, nilai mentah masing -masing kriteria dari setiap teknisi 
perlu diseragamkan ke rentang yang sama (skala 0 –100). Proses ini 
disebut  normalisasi, dan dilakukan menggunakan metode  Min-Max Normalization . 
Karena seluruh kriteria pada penelitian ini berjenis  Benefit, rumus normalisasi yang 
digunakan adalah:  
𝑣𝑖𝑗=𝑥𝑖𝑗−𝑥𝑗min
𝑥𝑗max−𝑥𝑗min×100 (12) 
Keterangan:  
1)  𝑣𝑖𝑗 : Nilai ternormalisasi teknisi ke -𝑖 pada kriteria ke -𝑗 (skala 0 –100) 
2) ⁡𝑥𝑖𝑗 : Nilai mentah teknisi ke -𝑖 pada kriteria ke -𝑗 
3)  𝑥𝑗min : Nilai terendah kriteria  𝑗 di antara seluruh teknisi  
4) ⁡𝑥𝑗max : Nilai tertinggi kriteria  𝑗 di antara seluruh teknisi  
Catatan Implementasi:  Apabila  𝑥𝑗max=𝑥𝑗min (seluruh teknisi memiliki nilai yang 
sama persis pada satu kriteria), maka  𝑣𝑖𝑗 ditetapkan bernilai 100 untuk menghindari 
pembagian dengan nol pada proses komputasi.  
 

=== HALAMAN 33 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  28 
 
 8. Perhitungan Skor Akhir Kinerja  
Setelah normalisasi selesai, skor akhir kinerja setiap teknisi ( 𝑆𝑖) dihitung dengan 
menjumlahkan hasil perkalian antara nilai ternormalisasi dengan bobot masing -masing 
kriteria. Metode ini dikenal sebagai  Weighted Sum Model  (WSM):  
𝑆𝑖=∑𝑤𝑗𝑛
𝑗=1×𝑣𝑖𝑗 (13) 
Keterangan:  
1) 𝑆𝑖 Skor akhir kinerja teknisi ke -𝑖 (rentang 0 –100) 
2) 𝑤𝑗 Bobot kriteria ke -𝑗 yang diperoleh dari BWM  
3) 𝑣𝑖𝑗 Nilai ternormalisasi teknisi ke -𝑖 pada kriteria ke -𝑗 
 
9. Rekomendasi Tunjangan Kinerja  
Skor akhir  𝑆𝑖 digunakan sebagai dasar perhitungan nominal tunjangan kinerja 
bulanan. Besaran tunjangan dihitung secara proporsional terhadap plafon yang telah 
ditetapkan manajemen:  
𝑇𝑢𝑛𝑗𝑎𝑛𝑔𝑎𝑛𝐾𝑖𝑛𝑒𝑟𝑗 𝑎𝑖=𝑇𝑢𝑛𝑗𝑎𝑛𝑔𝑎𝑛𝑀𝑎𝑘𝑠 ×𝑆𝑖
𝑆max(14) 
Keterangan:  
𝑇𝑢𝑛𝑗𝑎𝑛𝑔𝑎𝑛𝑀𝑎𝑘𝑠  Batas atas tunjangan kinerja per periode (ditetapkan 
manajemen)  
1) ⁡𝑆𝑖 Skor kinerja teknisi ke -𝑖 pada periode tersebut  
2) ⁡𝑆max Skor tertinggi di antara seluruh teknisi pada periode yang 
sama  
 
Hasil perhitungan ini bersifat  rekomendasi sistem. Manager tetap memiliki 
otoritas untuk melakukan peninjauan dan penyesuaian sebelum slip gaji diterbitkan.  
Untuk memberikan gambaran yang jelas mengenai mekanisme kerja sistem yang 
dibangun, bagian ini menyajikan simulasi perhitungan secara manual menggunakan 
metode Best Worst Method  (BWM). Proses perhitungan ini dilakukan secara bertahap, 
dimulai dari penentuan bobot kriteria berdasarkan preferensi keputusan, normalisasi 
data mentah kinerja teknisi dengan metode Min-Max, hingga penggabungan seluruh 

=== HALAMAN 34 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  29 
 
 variabel untuk mendapatkan skor akhir kinerja.  Berikut adalah contoh perhitungan 
manual:  
a) Data Input  
Tabel 3. 6 Data Nilai Mentah Kinerja Teknisi  
Teknisi  Lisensi  𝑐1 SPK 
(%) 𝑐2 Laporan 
(%) 𝑐3 On-
Time 
(%) 𝑐4 Kendala 
(jml)  𝑐5 Kompete
nsi (Rp)  
A Level 
3 85 92 90 5 1.500.000  
B Level 
2 72 78 80 2 1.000.000  
C Level 
1 65 85 70 3 500.000  
Min — 65 78 70 2 500.000  
Max  — 85 92 90 5 1.500.000  
Preferensi BWM:  Best = 𝑐1, Worst   = 𝑐5, 𝑎𝐵𝑊=7, sehingga  𝐶𝐼=3,73. 
Bobot hasil LP:  𝑤1=0,459, 𝑤2=0,230, 𝑤3=0,153, 𝑤4=0,092, 𝑤5=
0,066 (total = 1,000).  
Uji konsistensi:  𝜉∗=0,025, 𝐶𝑅=0,025/3,73=0,007≤0,1 ✓ 
 
b) Normalisasi Nilai  
Menggunakan rumus (12), diperoleh nilai ternormalisasi berikut:  
Tabel 3. 7 Matriks Nilai Ternormalisasi v_ij  
Teknisi  𝑣𝑖1 𝑣𝑖2 𝑣𝑖3 𝑣𝑖4 𝑣𝑖5 
A 100 100 100 100 100 
B 35 0 50 0 50 
C 0 50 0 33 0 
Contoh perhitungan untuk Teknisi B pada  𝑐1: 
𝑣𝐵1=72−65
85−65×100=7
20×100=35 
 
 
 

=== HALAMAN 35 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  30 
 
 c) Skor Akhir Kinerja  
Menggunakan rumus (13):  
𝑆𝐴=(0,459×100)+(0,230×100)+(0,153×100)+(0,092×100)
+(0,066×100)=𝟏𝟎𝟎,𝟎𝟎 
 
𝑆𝐵=(0,459×35)+(0,230×0)+(0,153×50)+(0,092×0)+(0,066×50)
=𝟐𝟕,𝟎𝟐 
 
𝑆𝐶=(0,459×0)+(0,230×50)+(0,153×0)+(0,092×33)+(0,066×0)
=𝟏𝟒,𝟓𝟒 
 
Tabel 3. 8 Hasil Skor dan Peringkat Kinerja Teknisi  
Peringkat  Teknisi  Lisensi  Skor  𝑆𝑖 
1 A Level 3  100,00  
2 B Level 2  27,02  
3 C Level 1  14,54  
 
d) Rekomendasi Tunjangan  
Dengan  𝑇𝑢𝑛𝑗𝑎𝑛𝑔𝑎𝑛𝑀𝑎𝑘𝑠 =Rp 1.500.000 dan 𝑆max=100,00, menggunakan 
rumus (14):  
Tabel 3. 9 Rekomendasi Tunjangan Kinerja Bulanan  
Teknisi  Lisensi  Skor  𝑆𝑖 Perhitungan  Tunjangan 
Direkomendasikan  
A Level 3  100,00  1.500.000
×100,00
100 Rp 1.500.000  
B Level 2  27,02  1.500.000
×27,02
100 Rp 405.300  
C Level 1  14,54  1.500.000
×14,54
100 Rp 218.100  
 
 

=== HALAMAN 36 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  31 
 
 e) Rekomendasi Tunjangan  
Dengan  𝑇𝑢𝑛𝑗𝑎𝑛𝑔𝑎𝑛𝑀𝑎𝑘𝑠 =Rp 1.500.000 dan 𝑆max=100,00, menggunakan 
rumus (14):  
Tabel 3. 10 Rekomendasi Tunjangan Kinerja Proyek  
Teknisi  Lisensi  Skor  𝑆𝑖 Perhitungan  Tunjangan 
Direkomendasikan  
A Level 3  100,00  1.500.000
×100,00
100 Rp 1.500.000  
B Level 2  27,02  1.500.000
×27,02
100 Rp 405.300  
C Level 1  14,54  1.500.000
×14,54
100 Rp 218.100  
Berdasarkan hasil perhitungan manual di atas, diperoleh skor akhir kinerja yang 
secara jelas menunjukkan urutan peringkat dari masing -masing teknisi. Dari hasil 
tersebut, Teknisi A menempati peringkat pertama dengan skor sempurna 100,00, yang 
berkorelasi l angsung dengan pemberian tunjangan kinerja maksimal.  
Untuk membuktikan tingkat akurasi sistem yang dikembangkan, peneliti 
melakukan uji validasi dengan membandingkan hasil perhitungan yang dilakukan 
secara manual dengan hasil yang dikeluarkan oleh program Python. Gambar berikut 
menampilkan rekapitulasi data dari kedua metode tersebut, mulai dari penentuan bobot 
kriteria menggunakan Best Worst Method  (BWM), proses normalisasi nilai, hingga 
penentuan skor akhir kinerja untuk setiap teknisi. Perbandingan ini sangat penting 
untuk memastikan bahwa setiap logika pe rhitungan yang ditanamkan dalam kode 
program sudah berjalan sesuai dengan kaidah matematis yang benar.  

=== HALAMAN 37 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  32 
 
 Rekaptulasi Perhitungan Menggunakan Phyton : 
Berdasarkan hasil perbandingan pada gambar di atas, dapat disimpulkan bahwa 
sistem telah berhasil melakukan perhitungan dengan sangat presisi. Seluruh tahapan 
validasi menunjukkan status [OK] VALID , yang berarti tidak ditemukan perbedaan 
signifikan antara hitungan tangan dengan hitungan otomatis oleh program. Meskipun 
terdapat selisih angka yang sangat kecil pada hasil akhir tunjangan, hal tersebut murni 
Gambar 3. 3 Rekaptulasi Perhitungan Menggunakan Phyton  

=== HALAMAN 38 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  33 
 
 disebabkan oleh perbedaan pembulatan desimal dan tidak mengubah urutan peringkat 
teknisi.  
3.5      Analisis Data /  Analisis Kebutuhan Sistem  
3.5.1   Flowchart  yang berjalan  
  Alur kerja pada sistem penggajian ini sangat bergantung pada proses manual, 
mulai dari pengumpulan dokumen oleh supervisor hingga penilaian kinerja oleh 
manajer yang masih dilakukan secara konvensional. Ketergantungan pada input data 
berulang dan validasi berjenjang antara bagian Admin  dan manajer mengakibatkan 
birokrasi yang panjang serta rentan terhadap kesalahan manusia ( human error ). 
Akibatnya, waktu administrasi yang dibutuhkan menjadi tidak efisien sebelum 
akhirnya gaji dan slip fisik dapat diterima  oleh teknisi.  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Gambar 3. 4 Flowchart Yang Berjalan  

=== HALAMAN 39 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  34 
 
 Keterangan:  
1. Mulai  
2. Supervisor  Mengumpulkan data presensi dan dokumen pendukung pekerja.  
3. Manager  Memberikan penilaian kinerja dan kompetensi secara manual.  
4. Manager Menyerahkan seluruh data ke Bagian Admin . 
5. Bagian Admin Menghitung gaji berdasarkan indikator standar yang berlaku.  
6. Manager  Mengevaluasi hasil perhitungan gaji untuk disetujui.  
7. Bagian Admin Memproses transfer pembayaran dan mencetak slip gaji.  
8. TeknisiTeknisi menerima pembayaran gaji beserta slipnya.  
9. Selesai  
 
3.5.2   Flowchart  yang  diusulkan  
  Sistem yang diusulkan ini mengotomatisasi seluruh tahapan penilaian melalui 
platform digital, mulai dari pengisian preferensi kriteria Best dan Worst   oleh manajer 
hingga kalkulasi skor akhir menggunakan metode Best Worst   Method (BWM). 
Dengan fitur normalisasi otomatis dan integrasi bonus langsung ke slip gaji, sistem ini 
menghilangkan proses manual yang lambat dan menggantinya dengan mekanisme 
Manager Approval digital yang lebih cepat, akurat, dan terpantau secara real-time. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Gambar 3. 5 Flowchart  Yang Diusulkan  

=== HALAMAN 40 ===
Politeknik  Negeri  Sriwijaya  
BAB III Metodologi Penelitian  35 
 
 Keterangan:  
1. Mulai  
2. Manager masuk ke dalam sistem menggunakan akun terdaftar.  
3. Manager  Menentukan perbandingan kriteria terbaik ( Best) dan terburuk ( Worst  ). 
4. Sistem  Menghitung bobot setiap kriteria berdasarkan input BWM.  
5. Sistem  Mengambil atau membuat data penilaian dari laporan yang tersedia.  
6. Sistem  Menstandarisasi data kinerja agar dapat diolah lebih lanjut.  
7. Sistem  Menghitung skor akhir kinerja menggunakan algoritma BWM.  
8. Sistem  Menghasilkan nilai bonus kinerja secara otomatis ke dalam slip gaji.  
9. Manager  Memvalidasi dan menyetujui pencairan gaji secara digital.  
10. Selesai  
 
3.5.3   Spesikasi Kebutuhan Hardware/Software  
Dalam merancan g, digunakan berbagai alat bantu yang terbagi ke dalam dua 
kategori utama, yaitu perangkat keras ( Hardware ) dan perangkat lunak ( Software ). 
Selain itu, terdapat bahan -bahan pendukung yang menunjang penyusunan laporan dan 
proses perancangan sistem.  
1) Perangkat keras (Hardware ) 
Perangkat keras merupakan komponen fisik yang digunakan untuk menjalankan 
berbagai aktivitas selama proses perancangan aplikasi. Adapun perangkat keras yang 
digunakan antara lain:  
a) Laptop Asus TUF Gaming  
b) Processor: RYZEN 7  
c) Memory (RAM): 16 GB  
d) Storage: SSD 512 GB  
e) Printer : Epson  
2) Perangkat lunak ( Software ) 
Perangkat lunak merupakan program atau aplikasi yang mendukung proses 
desain, penulisan laporan, dan pengumpulan referensi. Perangkat lunak yang 
digunakan  yaitu :Windows 11 , Microsoft Word, Visual Studio Code,  Supabase, 
Next.js , JavaScript (TypeScript), HTML, Tailwind CSS dan PostgreSQ L. 

=== HALAMAN 41 ===
 
36 
 DAFTAR PUSTAKA  
 
Arsetyo, R. (2021). Pengukuran Kinerja Supplier dengan Menggunakan Metode Best 
Worst Method, OMAX, dan TLS di PT. Adhi Karya (Persero) TBK.  Universitas 
Brawijaya.  
Arum, W. M. (2023). PENGUKURAN KINERJA INDUSTRI ASURANSI DI 
INDONESIA DENGAN MENGGUNAKAN BEST WORST METHOD (BWM) . 
UNIVERSITAS LAMPUNG.  
Darmawan, F. D., Zulhalim, Z., Yulianto, A. B., & Ichwan, H. (2025). 
PERANCANGAN SISTEM INFORMASI MANAJEMEN DOKUMEN 
PROYEK DENGAN METODE PROTOTYPE BERBASIS WEB. Jurnal 
Manajamen Informatika Jayakarta , 5(3), 231 –241. 
Elanda, R. W., Simbolon, O., & Ikhsan, W. L. (2026). Pembobotan Kriteria Evaluasi 
Kinerja Pemasok dengan Mempertimbangkan Risiko Gangguan Menggunakan 
Metode Best Worst Method. Jurnal Serambi Engineering , 11(1). 
Fadillah, I. M., & Wulandari, S. (2025). SISTEM PELAPORAN FASILITAS UMUM 
BERBASIS MOBILE DAN WEB DENGAN TEKNOLOGI GEOLOCATION 
MENGGUNAKAN METODE WATERFALL. Jurnal Informatika Teknologi 
Dan Sains (Jinteks) , 7(4), 1892 –1901.  
Faruqi, M., & Ramadhan, M. W. (2024). Web -Based Field Work Report Information 
System at ULP PLN Helvetia. Jurnal Metrokom: Media Teknik Elektro Dan 
Komputer , 1(2), 171 –183. 
Hapsari, B. (2023). Strategies to improve employee performance: Competency 
analysis, compensation, and motivation. PRODUKTIF: Jurnal Kepegawaian 
Dan Organisasi , 2(2), 185 –194. 
Harefa, E. S., Waruwu, E., Zega, K., & Mendrofa, Y. (2024). Pengembangan Sistim 
Informasi Manajemen Surat Masuk dan Surat Keluar (Simsumaker) Berbasis 
Digital di Kantor Kecamatan Tuhemberua Kabupaten Nias Utara. Tuhenori: 
Jurnal Ilmiah Multidisiplin , 2(4), 201 –219. 
Harliana, P., Perdana, A., & Farhana, N. A. (2024). Web -based E -Report Information 
System Design. Sinkron: Jurnal Dan Penelitian Teknik Informatika , 8(1), 564 –
570. https://doi.org/10.33395/sinkron.v8i1.13245  

=== HALAMAN 42 ===
 
37 
 Iswandi, R. R. F., & Kuswinarno, M. (2025). Transformasi pengembangan sumber 
daya manusia di era digital. Inisiatif: Jurnal Ekonomi, Akuntansi Dan 
Manajemen , 4(1), 250 –262. 
Lengkey, M. R. S., Rumbino, L. A. Y., Yaroseray, N., anggun Rumboirusi, J., Jowey, 
S., Ayhuan, R. J., Giban, Y., & Hasan, P. (2024). IMPLEMENTASI DIAGRAM 
UNIFIED MODELING LANGUAGE PADA PERANCANG SISTEM 
PENGGAJIAN STUDI KASUS TOKO" SURYA JAYA". Bulletin of Network 
Engineer and Informatics , 2(2), 110 –114. 
Munthe, N. H., Hartanto, F. I., & Syampurna, D. A. (2022). Implementasi Sistem 
Monitoring Laporan Kerja Praktek Lapangan Berbasis Web Pada SMK Citra 
Madani Kabupaten Tangerang. Technomedia Journal , 6(2), 212 –222. 
Nurbaiti, K. R., Pauziah, U., & Irawan, A. (2026). Penerapan Sistem Pendukung 
Keputusan untuk Evaluasi Kinerja Karyawan dengan Metode SAW. Semnas 
Ristek (Seminar Nasional Riset Dan Inovasi Teknologi) , 10(1), 229 –238. 
Nursaada, I. (2025). Perancangan Sistem Informasi Pelaporan Administrasi Harian 
Pekerja Sawit PT. Sintang Raya Berbasis Web. Jurnal Intelek Insan Cendikia , 
2(5), 9582 –9593.  
Pamungkas, B., Hutajulu, B. M. W., & Sagita, S. M. (2025). Sistem Pendukung 
Keputusan Penentuan Bonus Karyawan pada PT ARS Sumber Rezeki 
Menggunakan Metode AHP di Jakarta. Semnas Ristek (Seminar Nasional Riset 
Dan Inovasi Teknologi) , 9(1), 36 –41. 
Patanduk, S. M., & Purnomo, A. S. (2025). Sistem Pendukung Keputusan Menentukan 
Kelayakan Kenaikan Gaji Karyawan Menggunakan Metode Weighted Product 
(WP)(Studi Kasus: Gading Mas Yogyakarta). JEKIN -Jurnal Teknik Informatika , 
5(2), 707 –721. 
Ramadhan, S. F., & Ma ’sum, H. (2025). Perancangan Sistem Laporan Kerja Digital 
Berbasis Web Di Dpmptsp Kota Bandung. Jurnal Informatika Dan Teknik 
Elektro Terapan , 13(2). 
Sari, P., & Purba, M. (2025). Sistem Pendukung Keputusan Penentuan Karyawan 
Kontrak Menjadi Karyawan Tetap Pada PT. Pilar Deli Labumas I Dengan 
Menggunakan Metode Simple Additive Weighting. Journal Data Science Penusa 
(JDSP) , 2(2), 532 –543. 

=== HALAMAN 43 ===
 
38 
 Setiawan, R., Sutedi, A., & Hidayat, T. (2022). Sistem Informasi Geografis 
Pengelolaan Praktek Kerja Lapangan di Sekolah Menengah Kejuruan Berbasis 
Web. Jurnal Algoritma , 19(1), 88 –99. 
Yazid, M., Saputra, J., & Aryani, D. (2024). EVALUASI KINERJA USAHA 
TERNAK LEBAH MADU DALAM MENDUKUNG PENGELOLAAN 
HUTAN LESTARI. AGROTEKSOS , 34(3), 1028 –1043.  
 
 
