# Leave Request Implementation Plan

## 1. Overview

This document outlines the plan to implement the Leave Request feature for the Leave Requests App.  
It covers the minimum required to allow users to create a new leave request, using master data for leave types and company settings (no admin UI for editing at this stage).

---

## 2. Master Data

- **Leave Types:**  
  - Pre-seeded in the database (e.g., Annual, Wedding, Emergency, Unpaid).
  - Each type has: name, supports_carryover, supports_half_day, quota (if any).

- **Company Settings:**  
  - Stored as a single row in a settings table or config.
  - Includes: carryover cutoff date, tenure-based accrual rules, etc.

---

## 3. Database Schema

- **leave_requests**
  - id, user_id, leave_type_id, start_date, end_date, is_half_day, reason, status, created_at, updated_at, project_ids (array), client_manager_email, internal_manager_id

- **leave_types** (master data)
  - id, name, supports_carryover, supports_half_day, quota

- **company_settings** (master data)
  - id, carryover_cutoff_date, tenure_accrual_rules (JSON), etc.

- **users** (existing)

- **projects** (existing)

---

## 4. API Endpoints

- `GET /leave-types`  
  Returns all leave types for the form.

- `GET /company-settings`  
  Returns relevant settings for leave calculation.

- `POST /leave-requests`  
  Accepts: leave_type_id, start_date, end_date, is_half_day, reason, project_ids, client_manager_email, internal_manager_id  
  Validates: leave balance, overlapping requests, leave type rules, etc.  
  Creates a new leave request with status "pending".

- `GET /projects`  
  For project selection in the form.

---

## 5. Frontend Flow

- **Leave Request Form**
  - Fields: Leave Type, Dates (range, half-day), Reason, Projects (multi-select), Client Manager Email (if project assigned), Internal Manager (optional).
  - Fetch leave types and projects for dropdowns.
  - Show current leave balance and breakdown (current year, carryover, bonus).
  - Validate form before submission.

- **Submission**
  - On submit, call POST /leave-requests.
  - Show confirmation and update leave request list.

---

## 6. Leave Balance Calculation

- Calculate available leave (current year, carryover, bonus) for the user.
- Exclude weekends, public holidays, compensatory days (use master data for holidays).
- For half-day, deduct 0.5 from balance.
- For future-year requests, apply correct logic for carryover and new year quota.

---

## 7. Notifications (Optional for MVP)

- Email to internal manager (if selected) and HR/Admin.
- View-only email to client manager (if provided).

---

## 8. Testing

- Test leave request creation for all leave types.
- Test edge cases: half-day, spanning years, carryover logic, insufficient balance, etc.

---

## 9. Seed Data

- Scripts to populate leave_types and company_settings tables.

---

## 10. Out of Scope (for this phase)

- Admin UI for editing leave types or company settings.
- Advanced reporting, payroll, or billing logic.

---
