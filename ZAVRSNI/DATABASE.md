# Database Dokumentacija

## 📊 Pregled

Digital Twin Đakovo koristi **SQLite** bazu podataka za spremanje svih senzorskih očitanja, povijesnih podataka, događaja i upozorenja. Baza automatski upravlja podacima kroz retention policy strategiju koja optimizira prostor i performanse.

## 🗄️ Struktura Baze

### Glavne Tablice

#### 1. **sensor_readings** (Raw Data - 7 dana)
Čuva sva senzorska očitanja u punoj rezoluciji.

```sql
- id: INTEGER PRIMARY KEY
- sensor_id: TEXT (npr. "traffic-001")
- sensor_type: TEXT ("traffic", "environment", "energy", "parking", "traffic-light")
- timestamp: INTEGER (Unix timestamp)
- data: TEXT (JSON s podacima specifičnim za tip senzora)
- created_at: DATETIME
```

**Primjer podataka:**
```json
{
  "sensorId": "traffic-001",
  "timestamp": 1710247893,
  "vehicleCount": 45,
  "averageSpeed": 32.5,
  "congestionLevel": "medium"
}
```

#### 2. **sensor_readings_5min** (5-minutna agregacija - 30 dana)
Agregirana očitanja u 5-minutnim intervalima.

```sql
- sensor_id: TEXT
- interval_start: INTEGER (zaokruženo na 5 minuta)
- avg_value, min_value, max_value: REAL
- count: INTEGER (broj sirovih očitanja)
- data: TEXT (dodatni JSON podaci)
```

#### 3. **sensor_readings_hourly** (Satna agregacija - 90 dana)
Agregirana očitanja u satnim intervalima za long-term analizu.

#### 4. **vehicle_positions** (Praćenje vozila - 7 dana)
```sql
- vehicle_id: TEXT (npr. "bus-1")
- vehicle_type: TEXT ("bus", "taxi", "truck", "emergency")
- lat, lng: REAL (koordinate)
- speed, bearing: REAL (brzina i smjer)
- timestamp: INTEGER
- data: TEXT (JSON s dodatnim podacima)
```

#### 5. **city_events** (Gradski događaji)
```sql
- event_type: TEXT ("accident", "road-work", "flood", "event")
- title, description: TEXT
- lat, lng: REAL
- severity: TEXT ("low", "medium", "high", "critical")
- status: TEXT ("active", "resolved", "monitoring")
- created_at, resolved_at: DATETIME
```

#### 6. **alerts** (Sistemska upozorenja)
```sql
- sensor_id: TEXT
- alert_type: TEXT ("high_pollution", "traffic_jam", "parking_full")
- severity: TEXT ("info", "warning", "critical")
- message: TEXT
- acknowledged: BOOLEAN
- created_at: DATETIME
```

## 🔄 Retention Policy (Automatsko upravljanje podacima)

### Strategija Čuvanja Podataka

```
┌─────────────────────────────────────────┐
│ 0-7 DANA: Full Resolution               │
│ - Svako očitanje (svake 3 sekunde)     │
│ - Veličina: ~8.4 GB                     │
└─────────────────────────────────────────┘
              ↓ (automatska agregacija)
┌─────────────────────────────────────────┐
│ 7-30 DANA: 5-minutna agregacija         │
│ - Prosjek, min, max svakih 5 minuta    │
│ - Veličina: ~300 MB                     │
└─────────────────────────────────────────┘
              ↓ (daljnja agregacija)
┌─────────────────────────────────────────┐
│ 30-90 DANA: Satna agregacija            │
│ - Prosjek, min, max svaki sat          │
│ - Veličina: ~365 MB                     │
└─────────────────────────────────────────┘
```

**Ukupna veličina baze:** ~9 GB za 90 dana povijesti

### Automatski Cleanup Job

- **Pokreće se:** Svaki dan u 3:00 AM
- **Zadaće:**
  1. Agregira podatke starije od 7 dana u 5-minutne intervale
  2. Agregira podatke starije od 30 dana u satne intervale
  3. Briše sirove podatke starije od 7 dana
  4. Briše agregacije starije od 90 dana
  5. Pokreće VACUUM za oslobađanje prostora

### Konfiguracija

Postavke se nalaze u `backend/src/config/retention.ts`:

```typescript
export const RETENTION_POLICY = {
  RAW_DATA_DAYS: 7,           // Sirovi podaci
  AGGREGATED_5MIN_DAYS: 30,   // 5-min agregacija
  AGGREGATED_HOURLY_DAYS: 90, // Satna agregacija
  CLEANUP_HOUR: 3,            // Sat pokretanja cleanup-a
};
```

## 🚀 API Endpointi

### History API (`/api/history`)

#### Dohvati povijest za senzor
```http
GET /api/history/sensor/:sensorId?from=1234567890&to=1234567999&limit=1000
```

**Parametri:**
- `from`: Unix timestamp početka (default: prije 24h)
- `to`: Unix timestamp kraja (default: sada)
- `limit`: Max broj zapisa (default: 1000)
- `aggregation`: "raw", "5min", "hourly" (automatski odabir)

**Response:**
```json
{
  "sensor_id": "traffic-001",
  "from": 1710247893,
  "to": 1710334293,
  "count": 500,
  "aggregation": "raw",
  "data": [...]
}
```

#### Najnovije očitanje za senzor
```http
GET /api/history/sensor/:sensorId/latest
```

#### Povijest po tipu senzora
```http
GET /api/history/type/:sensorType?from=...&to=...
```

Tipovi: `traffic`, `environment`, `energy`, `parking`, `traffic-light`

#### Statistika baze
```http
GET /api/history/stats
```

**Response:**
```json
{
  "total_readings": 1234567,
  "by_type": [
    {
      "sensor_type": "traffic",
      "sensor_count": 10,
      "reading_count": 500000,
      "first_reading": 1710000000,
      "last_reading": 1710334293
    }
  ]
}
```

#### Usporedba perioda
```http
GET /api/history/comparison?sensorId=traffic-001&period1Start=...&period1End=...&period2Start=...&period2End=...
```

### Events & Alerts API (`/api/events`)

#### Dohvati aktivne događaje
```http
GET /api/events
```

#### Kreiraj novi događaj
```http
POST /api/events
Content-Type: application/json

{
  "event_type": "accident",
  "title": "Prometna nesreća na Korzu",
  "description": "Sudar dva vozila",
  "lat": 45.3095,
  "lng": 18.4115,
  "severity": "high",
  "status": "active"
}
```

#### Označi događaj kao riješen
```http
PUT /api/events/:id/resolve
```

#### Dohvati upozorenja
```http
GET /api/events/alerts?unacknowledged=true&limit=50
```

#### Potvrdi upozorenje
```http
PUT /api/events/alerts/:id/acknowledge
Content-Type: application/json

{
  "acknowledged_by": "admin"
}
```

### Admin API (`/api/admin`)

*Svi endpointi zahtijevaju autentifikaciju*

#### Database statistika
```http
GET /api/admin/database/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": "/path/to/city.db",
    "size_bytes": 8850000000,
    "size_mb": "8440.47",
    "tables": {
      "sensor_readings": 2880000,
      "sensor_readings_5min": 144000,
      "sensor_readings_hourly": 6000,
      "city_events": 45,
      "alerts": 120
    },
    "total_readings": 2880000
  }
}
```

#### Manualno pokretanje cleanup-a
```http
POST /api/admin/database/cleanup
```

## 💾 Performanse

### Batch Insert
- **Brzina:** ~0.8ms za 150 zapisa (batch transaction)
- **Throughput:** ~187,500 zapisa/sekundo
- **Vaš load:** ~50 zapisa svake 3s = 0.01% kapaciteta

### Select Performanse
- **Indexed query:** ~0.002ms
- **Full table scan:** ~50ms (za 1M zapisa)
- **Agregacija:** ~100ms (za 1M zapisa)

### Optimizacije

1. **WAL Mode:** Omogućava concurrent read i write
2. **64MB Cache:** Drži često korištene podatke u memoriji
3. **Composite Indexes:** Brže pretraživanje po sensor_id + timestamp
4. **Batch Transactions:** 100× brže nego pojedinačni INSERT-ovi

## 🛠️ Održavanje

### Ručno pokretanje cleanup-a

```bash
# Preko API-ja (zahtijeva admin token)
curl -X POST http://localhost:3001/api/admin/database/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Provjera veličine baze

```bash
# Windows
Get-Item backend\data\city.db | Select-Object Length

# Linux/Mac
ls -lh backend/data/city.db
```

### Backup baze

```bash
# Jednostavno kopiraj datoteku
copy backend\data\city.db backups\city-backup-2026-03-12.db
```

### Vraćanje iz backup-a

```bash
# Zaustavi backend, zamijeni datoteku, ponovno pokreni
copy backups\city-backup-2026-03-12.db backend\data\city.db
```

## 📈 Monitoring

### Kako pratiti performanse

1. **Konzola:** Backend logira svakih ~60 sekundi:
   ```
   💾 Saved 150 sensor readings to database in 0.8ms
   ```

2. **Admin panel:** Provjeri `/api/admin/database/stats`

3. **Cleanup log:** Svaki dan u 3:00 AM:
   ```
   🧹 Starting scheduled cleanup job...
   📦 Database size before: 8500.00 MB
   🗑️  Deleted 288000 old sensor readings
   📦 Database size after: 1500.00 MB
   💾 Space reclaimed: 7000.00 MB
   ```

## 🐛 Troubleshooting

### Problem: Baza previše raste

**Uzrok:** Cleanup job nije pokrenut ili je iskonfiguriran s predugo retention  
**Rješenje:** 
```bash
# Ručno pokreni cleanup
POST /api/admin/database/cleanup

# Ili smanji retention u retention.ts
RAW_DATA_DAYS: 3  # umjesto 7
```

### Problem: Spore SELECT upite

**Uzrok:** Nedostaju indexi ili premalo cache-a  
**Rješenje:** Provjeri da su svi indexi kreirani, povećaj cache:
```typescript
db.pragma('cache_size = -128000'); // 128MB umjesto 64MB
```

### Problem: "Database is locked"

**Uzrok:** Dugotrajna transakcija ili deadlock  
**Rješenje:** Koristi WAL mode (već omogućen) ili smanji vrijeme transakcija

## 📚 Dodatni Resursi

- **SQLite dokumentacija:** https://sqlite.org/docs.html
- **better-sqlite3:** https://github.com/WiseLibs/better-sqlite3
- **Best practices:** https://sqlite.org/intern-v-extern-blob.html

---

**Verzija:** 1.0.0  
**Zadnje ažurirano:** 12. ožujka 2026.
