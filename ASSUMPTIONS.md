# Assumptions and Technical Decisions

This document outlines key architectural assumptions, rationale, and design choices made during the implementation of the School Admission System.

---

## 1. Seat Hold Expiration Mechanism (Lazy Expiration)

Instead of using a background worker with polling delays, hold expiration is handled via real-time query checks (Lazy Expiration). This prevents latency, avoids concurrency deadlocks across multiple backend processes, and guarantees zero-second seat release.

### Rationale:
- **Zero Polling Latency:** A background worker with a periodic interval (e.g. 5-10 seconds) leaves expired seats locked until the next tick. Query-level checking guarantees that an expired seat becomes available to other applicants immediately.
- **Resource Optimization:** Eliminates unnecessary continuous polling queries against the database during idle periods.
- **Multi-Process Safety:** Multiple backend instances do not compete to update expired records in background loops.

---

## 2. Bonus 2.6: Multi-Process Concurrency Safety

### Guaranteeing Rule 1 Across Multiple Backend Processes:
The assignment bonus explores running two backend instances on different ports connected to the same PostgreSQL database.

Our concurrency control uses **PostgreSQL Row-Level Locking (`SELECT ... FOR UPDATE`)** inside database transactions:
- When any process requests a seat hold for a specific class, PostgreSQL acquires an exclusive row lock on that class row.
- Any other request (whether originating from the same process or an independent second backend instance) will wait until the active transaction completes.
- Because the lock is enforced by PostgreSQL's transaction manager rather than in-memory process locks, `held + confirmed <= totalSeats` is strictly guaranteed across any number of distributed backend instances.

---

## 3. ID Generation & Format

- **Class IDs:** Prefixed with `c_` followed by an 8-character unique alphanumeric string (e.g. `c_4a1b2c3d`).
- **Hold IDs:** Prefixed with `h_` followed by an 8-character unique alphanumeric string (e.g. `h_9f8e7d6c`).
- This satisfies the example format in the specification (`c_123`, `h_789`) while ensuring global uniqueness.

---

## 4. Student Identification (`X-Student-Id`)

- As specified in Section 2.4, the student identity is transmitted via the `X-Student-Id` header.
- Validated as a 17-digit numeric string matching the standard Bangladeshi Birth Registration Number.
- Persisted in browser `localStorage` to preserve user sessions across page reloads and browser restarts.

---

## 5. Mock Payment Gateway

- In accordance with Section 1.3, clicking "Pay Admission Fee" assumes payment is immediately successful without integrating an external gateway.
- Confirmation is idempotent; repeated confirmation calls return HTTP 200 `CONFIRMED` without incrementing confirmed seat counts.

