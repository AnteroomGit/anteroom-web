-- AnteRoom v67: invite-only practitioner sign-up, enforced by the database.
--
-- WHY
-- Until now the practitioner sign-up page hid its form unless the URL held
-- a valid invitation, but the database itself trusted whatever metadata a
-- browser sent to Supabase's public sign-up endpoint. Anyone could create a
-- practitioner row using a real liquidator's registration number (public on
-- ASIC's register), which then made the genuine invitation fail as
-- "already used".
--
-- WHAT THIS DOES (all inside the one transaction that creates the user)
--   * A practitioner account needs a valid, still-unclaimed lead_id. If it
--     is missing, unknown or already claimed, sign-up fails and no user is
--     created.
--   * The practitioner's name and registration number come from the lead
--     row, never from the browser.
--   * The practitioner is inserted already verified and the lead is marked
--     claimed in the same transaction. The lead row is locked first, so two
--     people racing for one invitation cannot both win.
--   * Google and Apple sign-ins (which carry no account_type) get a clients
--     row, so they are never left half-created.
--   * Email and password clients behave exactly as before.
--
-- DEPLOY ORDER
-- Deploy build v67 to Vercel first, then run this file in the Supabase SQL
-- editor, and only then send invitations. To undo it, run
-- 2026-10-15_invite_only_signup_rollback.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_type text := new.raw_user_meta_data->>'account_type';
  v_provider text := coalesce(new.raw_app_meta_data->>'provider', 'email');
  v_lead_id uuid;
  v_lead public.practitioner_leads%rowtype;
  v_full text;
  v_first text;
begin
  if v_type = 'practitioner' then
    begin
      v_lead_id := nullif(new.raw_user_meta_data->>'lead_id', '')::uuid;
    exception when invalid_text_representation then
      v_lead_id := null;
    end;

    if v_lead_id is null then
      raise exception 'Practitioner accounts are by invitation only';
    end if;

    -- Lock the lead so a second sign-up using the same invitation waits
    -- here, then sees it claimed and fails.
    select * into v_lead from public.practitioner_leads where id = v_lead_id for update;

    if not found or v_lead.claimed_by is not null then
      raise exception 'This invitation is not valid or has already been used';
    end if;

    insert into public.practitioners
      (id, name, firm, practitioner_type, registration_number, specialties, phone, contact_preference, verified)
    values (
      new.id,
      v_lead.name,
      coalesce(nullif(new.raw_user_meta_data->>'firm', ''), v_lead.firm),
      new.raw_user_meta_data->>'practitioner_type',
      v_lead.registration_number,
      (select array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'specialties', '[]'::jsonb)))),
      new.raw_user_meta_data->>'phone',
      coalesce(new.raw_user_meta_data->>'contact_preference', 'either'),
      true
    );

    update public.practitioner_leads
       set claimed_by = new.id, claimed_at = now(), contact_status = 'claimed'
     where id = v_lead.id;

  elsif v_type = 'client' then
    insert into public.clients (id, first_name, last_name, mobile, reasons)
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'mobile',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'reasons')))
    );

  elsif v_type is null and v_provider <> 'email' then
    -- Google, Apple or another OAuth provider: no account_type is ever sent,
    -- and these accounts are always clients (practitioners are invitation
    -- only and sign up with email and password).
    v_full := btrim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
    v_first := split_part(v_full, ' ', 1);
    insert into public.clients (id, first_name, last_name, mobile, reasons)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'given_name', ''), nullif(v_first, '')),
      coalesce(nullif(new.raw_user_meta_data->>'family_name', ''), nullif(btrim(substr(v_full, length(v_first) + 1)), '')),
      null,
      '{}'
    );
  end if;

  return new;
end;
$$;
