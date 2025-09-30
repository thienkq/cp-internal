export type UserUsage = {
  id: string;
  full_name: string | null;
  email: string | null;
  paid_used_days: number;
  unpaid_used_days: number;
  used_days: number;
};
