# **Leave Requests App \- PRD**

## **1\. Objective**

To build a modern Leave Request System using **Next.js** and **Supabase**, replacing the legacy Rails version. The new system will simplify leave tracking, approval workflows, and policy configuration, with a focus on performance, UX, and extensibility.

## **2\. User Roles & Core Features**

### **2.1 User Roles**

* **Employee:** Submit, view, cancel, and edit leave requests (e.g., date, reason, manager), and check leave balances..  
* **Manager:** Approves/rejects requests, views team calendar, receives email notification.  
* **HR/Admin:** Configures leave policies, manages users and projects, views reports  
* **External Client Manager:** Receives view-only notifications for embedded team members' leave.

### **2.2 Core Features**

* **Leave Management:** Request/approve/reject/cancel leave, with support for half-days.  
* **Balance Tracking:** Real-time calculation of leave balances, excluding weekends and holidays.  
* **Calendar:** Personal and team calendars showing leave status (color-coded).  
* **Dashboard:** Provides **employees** with personal leave tracking and request management; **managers** with team calendars and approval tools; and **HR/admins** with company-wide oversight, policy control, and reporting access.  
* **Reporting:** Exportable reports (CSV, PDF) on leave usage by type, employee, period, and project.  
* **Notifications:** Automated email notifications for all workflow steps (submission, approval, rejection, cancellation) and reminders for pending approvals.

## **3\. Key Business Logic**

### **3.1 Tenure-Based Leave Accrual**

* **Logic:** An employee's annual leave quota automatically increases based on their years of active service (thâm niên).
* **For CoderPush:** 1st year = 12 days → 2nd year = 13 → 3rd year = 15 → 4th year = 18 → **5th year and beyond: 22 days**
* **Active Service Calculation:**  
  - The system must calculate tenure based on the employee's total "active service time," not just the original start date.
  - **Definition of Extended Absence:** Any period of unpaid leave, sabbatical, or other approved absence that lasts longer than 1 month (30 consecutive days) is considered an "extended absence." These periods are excluded from the tenure calculation.
  - For example, if an employee joined on Jan 1, 2020, but took a 3-month unpaid leave in 2022, their tenure as of Jan 1, 2024, would be 3 years and 9 months (not 4 years).
  - The system should automatically deduct the total duration of all extended absences from the employee's service time when determining their leave accrual tier.
* **Admin Flexibility:**  
  - The system uses these values as default, but admins can enable/disable the rule or override the values dynamically via the Admin Dashboard.

### **3.2 Leave Carryover (Rollover)**

* **Logic:** Unused leave days from the previous year can be used in the new year, but only until a specified cutoff date (e.g., January 31). After this date, any unused carryover days expire.  
* **Implementation:** Carryover days are consumed first. After the cutoff date, any remaining carryover days expire. The system must track and display the carryover balance separately.  
* **UX Note:** Consider adding a breakdown section or hover tooltips in the leave balance area to help users distinguish between **carryover leave** vs **current year entitlement**

⚠️  **Known Issue:** With Coderbase, employee could **not request leave for the next year** (e.g., 2025\) before Jan 1, 2025 → The new system will allow employees to submit leave requests for future-year dates before Jan 1\.   
*For example:*   
**Context**: In Dec 2024, Employee A has:

- **2 carryover** days (from 2024), valid until Jan 31, 2025  
- **12 days** of 2025 leave

**Action**  
While **still in December 2024**, the employee submits a leave request for **Jan 30 – Feb 2, 2025** (**4** days total)  
**System Logic:**

- Jan 30 – 31 → use **2 carryover days**  
- Feb 1 – 2 → use **2 days from 2025 quota**

**Result:**

- **Carryover:** 0 days remaining  
- **2025 balance:** 10 days remaining

### **3.3 Leave Types** 

**Supported Leave Types (Default for CoderPush):**

* **Annual Leave** – Carries over to next year (within cutoff eg 31Jan).  
* **Wedding Leave** – Up to 3 days.  
* **Emergency Leave** – Quota defined by Coderpush HR (e.g., 3 days).  
* **Unpaid Leave** – No quota, time off without pay.

**Leave Type Behavior:**

* **Only Annual Leave** supports carryover to the next year.  
* **Half-Day Requests:** All leave types (including Unpaid) must support **half-day** requests.  
  * ⚠️ *Known Issue:* Coderbase did **not** support half-day Unpaid Leave. The new system **must support half-day for all leave types.**

**Client Notification Behavior:**

* Leave type **does not affect** the email notification sent to the client manager.  
* Leave type is mainly used for **internal tracking (Admin/HR/Accounting)** only.

**Admin Flexibility:**

* Admins can **create or update** leave types.

* For each leave type, they can configure:  
  * Whether **carryover** is allowed.  
  * Whether **half-day** leave is allowed.  
  * Custom **quota limits** if applicable (e.g., 3-day emergency leave).

    ![][image2]

### **3.4 Public Holidays & Compensatory Days Off**

* HR/Admin can **configure official public holidays** and **compensatory days off** (make-up holidays declared by the government) in the Admin Dashboard.  
* These dates are based on the VietNam national calendar and apply to all employees.  
* When an employee submits a leave request that spans multiple days, the system will:  
  * **Automatically exclude weekends, public holidays, and compensatory days off** from the leave calculation.  
  * **Only count actual working days** as leave deducted from the employee's balance.

**Example:**

An employee requests leave from April 27 to May 2

If April 30 and May 1 are public holidays, and May 2 is a compensatory day off  

→ Only April 27–29 will be counted as leave (3 days).

### **3.4 Bonus Leave Days Per Employee**

In special cases — such as project completions, performance rewards, or management exceptions — specific employees may be granted **bonus leave days**. These days are:

* **Individually assigned** (not applied company-wide)  
* Added to  the employee's annual leave quota  
* **Eligible for carryover**, following the same rules and cutoff as standard annual leave

**System Requirements:**

* HR/Admin must be able to **assign bonus leave days per employee** through the Admin Dashboard  
* Carryover of unused bonus leave must respect the same **expiry logic** as annual leave carryover (e.g., expires after Jan 31\)

### **3.5 Approval Leave Requests**

 **Employee** Submits Leave Request

* Need provide:

  * **Client Manager Email** – *required only if the employee is assigned to a client project (used for notification only).*

  * **Internal CoderPush Manager** – *optional; becomes the primary approver if selected.*

**Client Manager**

* Receives a **view-only email notification**.  
* No approval action is required.  
* Email content is simple and contains essential leave details.

**Internal CoderPush Manager**

* If selected, this manager becomes the **primary approver**.  
* An email is sent with:  
  * Employee name and leave details  
  * Clear **Approve** button and approval link

**HR / Admin (Fallback & Oversight)**

* **Always receives notifications** for all leave requests.  
* **Has authority to approve/reject any request**, especially If **no internal manager is assigned**, or If the internal manager does not respond in time

### **3.6 Client Billing Logic with Leave Impact** 

* **Billing Logic:** Ensures clients are only billed for days an employee is actively working.  
  * **Process:** When a "client-billed" employee takes approved leave, those days are automatically subtracted from the total working days in project-level reports.  
  * **Outcome for Client:** The client's invoice accurately reflects only the days the employee worked.  
  * **Outcome for Employee:** The employee's internal payroll is not affected. They are paid for their approved leave as usual.

⚠️ Billing logic can be complex and vary by project, so in the first phase, the Leave Request System will focus on generating leave reports for Admin/Accounting — detailed enough to support them in manual client billing calculations

Goal: Provide downloadable **monthly** reports that help Accounting/HR determine billable days **per employee and per project**, aligned with the client's billing model — without manually checking each leave request

**Report Requirements:**

* **Filter by:** month, project   
* **Show:**   
- For each employee in the project, will show:   
+ Total workings day in month  
+ Public Holidays  
+ Leave Days Taken  
+ Billable Days 

🧠 To ensure the logic is **self-explanatory for users**, this feature should include a **mock UI or sample table layout**

**3.7 Employee Payroll with Leave Impact** 

Provide HR/Accounting with a monthly report that summarizes each employee's total leave usage to support accurate payroll salary calculations.

**Report Requirements:**

* **Filter by:** month, employee  
* **Show:**   
- Total working days in the month (excluding weekends)   
- Total leave days taken (with leave type)   
- Leave days that affect payroll (e.g. **unpaid leave**)

## **4\. User Stories**

* **Employee:** I want to easily request leave from the web, see my balance, and know the status of my requests.  
* **Manager:** I want to quickly approve/deny requests, see who on my team is away, and be reminded of pending requests.  
* **HR/Admin:** I want to configure our company's leave policies, manage users, and generate reports on leave usage.  
* **Client Manager:** I want to be informed when my embedded team members are taking time off.

## **5\. Technical & Non-Functional Requirements**

* **Tech Stack:** Next.js, Supabase (Postgres with RLS).  
* **Performance:** Fast response times and optimized queries.  
* **Scalability:** Designed to support around 100 employees.  
* **Key Integrations:** Google Calendar sync for auto-adding approved leaves.

## **6\. Future Enhancements**

* AI-based chat for submitting leave requests.  
* Analytics dashboard for HR.

## **7\. Deliverables**

* Responsive Web Application  
* Admin Dashboard

## **8\. Inspirational References**

* [Day Off \- PTO & Vacation Tracker](https://www.day-off.app/)  
* [Vacation Tracker](https://vacationtracker.io/)

