class BaseCuaca {
    constructor() {
        if (new.target === BaseCuaca) { 
            throw new Error("BaseCuaca adalah class abstrak dan tidak dapat di-instansiasi");
        }
    }

    render() {
        throw new Error("Behavior render() harus di-override oleh class turunan");
    }
}


class DataCuaca extends BaseCuaca {
    #kota;
    #provinsi;
    #negara;
    #icon;
    #suhu;
    #deskripsi;
    #kelembapan;
    #angin;

    constructor(kota, provinsi, negara, icon, suhu, deskripsi, kelembapan, angin) {
        super();
        this.#kota = kota;
        this.#provinsi = provinsi;
        this.#negara = negara;
        this.#icon = icon;
        this.#suhu = suhu;
        this.#deskripsi = deskripsi;
        this.#kelembapan = kelembapan;
        this.#angin = angin;
    }

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


class DataCuacaRingkas extends DataCuaca {
    render() {
        const kota = this.namaKota;
        const icon = this.iconCuaca;
        const suhu = this.suhuCuaca;
        
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


class ApiCuaca {
    #API_KEY = "92cf12a8f2e543a09e830943252811";
    #BASE_URL = "https://api.weatherapi.com/v1/current.json";
    
    #buatObjekCuaca(data, mode) {
        let icon = data.current.condition.icon;
        if (icon.startsWith("//")) icon = "https:" + icon;

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

    async getCuaca(query, mode = "lengkap") {
        try {
            const url = `${this.#BASE_URL}?key=${this.#API_KEY}&q=${query}&aqi=no`;
            const res = await fetch(url);

            if (!res.ok) return null;

            const data = await res.json();
            
            return this.#buatObjekCuaca(data, mode);

        } catch (err) {
            console.error("Gagal mendapatkan data:", err);
            return null;
        }
    }
}


class AplikasiCuaca {
    constructor() {
        this.api = new ApiCuaca();
        this.input = document.getElementById("input-lokasi");
        this.btn = document.getElementById("icon-cari");
        this.output = document.getElementById("output-cuaca");

        this.btn.addEventListener("click", () => this.cari());

        this.tampilkanCuacaAwal();
    }

    async tampilkanCuacaAwal() {
        this.output.innerHTML = `<p><i class='bx bx-refresh-cw spin'></i>Mencoba mendapatkan lokasi terkini...</p>`;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (posisi) => {
                    const lat = posisi.coords.latitude;
                    const lon = posisi.coords.longitude;
                    
                    const koordinat = `${lat},${lon}`; 
                    
                    // output tampilan awal
                    const data = await this.api.getCuaca(koordinat, "ringkas"); 
                    
                    if (data) {
                        this.output.innerHTML = data.render(); 
                    } else {
                        this.output.innerHTML = "<p>Gagal memuat cuaca lokasi Anda.</p>";
                    }
                },
                (error) => {
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

    async cari() {
        const kota = this.input.value.trim();

        if (!kota) {
            this.output.innerHTML = "<p style='color:red'>Nama kota tidak boleh kosong!</p><p>Masukkan nama kota dengan benar.</p>";
            return;
        }

        this.output.innerHTML = `<p><i class='bx bx-refresh-cw spin'></i>Mencari...</p>`;
        
        //ouput hasil pencarian
        const data = await this.api.getCuaca(kota, "lengkap");

        if (data) {
            this.output.innerHTML = data.render();
        } else {
            this.output.innerHTML = `
                <div class="error">
                    <img src="img/404.png" class="img-error">
                    <p>Lokasi <strong>"${kota}"</strong> tidak ditemukan.</p>
                </div>
            `;
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    new AplikasiCuaca();
});