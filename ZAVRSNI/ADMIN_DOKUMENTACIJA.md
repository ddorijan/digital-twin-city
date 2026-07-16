# Admin Dashboard - Dokumentacija

## Pregled

Admin dashboard omogućava upravljanje senzorima u Digital Twin Đakovo aplikaciji. Svi senzori se spremaju u JSON datoteku i mogu se dodavati, uređivati i brisati kroz web sučelje.

## Funkcionalnosti

### 1. Autentifikacija
- **Login**: Jednostavna autentifikacija sa lozinkom
- **Logout**: Odjava iz admin panela
- **Default lozinka**: `admin123`

### 2. Upravljanje Senzorima (CRUD)
- **Dodavanje**: Dodaj nove senzore sa svim potrebnim podacima
- **Uređivanje**: Izmjena postojećih senzora
- **Brisanje**: Uklanjanje senzora iz sistema
- **Pregled**: Lista svih senzora sa statistikom po tipu

### 3. Tipovi Senzora
- **Traffic** (Promet): Mjerenje prometa vozila
- **Environment** (Okoliš): Kvaliteta zraka, temperatura, vlaga
- **Parking**: Praćenje parking mjesta
- **Traffic Light** (Semafor): Status semafora
- **Energy** (Energija): Potrošnja energije (rasvjeta, zgrade)

## Pristup Admin Panelu

1. Otvori aplikaciju: http://localhost:5174
2. Klikni na **Admin** tab u navigaciji
3. Unesi lozinku: `admin123`
4. Klikni **Prijavite se**

## Promjena Admin Lozinke

Lozinka se postavlja preko environment varijable:

### Backend
Kreiraj `.env` datoteku u `backend/` folderu:
```
ADMIN_PASSWORD=tvoja_nova_lozinka
```

Ako `.env` ne postoji, koristi se default lozinka: `admin123`

## API Endpointi

### Auth
- `POST /api/admin/login` - Login
  ```json
  {
    "password": "admin123"
  }
  ```
- `POST /api/admin/logout` - Logout

### Senzori (zahtijevaju autentifikaciju)
- `GET /api/admin/sensors` - Svi senzori
- `GET /api/admin/sensors/:id` - Pojedinačni senzor
- `POST /api/admin/sensors` - Dodaj senzor
  ```json
  {
    "id": "traffic-004",
    "name": "Glavna ulica",
    "lat": 45.3089,
    "lng": 18.4103,
    "type": "traffic"
  }
  ```
- `PUT /api/admin/sensors/:id` - Uredi senzor
- `DELETE /api/admin/sensors/:id` - Obriši senzor

## Spremanje Podataka

Svi senzori se spremaju u:
```
backend/data/sensors.json
```

Datoteka se automatski ažurira pri svakoj promjeni.

## Za Buduće Razvijanje

### Dodavanje Vozila

U budućnosti se mogu dodati vozila slično kao senzori:

1. **Backend**: Kreiraj `vehicles.json` i API rute slično `sensors.json`
2. **Frontend**: Kreiraj komponente za upravljanje vozilima
3. **Mapbox**: Prikaži vozila kao markere sa ikonama
4. **Real-time**: Ažuriraj pozicije vozila preko WebSocket-a

### Primjer vozila strukture:
```typescript
interface Vehicle {
  id: string;
  name: string;
  type: 'bus' | 'taxi' | 'truck' | 'emergency';
  lat: number;
  lng: number;
  speed: number;
  heading: number; // smjer kretanja (0-360)
  status: 'active' | 'inactive';
}
```

### Vizualizacija vozila na mapi:
- Različite ikone za različite tipove vozila
- Rotacija ikone prema smjeru kretanja
- Tooltip sa informacijama o vozilu
- Animacija kretanja između pozicija

## Sigurnosne Napomene

⚠️ **Za produkciju:**
- Koristi pravu bazu podataka (PostgreSQL, MongoDB)
- Implementiraj JWT tokene umjesto session
- Hash-iraj lozinke (bcrypt)
- Dodaj rate limiting
- Implementiraj role-based access control (admin, viewer, editor)
- SSL/TLS za HTTPS
- CORS ograničenja

## Troubleshooting

### Problem: Backend greška "EACCES" pri pisanju u sensors.json
**Rješenje**: Provjeri da `backend/data/` folder postoji i ima write permissions

### Problem: Unauthorized error
**Rješenje**: Provjeri da li je token ispravan ili se ponovo prijavi

### Problem: Senzori se ne prikazuju na mapi
**Rješenje**: Provjeri da su lat/lng koordinate ispravne i unutar granica Đakova

## Struktura Projekta

```
backend/
├── data/
│   └── sensors.json          # Spremište senzora
├── src/
│   ├── middleware/
│   │   └── auth.ts           # Auth middleware
│   ├── routes/
│   │   └── admin.ts          # Admin API rute
│   ├── services/
│   │   ├── storage/
│   │   │   └── sensorStorage.ts  # CRUD operacije
│   │   └── simulation/
│   │       └── locations.ts      # Učitavanje senzora
│   └── server.ts

frontend/
├── src/
│   ├── components/
│   │   └── admin/
│   │       ├── AdminDashboard.tsx  # Glavni admin panel
│   │       ├── AdminLogin.tsx      # Login forma
│   │       └── SensorForm.tsx      # Forma za senzore
│   ├── services/
│   │   └── adminApi.ts             # API pozivi
│   └── store/
│       └── adminStore.ts           # Admin state
```
