# Digital Twin Đakovo 🏙️

Web sustav za simulirani digital twin grada Đakova, Hrvatska (31400).

## 📋 Opis Projekta

Studentski rad - interaktivna web aplikacija koja simulira digital twin za centar grada Đakova. Sustav prikazuje 3D vizualizaciju grada s real-time simuliranim podacima o prometu, okolišu, energiji i infrastrukturi.

## 🛠️ Tehnologije

### Frontend
- **React 18** + **TypeScript**
- **Vite** - build tool
- **React Three Fiber** - 3D vizualizacija grada
- **@react-three/drei** - 3D helpers
- **Mapbox GL JS** - 2D karte
- **Tailwind CSS** - styling
- **Zustand** - state management
- **Recharts** - grafikoni i statistike
- **Socket.IO Client** - WebSocket komunikacija

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Socket.IO** - WebSocket server
- **SQLite** + **better-sqlite3** - baza podataka
- **node-cron** - automatsko čišćenje podataka
- **CORS** - cross-origin requests

## 💾 Baza Podataka

Sustav koristi **SQLite** bazu za spremanje:
- ✅ **Senzorska očitanja** - svako očitanje svakih 3 sekunde
- ✅ **Povijesni podaci** - 7 dana raw data + 90 dana agregiranih podataka
- ✅ **Gradski događaji** - nesreće, radovi, incidenti
- ✅ **Upozorenja** - automatska upozorenja kad vrijednosti pređu pragove
- ✅ **Automatsko čišćenje** - dnevni cleanup job u 3:00 AM

**Retention Policy:**
- Raw data: 7 dana (~8.4 GB)
- 5-minutna agregacija: 30 dana (~300 MB)
- Satna agregacija: 90 dana (~365 MB)
- **Ukupno: ~9 GB za 90 dana povijesti**

📖 Detaljnu dokumentaciju vidi u [DATABASE.md](./DATABASE.md)

## 📊 Simulirani Podaci

Sustav simulira podatke tipične za pravi digital twin:

- **Promet**: brojanje vozila, zagušenja, prosječne brzine
- **Okoliš**: kvaliteta zraka (PM2.5, PM10), temperatura, vlaga
- **Energija**: potrošnja javne rasvjete i zgrada
- **Infrastruktura**: slobodna parking mjesta, status semafora
- **Javni prijevoz**: pozicije autobusa (simulirano)
- **Kretanje ljudi**: zagušenost pješačkih zona

## 🚀 Pokretanje Projekta

### Preduvjeti
- Node.js 18+ 
- npm ili yarn
- **Mapbox API token** (besplatan) - vidi upute ispod

### Brza Instalacija (Preporučeno)

Nakon što clone-aš projekt, pokreni install script:

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

Script automatski instalira sve dependencies za backend i frontend.

### Manualna Instalacija

```bash
# Instalacija backend dependencies
cd backend
npm install

# Instalacija frontend dependencies
cd ../frontend
npm install
```

### Dodaj Mapbox Token (za stvarne mape)

1. Registriraj se besplatno: https://account.mapbox.com/auth/signup/
2. Kopiraj svoj token
3. Kreiraj `.env` file u `frontend/` folderu:
   ```
   VITE_MAPBOX_TOKEN=tvoj_token_ovdje
   ```

**Napomena:** Bez tokena "Stvarna Mapa" neće raditi, ali 3D simulacija i podaci će raditi normalno.

### Pokretanje Development Servera

**Najbrži način** - pokreni oba servera odjednom:
```bash
start.bat
```

**Ili manualno:**
```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

Frontend će biti dostupan na: `http://localhost:5173`
Backend API: `http://localhost:3001`

## 📁 Struktura Projekta

```
ZAVRSNI/
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # React komponente
│   │   │   ├── 3d/      # 3D vizualizacija
│   │   │   ├── map/     # 2D karte
│   │   │   └── ui/      # UI komponente
│   │   ├── store/       # Zustand state management
│   │   ├── services/    # API i WebSocket servisi
│   │   ├── types/       # TypeScript tipovi
│   │   └── utils/       # Helper funkcije
│   └── package.json
│
├── backend/              # Node.js Express backend
│   ├── src/
│   │   ├── routes/      # API rute
│   │   ├── services/    # Business logika
│   │   │   └── simulation/ # Simulacija podataka
│   │   ├── models/      # Data modeli
│   │   ├── websocket/   # WebSocket handlers
│   │   └── server.ts    # Express server
│   └── package.json
│
└── README.md
```

## 🗺️ Značajke

### Trenutno Implementirano
- ✅ **Stvarna mapa Đakova** - Mapbox s pravim ulicama i zgradama
- ✅ **3D simulacija** centra grada
- ✅ **WebSocket real-time** komunikacija
- ✅ **Simulacija podataka** (promet, okoliš, energija, parking)
- ✅ **Dashboard** s live metrikama
- ✅ **Oznake senzora** na mapi
- ✅ **3D zgrade** (ako su dostupne za Đakovo)
- ✅ **SQLite baza podataka** - spremanje svih očitanja
- ✅ **Povijesni podaci** - 90 dana povijesti s agregacijom
- ✅ **History API** - dohvaćanje podataka za analizu
- ✅ **Events sustav** - praćenje incidenata u gradu
- ✅ **Alerts sustav** - automatska upozorenja
- ✅ **Admin panel** - upravljanje senzorima i bazom
- ✅ **Automatsko čišćenje** - dnevni cleanup job

### API Endpointi
- 📡 `GET /api/locations` - Lokacije svih senzora
- 📡 `GET /api/data` - Trenutni podaci
- 📊 `GET /api/history/sensor/:id` - Povijest za senzor
- 📊 `GET /api/history/stats` - Statistika baze
- 🚨 `GET /api/events` - Gradski događaji
- 🚨 `GET /api/events/alerts` - Upozorenja
- 🔐 `POST /api/admin/login` - Admin login
- 🔐 `GET /api/admin/database/stats` - Database stats

### Prikazi:
1. **Stvarna Mapa** - Mapbox prikaz stvarnog Đakova s 3D zgradama
2. **3D Simulacija** - Naša simulirana vizualizacija centra
3. **Podaci i Senzori** - Lista svih senzora i trenutnih vrijednosti
4. **Admin Panel** - Upravljanje senzorima i bazom podataka

### Za Proširenje
- 🔄 Detaljniji 3D modeli zgrada centra Đakova
- 🔄 Više lokacija senzora
- 🔄 Historijski podaci i trendovi
- 🔄 Admin panel za upravljanje
- 🔄 Izvještaji i analytics

## 📍 Đakovo Koordinate

Centar grada: **45.3089° N, 18.4103° E**

## 🎓 Akademski Kontekst

Ovo je studentski završni rad za demonstraciju digital twin koncepta. Svi podaci su simulirani i ne predstavljaju stvarne podatke grada Đakova.

## 📝 Licenca

MIT License - Studentski projekt

## 👨‍💻 Autor

Završni rad - 2026
