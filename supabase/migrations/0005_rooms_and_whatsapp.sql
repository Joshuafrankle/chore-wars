-- Owner now configures room count (a hard cap on tenants, one per room)
-- and an optional WhatsApp group link, shown to a tenant right after they
-- join. Tenants pick a specific room number during onboarding, alongside
-- the bathroom they already choose.

alter table public.households
  add column room_count int not null default 10 check (room_count > 0),
  add column whatsapp_link text;

alter table public.profiles
  add column room_number int check (room_number is null or room_number > 0),
  -- Postgres treats each NULL as distinct, so this only actually
  -- constrains real tenants with a room assigned — an owner's household_id
  -- is null and never collides.
  add constraint profiles_household_room_unique unique (household_id, room_number);
