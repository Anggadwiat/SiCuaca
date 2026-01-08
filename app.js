// Class BaseCuaca: ABSTRAKSI (BluePrint)
// Class ini adalah class abstrak yang digunakan untuk mencegah instansiasi langsung dan memaksa sub class-nya mengimplementasikan behavior render()
class BaseCuaca {
    constructor() {
        // Mencegah instansiasi class abstrak secara langsung
        if (new.target === BaseCuaca) { 
            throw new Error("BaseCuaca adalah class abstrak");
        }
    }

    // Behavior abstrak yang MENGHARUSKAN class turunan untuk mengimplementasikannya
    render() {
        throw new Error("Behavior render() harus di-override oleh class turunan");
    }
}


// Class DataCuaca: INHERITANSI (Mewarisi dari BaseCuaca), ENKAPSULASI (Atribut private), POLIMORFISME (mengubah behavior "render()")
class DataCuaca extends BaseCuaca {
    // Atribut private (#) 
    // Data ini hanya dapat diakses atau dimodifikasi melalui getter atau behavior di dalam class, melindungi data
    #kota;
    #provinsi;
    #negara;
    #icon;
    #suhu;
    #deskripsi;
    #kelembapan;
    #angin;

    // Constructor: Menginisialisasi semua atribut SiCuaca
    constructor(kota, provinsi, negara, icon, suhu, deskripsi, kelembapan, angin) {
        super(); // Memanggil constructor BaseCuaca
        this.#kota = kota;
        this.#provinsi = provinsi;
        this.#negara = negara;
        this.#icon = icon;
        this.#suhu = suhu;
        this.#deskripsi = deskripsi;
        this.#kelembapan = kelembapan;
        this.#angin = angin;
    }

    // Getter: Menyediakan akses aman ke data private
    get lokasiLengkap() {
        return `${this.#kota}, ${this.#provinsi}, ${this.#negara}`;
    }

    get iconCuaca() {
        return this.#icon;
    }

    get suhuCuaca() {
        return this.#suhu;
    }

    get namaKota() {
        return this.#kota;
    }

    // Behavior "render()"" memberikan implementasi nyata dari behavior abstrak "render()" yang diwajibkan oleh BaseCuaca, serta melakukan override
    render() {
        return `
            <div class="lokasi">
               <i class='bxr bx-location-alt-2'></i> ${this.lokasiLengkap}
            </div>

            <div class="info-cuaca">
                <img src="${this.#icon}" alt="${this.#deskripsi}" class="icon-cuaca">
                <span class="suhu">${this.#suhu}°C</span>
                <p class="deskripsi-text">${this.#deskripsi}</p>
            </div>

            <hr>

            <div class="info-lainnya">
                <div class="kelembapan">
                    <i class="bx bx-water icon-kelembapan"></i> 
                    <p>${this.#kelembapan}%</p>
                    <span>Kelembapan</span>
                </div>
                <div class="kecepatan-angin">
                    <i class="bx bx-wind icon-kecepatan-angin"></i> 
                    <p>${this.#angin} kph</p>
                    <span>Kecepatan Angin</span>
                </div>
            </div>
        `;
    }
}


// Class DataCuacaRingkas: INHERITANSI (Mewarisi dari DataCuaca) dan POLIMORFISME (mengubah behavior "render()")
class DataCuacaRingkas extends DataCuaca {
    render() {
        // Mengambil data melalui Getter yang didefinisikan di class DataCuaca
        const kota = this.namaKota;
        const icon = this.iconCuaca;
        const suhu = this.suhuCuaca;

        // melakukan INHERITANSI, serta override
        return `
            <div class="ringkas-output-baru">
                <span class="ringkas-lokasi-atas">${kota}</span>
                <div class="ringkas-baris-bawah">
                    <img src="${icon}" alt="Icon Cuaca" class="ringkas-icon-baru">
                    <span class="ringkas-suhu-bawah">${suhu}°C</span>
                </div>
            </div>
        `;
    }
}


// Class ApiCuaca: ENKAPSULASI (Menyembunyikan detail API Key dan URL) dan ABSTRAKSI (Menyediakan satu behavior 'getCuaca' yang mudah digunakan).
class ApiCuaca {
    // Atribut private (#) 
    #API_KEY = "92cf12a8f2e543a09e830943252811";
    #BASE_URL = "https://api.weatherapi.com/v1/current.json";

    // FACTORY METHOD: Bertugas membuat/instansiasi objek, Di sini diputuskan apakah akan membuat DataCuaca (lengkap) atau DataCuacaRingkas (ringkas) berdasarkan parameter "mode"
    #buatObjekCuaca(data, mode) {
        let icon = data.current.condition.icon;
        if (icon.startsWith("//")) icon = "https:" + icon; // Memperbaiki format URL icon AP

        // Penentuan class mana yang akan dipakai
        const CuacaClass = mode === "ringkas" ? DataCuacaRingkas : DataCuaca;

        return new CuacaClass(
            data.location.name,
            data.location.region,
            data.location.country,
            icon,
            data.current.temp_c,
            data.current.condition.text,
            data.current.humidity,
            data.current.wind_kph
        );
    }

    // Fungsi ini menyembunyikan kerumitan 'fetch' dan 'json parsing' dari class lain
    async getCuaca(query, mode = "lengkap") {
        try {
            const url = `${this.#BASE_URL}?key=${this.#API_KEY}&q=${query}&aqi=no`;
            const res = await fetch(url);

            if (!res.ok) return null;  // Jika kota tidak ditemukan atau API error

            const data = await res.json();

            // Mengirim data mentah API ke Factory Method untuk dijadikan Objek OOP.
            return this.#buatObjekCuaca(data, mode);

        } catch (err) {
            console.error("Gagal mendapatkan data:", err);
            return null;
        }
    }
}


// Class AplikasiCuaca: Berperan sebagai CONTROLLER, yang engatur alur aplikasi, mengambil input pengguna, memanggil service API, dan menampilkan hasil melalui objek yang memiliki behavior render()
class AplikasiCuaca {
    constructor() {
        // Inisialisasi service API dan elemen-elemen HTML
        this.api = new ApiCuaca();
        this.input = document.getElementById("input-lokasi");
        this.btn = document.getElementById("icon-cari");
        this.output = document.getElementById("output-cuaca");

        // Event Listener: Memicu fungsi cari saat tombol diklik
        this.btn.addEventListener("click", () => this.cari());

        // Event Listener: Memicu fungsi cari saat menekan tombol Enter di keyboard
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
               this.cari();
            }
        });

        // Menjalankan fitur deteksi lokasi saat pertama kali web dibuka
        this.tampilkanCuacaAwal();
    }

    // Deteksi Lokasi Otomatis, Menggunakan Geolocation
    async tampilkanCuacaAwal() {
        this.output.innerHTML = `<p><i class='bx bx-refresh-cw spin'></i>Mencari lokasi terkini...</p>`;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (posisi) => {
                    const lat = posisi.coords.latitude;
                    const lon = posisi.coords.longitude;

                    const koordinat = `${lat},${lon}`; 

                    // Memanggil API dengan mode "ringkas" untuk tampilan awal
                    const data = await this.api.getCuaca(koordinat, "ringkas"); 
                    
                    if (data) {
                        // Memanggil behavior render() milik objek yang dihasilkan ("ringkas")
                        this.output.innerHTML = data.render(); 
                    } else {
                        this.output.innerHTML = "<p>Gagal memuat cuaca lokasi Anda.</p>";
                    }
                },
                (error) => {
                    // Penanganan jika user menolak akses lokasi, GPS mati, tidak mendukung Geolocation
                    console.error("Geolocation Error:", error.message);
                    
                    if (error.code === 1) {
                        this.output.innerHTML = "<p style='color: red;'>Akses lokasi ditolak!</p><p>Silakan masukkan nama kota secara manual.</p>";
                    } else {
                        this.output.innerHTML = "<p style='color: red;'>Gagal mendapatkan cuaca lokasi terikini!</p><p>Silakan masukkan nama kota secara manual.</p>";
                    }
                },
                { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
            );
        } else {
            this.output.innerHTML = "<p style='color: red;'>Browser Anda tidak mendukung Geolocation.</p><p>Masukkan nama kota secara manual.</p>";
        }
    }

    // Mengatur alur pencarian kota secara manual
    async cari() {
        const kota = this.input.value.trim();

        if (!kota) {
            this.output.innerHTML = "<p style='color:red'>Nama kota tidak boleh kosong!</p><p>Masukkan nama kota dengan benar.</p>";
            return;
        }

        this.output.innerHTML = `<p><i class='bx bx-refresh-cw spin'></i>Mencari...</p>`;

        // Meminta data "lengkap" dari service API
        const data = await this.api.getCuaca(kota, "lengkap");

        // Memanggil behavior render() milik objek yang dihasilkan ("lengkap")
        if (data) {
            this.output.innerHTML = data.render();
        } else {
            // Tampilan jika nama kota tidak ditemukan
            this.output.innerHTML = `
                <div class="error">
                    <img src="img/404.png" class="img-error">
                    <p>Lokasi <strong>"${kota}"</strong> tidak ditemukan.</p>
                </div>
            `;
        }
    }
}


// Menunggu seluruh file HTML/CSS dimuat (DOMContentLoaded) baru menjalankan class Utama
document.addEventListener("DOMContentLoaded", () => {
    new AplikasiCuaca();
});
