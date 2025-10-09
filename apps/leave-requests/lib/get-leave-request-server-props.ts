import { getDb } from '@/db';
import {
  leaveTypes as leaveTypesTable,
  projects as projectsTable,
  users as usersTable,
} from '@/db/schema';
import { asc } from 'drizzle-orm';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// Internal function that performs the actual data fetching
const fetchLeaveRequestData = async () => {
  const db = getDb();
  const [leaveTypesData, projectsData, usersData] = await Promise.all([
    db.select().from(leaveTypesTable).orderBy(asc(leaveTypesTable.name)),
    db
      .select({ id: projectsTable.id, name: projectsTable.name })
      .from(projectsTable)
      .orderBy(asc(projectsTable.name)),
    db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .orderBy(asc(usersTable.full_name)),
  ]);

  const users = (usersData || [])
    .filter((u) => !!u.email)
    .map((u) => ({
      ...u,
      full_name: (u.full_name as string) || u.email as string,
      email: u.email as string,
    }));

  return {
    leaveTypes: leaveTypesData,
    projects: projectsData,
    users: users,
  };
};

// Cached version with 5-minute cache duration
const getCachedLeaveRequestData = unstable_cache(
  fetchLeaveRequestData,
  ['leave-request-data'],
  {
    revalidate: 86400, // 1 day
    tags: ['leave-types', 'projects', 'users'],
  }
);

// Request-level cache using React's cache function
export const getLeaveRequestServerProps = cache(getCachedLeaveRequestData);

// Cache revalidation functions
export const revalidateLeaveRequestData = async () => {
  'use server';
  const { revalidateTag } = await import('next/cache');
  revalidateTag('leave-types');
  revalidateTag('projects');
  revalidateTag('users');
};

// Individual revalidation functions for more granular control
export const revalidateLeaveTypes = async () => {
  'use server';
  const { revalidateTag } = await import('next/cache');
  revalidateTag('leave-types');
};

export const revalidateProjects = async () => {
  'use server';
  const { revalidateTag } = await import('next/cache');
  revalidateTag('projects');
};

export const revalidateUsers = async () => {
  'use server';
  const { revalidateTag } = await import('next/cache');
  revalidateTag('users');
};
