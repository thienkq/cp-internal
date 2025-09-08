-- leave_requests
alter table public.leave_requests
drop constraint if exists leave_requests_user_id_fkey,
add constraint leave_requests_user_id_fkey
foreign key (user_id) references public.users(id)
on update cascade
on delete cascade;

-- project_assignments
alter table public.project_assignments
drop constraint if exists project_assignments_user_id_fkey,
add constraint project_assignments_user_id_fkey
foreign key (user_id) references public.users(id)
on update cascade
on delete cascade;

-- addresses
alter table public.addresses
drop constraint if exists addresses_user_id_fkey,
add constraint addresses_user_id_fkey
foreign key (user_id) references public.users(id)
on update cascade
on delete cascade;

-- extended_absences
alter table public.extended_absences
drop constraint if exists extended_absences_user_id_fkey,
add constraint extended_absences_user_id_fkey
foreign key (user_id) references public.users(id)
on update cascade
on delete cascade;

-- bonus_leave_grants
alter table public.bonus_leave_grants
drop constraint if exists bonus_leave_grants_user_id_fkey,
add constraint bonus_leave_grants_user_id_fkey
foreign key (user_id) references public.users(id)
on update cascade
on delete cascade;