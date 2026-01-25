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
- **SQLite** - baza podataka
- **CORS** - cross-origin requests

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
- ✅ 3D simulacija centra grada
- ✅ WebSocket real-time komunikacija
- ✅ Simulacija podataka (promet, okoliš, energija, parking)
- ✅ Dashboard s live metrikama
- ✅ Oznake senzora na mapi
- ✅ 3D zgrade (ako su dostupne za Đakovo)

### Prikazi:
1. **Stvarna Mapa** - Mapbox prikaz stvarnog Đakova s 3D zgradama
2. **3D Simulacija** - Naša simulirana vizualizacija centra
3. **Podaci i Senzori** - Lista svih senzora i trenutnih vrijednosti

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
