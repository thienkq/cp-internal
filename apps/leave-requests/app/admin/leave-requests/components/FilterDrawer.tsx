'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@workspace/ui/components/sheet';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command';
import { Label } from '@workspace/ui/components/label';
import { Filter, Check } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type UserLite = { id: string; full_name?: string | null; email?: string | null };

export default function FilterDrawer({
  usersWithUsage,
  selectedYear,
  selectedUserId,
}: {
  usersWithUsage: UserLite[];
  selectedYear: number;
  selectedUserId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState(false);

  // Applied values (from URL) with server fallback
  const appliedYear = React.useMemo(() => {
    const y = searchParams?.get('year');
    return y ? parseInt(y) : selectedYear;
  }, [searchParams, selectedYear]);
  const appliedEmployeeId = React.useMemo(() => {
    return searchParams?.get('userId') || selectedUserId || '';
  }, [searchParams, selectedUserId]);

  // Draft values in drawer
  const [draftYear, setDraftYear] = React.useState<number>(appliedYear);
  const [draftEmployeeId, setDraftEmployeeId] = React.useState<string>(
    appliedEmployeeId
  );

  React.useEffect(() => {
    if (open) {
      setDraftYear(appliedYear);
      setDraftEmployeeId(appliedEmployeeId);
    }
  }, [open, appliedYear, appliedEmployeeId]);

  const yearsOptions = React.useMemo(() => {
    const now = new Date().getFullYear();
    const years: number[] = [];
    for (let y = now + 1; y >= now - 2; y--) years.push(y);
    return years;
  }, []);

  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString());
    if (draftYear) params.set('year', String(draftYear));
    else params.delete('year');
    if (draftEmployeeId) params.set('userId', draftEmployeeId);
    else params.delete('userId');
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
    setOpen(false);
  }, [router, pathname, searchParams, draftYear, draftEmployeeId]);

  const clearFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString());
    const currentYear = new Date().getFullYear();
    setDraftYear(currentYear);
    setDraftEmployeeId('');
    params.set('year', String(currentYear));
    params.delete('userId');
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }, [router, pathname, searchParams]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto p-4 space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='year'>Year</Label>
            <div className='border rounded-md'>
              <Command>
                <CommandInput placeholder='Search year...' />
                <CommandList className='max-h-32 overflow-auto'>
                  <CommandEmpty>No years found.</CommandEmpty>
                  <CommandGroup>
                    {yearsOptions.map((y) => (
                      <CommandItem key={y} onSelect={() => setDraftYear(y)}>
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            y === draftYear ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {y}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            <div className='text-sm text-muted-foreground'>Selected: {draftYear}</div>
          </div>

          <div className='space-y-2'>
            <Label>Employee</Label>
            <div className='border rounded-md'>
              <Command>
                <CommandInput placeholder='Search employee...' />
                <CommandList className='max-h-32 overflow-auto'>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {usersWithUsage.map((u) => (
                      <CommandItem
                        key={u.id}
                        onSelect={() => setDraftEmployeeId(u.id)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            u.id === draftEmployeeId ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <div className='flex flex-col'>
                          <span>{u.full_name || u.email}</span>
                          <span className='text-xs text-muted-foreground'>
                            {u.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            {draftEmployeeId && (
              <div className='text-sm text-muted-foreground'>
                Selected: {usersWithUsage.find((x) => x.id === draftEmployeeId)?.full_name || usersWithUsage.find((x) => x.id === draftEmployeeId)?.email}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className='flex-shrink-0 border-t pt-4'>
          <div className='flex gap-2 w-full'>
            <Button onClick={applyFilters} className='flex-1'>Apply</Button>
            <Button variant='outline' onClick={clearFilters} className='flex-1'>Clear</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


