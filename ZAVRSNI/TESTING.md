# 🧪 Testiranje Database Funkcionalnosti

## Brzi Start

### 1. Pokreni Backend (ako već nije pokrenut)

```bash
cd backend
npm run dev
```

Trebali biste vidjeti:
```
🗄️  Initializing database...
📂 Database file: C:\...\backend\data\city.db
📊 Creating database schema...
✅ Database initialized successfully!
📋 Tables created: sensor_readings, vehicle_positions, ...
⏰ Scheduling daily cleanup job at 3:00
✅ Cleanup job scheduled successfully!

🚀 Digital Twin Đakovo Backend running on port 3001
📡 WebSocket server ready
🌐 API: http://localhost:3001/api
📊 Database ready with 7 tables
```

### 2. Provjeri inicijalizaciju

Otvori u browseru: **http://localhost:3001/**

Trebali biste vidjeti JSON s informacijama o bazi:
```json
{
  "message": "Digital Twin Đakovo Backend API",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "size_mb": "0.05",
    "tables": {
      "sensor_readings": 0,
      "vehicle_positions": 0,
      ...
    }
  }
}
```

## 🧪 Testiranje API Endpointa

### Test 1: Provjeri da se podaci spremaju

1. Pokreni frontend i pusti ga da radi 30 sekundi
2. Otvori: **http://localhost:3001/api/history/stats**

Očekivani rezultat:
```json
{
  "total_readings": 150,  // ili više
  "by_type": [
    {
      "sensor_type": "traffic",
      "sensor_count": 3,
      "reading_count": 30,
      "first_reading": 1710247893,
      "last_reading": 1710247923
    }
  ]
}
```

### Test 2: Dohvati povijest za jedan senzor

Otvori: **http://localhost:3001/api/history/sensor/traffic-001**

Očekivani rezultat:
```json
{
  "sensor_id": "traffic-001",
  "from": 1710247893,
  "to": 1710334293,
  "count": 28800,
  "aggregation": "raw",
  "data": [
    {
      "id": 1,
      "sensor_id": "traffic-001",
      "timestamp": 1710334293,
      "data": {
        "vehicleCount": 45,
        "averageSpeed": 32.5,
        "congestionLevel": "medium"
      }
    },
    ...
  ]
}
```

### Test 3: Najnovije očitanje

Otvori: **http://localhost:3001/api/history/sensor/traffic-001/latest**

Očekivani rezultat:
```json
{
  "id": 28800,
  "sensor_id": "traffic-001",
  "sensor_type": "traffic",
  "timestamp": 1710334293,
  "data": {
    "sensorId": "traffic-001",
    "timestamp": 1710334293,
    "vehicleCount": 52,
    "averageSpeed": 28.1,
    "congestionLevel": "high"
  }
}
```

### Test 4: Kreiraj Event

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "accident",
    "title": "Prometna nesreća",
    "description": "Sudar dva vozila na Korzu",
    "lat": 45.3095,
    "lng": 18.4115,
    "severity": "high",
    "status": "active"
  }'
```

Očekivani response:
```json
{
  "message": "Event created successfully",
  "event_id": 1
}
```

### Test 5: Dohvati sve događaje

Otvori: **http://localhost:3001/api/events**

Očekivani rezultat:
```json
{
  "count": 1,
  "events": [
    {
      "id": 1,
      "event_type": "accident",
      "title": "Prometna nesreća",
      "description": "Sudar dva vozila na Korzu",
      "lat": 45.3095,
      "lng": 18.4115,
      "severity": "high",
      "status": "active",
      "created_at": "2026-03-12T09:30:00.000Z"
    }
  ]
}
```

### Test 6: Admin - Database Stats

1. Prvo se prijavi kao admin (vidi ADMIN_DOKUMENTACIJA.md)
2. Dohvati token iz frontend local storage
3. Pozovi:

```bash
curl -X GET http://localhost:3001/api/admin/database/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Očekivani rezultat:
```json
{
  "success": true,
  "data": {
    "file": "C:\\...\\backend\\data\\city.db",
    "size_bytes": 98304,
    "size_mb": "0.09",
    "tables": {
      "sensor_readings": 450,
      "vehicle_positions": 0,
      "sensor_readings_5min": 0,
      "sensor_readings_hourly": 0,
      "city_events": 1,
      "alerts": 0,
      "system_metrics": 0
    },
    "total_readings": 450
  }
}
```

### Test 7: Manualno pokretanje cleanup-a

```bash
curl -X POST http://localhost:3001/api/admin/database/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Trebali biste vidjeti u backend konzoli:
```
🧹 ============================================
🧹 Starting scheduled cleanup job...
🧹 ============================================

📦 Database size before: 0.09 MB
📊 Raw readings: 450
📊 Aggregating data to 5-minute intervals...
✅ Aggregated 0 5-minute intervals
📊 Aggregating data to hourly intervals...
✅ Aggregated 0 hourly intervals
🗑️  Deleted 0 old sensor readings (older than 7 days)
🗑️  Deleted 0 old vehicle positions
🗑️  Deleting old aggregated data...
  Deleted 0 old 5-minute records
  Deleted 0 old hourly records
🧹 Running VACUUM to reclaim disk space...
✅ VACUUM completed

✅ Cleanup completed in 123ms
📦 Database size after: 0.08 MB
💾 Space reclaimed: 0.01 MB
📊 Raw readings: 450
```

## 📊 Provjera Baze Podataka

### Lokacija baze:
```
backend/data/city.db
```

### Provjeri veličinu:

**Windows PowerShell:**
```powershell
Get-Item backend\data\city.db | Select-Object Name, Length, LastWriteTime
```

**Linux/Mac:**
```bash
ls -lh backend/data/city.db
```

### Otvori bazu (opciono):

Možete koristiti SQLite browser:
- https://sqlitebrowser.org/
- Otvori `backend/data/city.db`
- Pregled tablice: `sensor_readings`

## 🎯 Što očekivati nakon 24 sata rada

```
Podaci nakon 24 sata:
- Raw readings: ~2,880,000 zapisa (100 senzora × 28,800 očitanja/dan)
- Database size: ~1.2 GB
- Insert performanse: ~0.8ms za 100 zapisa
- Select performanse: ~0.002ms po query
```

## ⚠️ Troubleshooting

### Problem: "Database is locked"
**Rješenje:** Ugasi sve backend procese i ponovno pokreni

### Problem: Baza ne raste
**Rješenje:** Provjeri da frontend šalje podatke preko WebSocket-a. U konzoli backend-a trebali biste vidjeti svakih 60 sekundi:
```
💾 Saved 150 sensor readings to database in 0.8ms
```

### Problem: Nema 'city.db' datoteke
**Rješenje:** Datoteka se automatski kreira pri prvom pokretanju. Ako je nema, provjeri grešku u backend konzoli.

### Problem: API vraća prazne podatke
**Rješenje:** Pričekaj 30-60 sekundi da se nakupi malo podataka, zatim ponovno provjeri.

## 📈 Monitoring Performansi

Provjeri konzolu backend-a:
- Svaki **60s**: Log o tome koliko zapisa je spremljeno
- Svaki **dan u 3:00 AM**: Automatski cleanup log
- Pri startupu: Info o bazi i tablicama

---

**Napomena:** Svi testovi pretpostavljaju da backend i frontend rade. Ako nešto ne radi, prođi kroz [DATABASE.md](./DATABASE.md) za detaljnu dokumentaciju.
