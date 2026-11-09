# AI Usage Report

This document summarizes the utilization of AI assistance during the design, development, and testing of the School Admission System.

---

## 1. Tools Used
- **AI Assistant:** Claude 3.5 Sonnet & Gemini (Interactive Pair Programming)

---

## 2. Areas Where AI Was Utilized
- **Edge-Case Brainstorming:** Exploring race-condition scenarios, transaction isolation level tradeoffs, and HTTP status code mappings against the assignment specifications.
- **Test Generation Acceleration:** Drafting repetitive xUnit test fixtures and payload boilerplate for the API contract test suite.
- **Regex Syntax Verification:** Confirming optimal compiled regular expressions for validating 17-digit numeric birth registration identifiers.

---

## 3. Notable AI Limitation & Engineering Correction

### Issue Identified:
During early discussions on seat expiration, the AI proposed running an ASP.NET Core `IHostedService` background worker with a periodic 5-second polling loop to scan and mark expired holds in the database.

### Why It Was Problematic:
1. **Seat Release Latency:** A periodic worker introduces an inherent delay (up to 5 seconds) before an expired seat is released, violating the real-time first-come-first-served expectation.
2. **Multi-Process Lock Contention:** For the bonus requirement (running two backend processes concurrently against the same database), multiple active workers would simultaneously attempt to lock and update the same rows, leading to transaction contention and deadlock risks.
3. **Unnecessary Database Overhead:** Periodic polling generates continuous read/write queries even when the application is idle.

### Engineering Resolution:
The background worker proposal was rejected. Instead, a **Query-Level Lazy Expiration** pattern was engineered:
- During seat count queries (`GET /classes`), active holds are dynamically filtered using `Status == 'HELD' && ExpiresAt > DateTime.UtcNow`.
- When an applicant checks a hold (`GET /holds/{id}`) or attempts payment (`POST /confirm`), the status is evaluated against the current UTC timestamp in real time.
- This guaranteed **zero-second seat release**, zero background database load, and flawless multi-process scalability.

