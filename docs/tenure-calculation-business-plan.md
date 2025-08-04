# **Tenure Calculation Logic - Business Plan**

## **Problem We're Solving**
Employees accrue more annual leave as they gain years of service, but **extended unpaid leave shouldn't count toward tenure**.

## **Core Solution**
Track an **"Effective Anniversary Date"** that shifts forward when employees take extended unpaid leave.

---

## **Business Rules**

### **Extended Leave Definition**
- Unpaid leave longer than 30 consecutive days
- Examples: Maternity leave, sabbatical, personal leave, medical leave

### **Leave Accrual Ladder**
- **1st year**: 12 days annual leave
- **2nd year**: 13 days  
- **3rd year**: 15 days
- **4th year**: 18 days
- **5th year+**: 22 days

---

## **How It Works**

### **Step 1: Employee Starts**
- Join date: January 1, 2020
- Effective anniversary date: January 1, 2020
- First anniversary: January 1, 2021

### **Step 2: Extended Leave Taken**
- Employee takes 90 days unpaid leave
- Effective anniversary date shifts forward by 90 days
- New anniversary date: April 1st (instead of January 1st)

### **Step 3: Tenure Calculation**
- Calculate years of service using the **shifted anniversary date**
- Employee with 4 calendar years but 90 days unpaid leave = 3.75 years tenure
- Leave accrual based on actual working tenure, not calendar years

---

## **Processing Timeline**

### **When Leave Ends**
- **Completed leave**: Update anniversary date immediately
- **Future leave**: Wait until leave actually ends before adjusting

### **Daily Background Process**
- Check for any recently completed extended leaves
- Update anniversary dates for affected employees
- Prevent double-counting the same leave period

### **Recovery Mechanism**
- If daily process fails, catch up on next successful run
- Never lose track of extended leaves
- Self-correcting system

---

## **Real Examples**

### **Example 1: No Extended Leave**
- Joined: Jan 1, 2020
- Current: Jan 1, 2024
- **Result**: 4 years tenure → 18 days annual leave

### **Example 2: One Extended Leave**
- Joined: Jan 1, 2020  
- Extended leave: Feb-May 2022 (90 days)
- Current: Jan 1, 2024
- **Result**: 3.75 years tenure → 15 days annual leave

### **Example 3: Multiple Extended Leaves**
- Joined: Jan 1, 2019
- Leave 1: Mar-May 2020 (61 days)
- Leave 2: Jun-Aug 2022 (75 days)
- Total adjustment: 136 days
- **Result**: Anniversary shifts from Jan 1st to May 17th

---

## **Key Benefits**

1. **Fair**: Only actual working time counts toward tenure
2. **Automatic**: System handles all calculations in background  
3. **Transparent**: Employees can see their effective anniversary date
4. **Accurate**: Leave accrual always reflects true service time
5. **Reliable**: Handles system failures and corrections gracefully

## **Monitoring**
- Track which extended leaves have been processed
- Alert if any leaves are missed
- Ability to manually correct if needed
- Clear audit trail of all adjustments

This ensures employees earn leave benefits based on **actual working tenure**, not just calendar time since hire.