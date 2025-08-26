interface LeaveRequestEmailData {
  requesterName: string;
  requesterEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string | null;
  isHalfDay: boolean;
  halfDayType: "morning" | "afternoon" | null;
  workingDays: number;
  formattedDays: string;
  message: string;
  emergencyContact: string | null;
  projects: Array<{ id: string | null; name: string }> | null;
  managerName: string | null;
  managerEmail: string | null;
  backupName: string | null;
  status: string;
  cancelReason?: string;
}

interface LeaveRequestActionEmailData extends LeaveRequestEmailData {
  leaveRequestId: string;
  dashboardUrl: string;
}

// Shared helper functions
const formatDate = (date: string | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatProjects = (projects: Array<{ id: string | null; name: string }> | null) => {
  if (!projects || projects.length === 0) return 'N/A';
  return projects.map(p => p.name).join(', ');
};

const formatHalfDay = (isHalfDay: boolean, halfDayType: "morning" | "afternoon" | null) => {
  if (!isHalfDay) return 'No';
  return halfDayType || 'Not specified';
};

// Shared CSS styles
const getEmailStyles = () => `
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
  }
  .header h1 {
    color: #2563eb;
    margin: 0;
    font-size: 24px;
  }
  .action-required {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    text-align: center;
  }
  .action-required h2 {
    color: #92400e;
    margin: 0 0 10px 0;
    font-size: 18px;
  }
  .action-buttons {
    margin: 20px 0;
    text-align: center;
  }
  .btn {
    display: inline-block;
    padding: 12px 24px;
    margin: 0 10px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .btn-view {
    background-color: #3b82f6;
    color: white;
  }
  .table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    background-color: #f1f5f9;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
    width: 35%;
  }
  td {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:last-child td {
    border-bottom: none;
  }
  .status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status.pending {
    background-color: #fef3c7;
    color: #92400e;
  }
  .message-content {
    background-color: #f8fafc;
    padding: 10px;
    border-radius: 4px;
    border-left: 4px solid #3b82f6;
    font-style: italic;
  }
  .footer {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
  }
`;

// Shared table rows generator
const generateLeaveRequestTable = (data: LeaveRequestEmailData) => `
  <table>
    <tr>
      <th>Requester Name</th>
      <td>${data.requesterName}</td>
    </tr>
    <tr>
      <th>Requester Email</th>
      <td>${data.requesterEmail}</td>
    </tr>
    <tr>
      <th>Leave Type</th>
      <td>${data.leaveType}</td>
    </tr>
    <tr>
      <th>Start Date</th>
      <td>${formatDate(data.startDate)}</td>
    </tr>
    ${!data.isHalfDay ? `
    <tr>
      <th>End Date</th>
      <td>${formatDate(data.endDate)}</td>
    </tr>` : ''}
    ${data.isHalfDay ? `
    <tr>
      <th>Half Day</th>
      <td>${formatHalfDay(data.isHalfDay, data.halfDayType)}</td>
    </tr>` : ''}
    <tr>
      <th>Duration</th>
      <td><strong>${data.formattedDays}</strong></td>
    </tr>
    <tr>
      <th>Status</th>
      <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
    </tr>
    <tr>
      <th>Manager</th>
      <td>${data.managerName || 'Not assigned'}${data.managerEmail ? ` (${data.managerEmail})` : ''}</td>
    </tr>
    <tr>
      <th>Backup Person</th>
      <td>${data.backupName || 'Not assigned'}</td>
    </tr>
    <tr>
      <th>Projects</th>
      <td>${formatProjects(data.projects)}</td>
    </tr>
    <tr>
      <th>Emergency Contact</th>
      <td>${data.emergencyContact || 'Not provided'}</td>
    </tr>
    <tr>
      <th>Message</th>
      <td>
        ${data.message ? `<div class="message-content">${data.message}</div>` : 'No message provided'}
      </td>
    </tr>
    ${data.cancelReason ? `
    <tr>
      <th>Cancellation Reason</th>
      <td>
        <div class="message-content" style="color: #dc2626; font-weight: 500;">${data.cancelReason}</div>
      </td>
    </tr>` : ''}
  </table>
`;

export function generateLeaveRequestInfoTemplate(data: LeaveRequestEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request Notification</title>
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="header">
        <h1>Leave Request Notification</h1>
      </div>

      <div class="table-container">
        ${generateLeaveRequestTable(data)}
      </div>

      <div class="footer">
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}


export function generateLeaveRequestActionTemplate(data: LeaveRequestActionEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request - Action Required</title>
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="header">
        <h1>Leave Request - Action Required</h1>
        <p>A new leave request has been submitted and requires your review.</p>
      </div>

      <div class="action-required">
        <h2>Action Required</h2>
        <p>Please review and approve or reject this leave request.</p>
      </div>

      <div class="table-container">
        ${generateLeaveRequestTable(data)}
      </div>

      <div class="action-buttons">
        <a href="${data.dashboardUrl}/manager" 
           class="btn btn-view" 
           style="background-color: #3b82f6; color: white; text-decoration: none; display: inline-block; padding: 12px 24px; margin: 0 10px; border-radius: 6px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
           Manager Dashboard
        </a>
        <a href="${data.dashboardUrl}/admin" 
           class="btn btn-view" 
           style="background-color: #6b7280; color: white; text-decoration: none; display: inline-block; padding: 12px 24px; margin: 0 10px; border-radius: 6px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
           Admin Dashboard
        </a>
      </div>

      <div class="footer">
        <p>Please review this leave request using either the Manager Dashboard (for team managers) or Admin Dashboard (for HR/administrators).</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}