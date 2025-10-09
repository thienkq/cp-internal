import { Badge } from "@workspace/ui/components/badge";

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Pending"
    },
    approved: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 border-green-200",
      label: "Approved"
    },
    rejected: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 border-red-200",
      label: "Rejected"
    },
    canceled: {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      label: "Canceled"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge 
      variant={config.variant}
      className={config.className}
    >
      {config.label}
    </Badge>
  );
};

export const formatDateRange = (startDate: string, endDate?: string | null, isHalfDay?: boolean, halfDayType?: string | null) => {
  if (isHalfDay && !endDate) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatDate(startDate)}</span>
          <span className="inline-block w-2 h-2 bg-orange-400 rounded-full"></span>
        </div>
        <span className="block text-xs text-orange-600 font-medium mt-1">
          Half Day {halfDayType ? `(${halfDayType})` : ''}
        </span>
      </div>
    );
  }
  if (endDate && startDate !== endDate) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium text-sm">{formatDate(startDate)}</span>
        <span className="text-gray-400 text-xs">→</span>
        <span className="font-medium text-sm">{formatDate(endDate)}</span>
      </div>
    );
  }
  return <div className="font-medium">{formatDate(startDate)}</div>;
};

export const getDurationText = (startDate: string, endDate?: string | null, isHalfDay?: boolean) => {
  if (isHalfDay) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium">0.5</span>
        <span className="text-xs text-gray-500">days</span>
      </div>
    );
  }
  
  if (!endDate || startDate === endDate) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium">1</span>
        <span className="text-xs text-gray-500">day</span>
      </div>
    );
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate business days (excluding weekends)
  let businessDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = current.getDay();
    
    // Only count weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium">{businessDays}</span>
      <span className="text-xs text-gray-500">{businessDays === 1 ? 'day' : 'days'}</span>
    </div>
  );
}; 