# NextAuth.js Migration - Remaining Work Checklist

## Phase 11: Critical Utility & Component Files (4 files)

- [ ] `lib/utils.ts` - Update utility functions
- [ ] `lib/bonus-leave-utils.ts` - Update bonus leave utilities
- [ ] `components/auth-button.tsx` - Update auth button
- [ ] `components/login-form.tsx` - Update login form

## Phase 12: Layout Files (3 files)

- [ ] `app/admin/layout.tsx`
- [ ] `app/dashboard/layout.tsx`
- [ ] `app/manager/layout.tsx`

## Phase 13: Admin Pages & Actions (10 files)

- [ ] `app/admin/bonus-leave/page.tsx`
- [ ] `app/admin/leave-requests/actions.ts`
- [ ] `app/admin/leave-types/page.tsx`
- [ ] `app/admin/page.tsx`
- [ ] `app/admin/projects/[projectId]/assignments/new/page.tsx`
- [ ] `app/admin/projects/[projectId]/assignments/page.tsx`
- [ ] `app/admin/set-admin/page.tsx`
- [ ] `app/admin/users/[userId]/page.tsx`
- [ ] `app/admin/users/page.tsx`

## Phase 14: Dashboard Pages & Actions (8 files)

- [ ] `app/dashboard/leave-balance-details/page.tsx`
- [ ] `app/dashboard/leave-requests/page.tsx`
- [ ] `app/dashboard/leave/[id]/edit/page.tsx`
- [ ] `app/dashboard/leave/new/actions.ts`
- [ ] `app/dashboard/my-assignments/page.tsx`
- [ ] `app/dashboard/profile/page.tsx`

## Phase 15: Manager Pages & Actions (6 files)

- [ ] `app/manager/actions.ts`
- [ ] `app/manager/approvals/page.tsx`
- [ ] `app/manager/leave-requests/page.tsx`
- [ ] `app/manager/page.tsx`
- [ ] `app/manager/team/page.tsx`

## Phase 16: Remaining Components (13 files)

- [ ] `components/admin/bonus-leave-form.tsx`
- [ ] `components/admin/bonus-leave-list.tsx`
- [ ] `components/admin/set-admin-form.tsx`
- [ ] `components/dashboard/enhanced-leave-balance-section.tsx`
- [ ] `components/layout/top-navbar.tsx`
- [ ] `components/member/context/index.tsx`
- [ ] `components/member/dashboard/context/index.tsx`
- [ ] `components/member/protected-component.tsx`
- [ ] `components/projects/assignment-form.tsx`
- [ ] `components/projects/assignment-list.tsx`
- [ ] `components/sign-up-form.tsx`
- [ ] `components/user-dropdown-menu.tsx`
- [ ] `components/users/bonus-leave-grants.tsx`
- [ ] `components/users/role-update-dialog.tsx`

## Phase 17: API Routes & Auth (2 files)

- [ ] `app/api/admin/users/[userId]/leave-stats/route.ts`
- [ ] `app/auth/callback/route.ts`

## Phase 18: Testing

- [ ] Start dev server: `npm run dev`
- [ ] Test Google sign-in
- [ ] Verify session created in database
- [ ] Test protected routes
- [ ] Test logout
- [ ] Test role-based access control
- [ ] Test all admin pages
- [ ] Test all dashboard pages
- [ ] Test all manager pages

## Phase 19: Cleanup

- [ ] Remove `@workspace/supabase` from package.json
- [ ] Remove Supabase environment variables from .env
- [ ] Delete `packages/supabase/` directory (if not used by other apps)
- [ ] Update documentation

## Phase 20: Production Deployment

- [ ] Generate strong `NEXTAUTH_SECRET` (min 32 chars)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Update environment variables in production
- [ ] Test authentication in staging
- [ ] Deploy to production
- [ ] Monitor sign-in success rate
- [ ] Monitor error logs

---

## 📊 Progress Summary

**Total Files to Update:** 44  
**Completed:** 0  
**In Progress:** 0  
**Remaining:** 44

**Estimated Time per File:** 10-15 minutes  
**Total Estimated Time:** 7-11 hours

---

## 🎯 Tips for Efficient Updates

1. **Use Find & Replace** for common patterns:
   - `createServerClient()` → `getCurrentUser()` or `getDb()`
   - `createBrowserClient()` → `useSession()`
   - `supabase.from('table')` → `db.select().from(table)`

2. **Test as You Go:**
   - Run `npm run build` after each phase
   - Fix any type errors immediately

3. **Group Similar Files:**
   - Update all admin pages together
   - Update all dashboard pages together
   - Update all components together

4. **Use Git Commits:**
   - Commit after each phase
   - Makes it easy to revert if needed

---

## 🚀 Quick Commands

```bash
# Build and check for errors
npm run build

# Run dev server
npm run dev

# Run tests
npm run test

# Check for remaining Supabase imports
grep -r "@workspace/supabase" --include="*.ts" --include="*.tsx"

# Count remaining imports
grep -r "@workspace/supabase" --include="*.ts" --include="*.tsx" | wc -l
```

---

**Last Updated:** 2025-10-22  
**Status:** Ready to start Phase 11

