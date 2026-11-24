-- AnteRoom v67 rollback: restores handle_new_user() to exactly what it was in v66.
-- Warning: this re-opens the hole described in 2026-10-15_invite_only_signup.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'account_type' = 'client' then
    insert into public.clients (id, first_name, last_name, mobile, reasons)
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'mobile',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'reasons')))
    );
  elsif new.raw_user_meta_data->>'account_type' = 'practitioner' then
    insert into public.practitioners (id, name, firm, practitioner_type, registration_number, specialties, phone, contact_preference)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'firm',
      new.raw_user_meta_data->>'practitioner_type',
      new.raw_user_meta_data->>'registration_number',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'specialties'))),
      new.raw_user_meta_data->>'phone',
      coalesce(new.raw_user_meta_data->>'contact_preference', 'either')
    );
  end if;
  return new;
end;
$$;
