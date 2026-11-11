# School Admission System

A high-concurrency, real-time school admission platform built on a first-come, first-served basis with automated seat holding and lazy expiration.

Developed for **Onnorokom Projukti Limited** (Assistant Software Engineer Recruitment).

---

## 🚀 Tech Stack

- **Backend:** C# (.NET 8 Web API)
- **Database:** PostgreSQL with Entity Framework Core 8
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Containerization:** Docker & Docker Compose (Multi-stage builds)

---

## 📦 How to Run with Docker

The entire platform runs via Docker with zero host dependencies required.

### 1. Start the Complete Application

From the root of the repository, execute:

```bash
docker compose up --build
```

This starts:
1. **PostgreSQL Database:** Running on port `5432` with persistent storage volume.
2. **.NET 8 Backend API:** Running on `http://localhost:8080`.
3. **React 18 Frontend UI:** Running on `http://localhost:3000`.

### 2. Access the Application

- **Frontend User Interface:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Documentation:** [http://localhost:8080/swagger](http://localhost:8080/swagger)

---

## 🧪 How to Run Automated Tests

To execute the test suite (Unit Tests, API Contract Tests, and Concurrency Verification Tests):

```bash
docker compose run --rm backend dotnet test backend.csproj
```

Or locally if you have .NET 8 SDK installed:

```bash
cd backend
dotnet test backend.csproj
```

### Included Automated Tests:
1. **UnitTests.cs:**
   - 17-digit Student ID validation (HTTP 400).
   - Single active hold constraint per student per class (HTTP 400).
   - Student ownership validation for confirmation (HTTP 403).
   - Unauthorized hold cancellation prevention (HTTP 403 Forbidden).
   - Idempotent confirmation check (seat count never increments twice).
2. **ApiContractTests.cs:**
   - Strict contract verification for all 8 REST endpoints matching the assignment specification.
3. **ConcurrencyTests.cs (Mandatory Concurrency Test):**
   - Simulates 25 concurrent student hold requests sent simultaneously against a class with only 5 seats.
   - Verifies that exactly 5 succeed (HTTP 201 Created), 20 fail with HTTP 409 Conflict, and total holds never exceed total seats.

---

## 🎨 Frontend Features & Interactive Matrix Preview

- **Live 60-Seat Classroom Matrix:** Visual mini-hall grid dynamically depicting real-time seat states (`Confirmed` in Emerald, `Held` in Pulsing Amber, `Available` in Clean Slate).
- **Interactive Seat Tooltips:** Hovering any seat reveals the exact seat number and live occupancy status.
- **Segmented Capacity Progress Bar:** Instant percentage breakdown showing confirmed vs held vs available ratios.
- **Live Student ID Validator:** Real-time digit counter (`X/17`) with emerald verification checkmark on valid 17-digit Birth Registration Number input.
- **Accessible Modal Controls:** Full keyboard navigation support (Escape key dismiss) and backdrop blur overlays for application views and class creation.

---

## ⚡ Concurrency & Architecture Highlights

1. **Pessimistic Row-Level Locking:**
   - Seat reservation utilizes PostgreSQL `SELECT ... FOR UPDATE` within transaction boundaries.
   - Eliminates race conditions even under heavy burst traffic and across multiple backend process instances.
2. **Zero-Latency Lazy Expiration (No Background Polling Delay):**
   - Holds are evaluated in real time at the query level (`Status == 'HELD' && ExpiresAt > DateTime.UtcNow`).
   - Seats are instantly available the exact moment a hold expires without waiting for a background worker.
3. **Data Persistence:**
   - PostgreSQL uses named volume `pgdata` to guarantee zero data loss across `docker compose down` and `docker compose up`.
