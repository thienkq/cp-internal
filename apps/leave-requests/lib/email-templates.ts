interface LeaveRequestEmailData {
  requesterName: string;
  requesterEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string | null;
  isHalfDay: boolean;
  halfDayType: "morning" | "afternoon" | null;
  message: string;
  emergencyContact: string | null;
  projects: Array<{ id: string | null; name: string }> | null;
  managerName: string | null;
  backupName: string | null;
  status: string;
}

interface LeaveRequestActionEmailData extends LeaveRequestEmailData {
  leaveRequestId: string;
  dashboardUrl: string;
}

export function generateLeaveRequestInfoTemplate(data: LeaveRequestEmailData): string {
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
    return `Yes (${halfDayType || 'Not specified'})`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request Notification</title>
      <style>
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Leave Request Confirmation</h1>
        <p>Your leave request has been submitted successfully.</p>
      </div>

      <div class="table-container">
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
          <tr>
            <th>End Date</th>
            <td>${formatDate(data.endDate)}</td>
          </tr>
          <tr>
            <th>Half Day</th>
            <td>${formatHalfDay(data.isHalfDay, data.halfDayType)}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
          </tr>
          <tr>
            <th>Manager</th>
            <td>${data.managerName || 'Not assigned'}</td>
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
        </table>
      </div>

      <div class="footer">
        <p>You can view this request in the internal tools dashboard.</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateLeaveRequestActionTemplate(data: LeaveRequestActionEmailData): string {
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
    return `Yes (${halfDayType || 'Not specified'})`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request - Action Required</title>
      <style>
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
        .btn-approve {
          background-color: #10b981;
          color: white;
        }
        .btn-reject {
          background-color: #ef4444;
          color: white;
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
      </style>
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

      <div class="action-buttons">
        <a href="${data.dashboardUrl}/admin" 
           class="btn btn-view" 
           style="background-color: #3b82f6; color: white; text-decoration: none; display: inline-block; padding: 12px 24px; margin: 0 10px; border-radius: 6px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
           View Dashboard
        </a>
      </div>

      <div class="table-container">
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
          <tr>
            <th>End Date</th>
            <td>${formatDate(data.endDate)}</td>
          </tr>
          <tr>
            <th>Half Day</th>
            <td>${formatHalfDay(data.isHalfDay, data.halfDayType)}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
          </tr>
          <tr>
            <th>Manager</th>
            <td>${data.managerName || 'Not assigned'}</td>
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
        </table>
      </div>

      <div class="footer">
        <p>Please review this leave request in the admin dashboard.</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}