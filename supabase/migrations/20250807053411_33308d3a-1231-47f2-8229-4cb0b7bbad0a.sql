-- Add minimal RLS policy for user_roles to satisfy linter and allow controlled admin management
create policy "Admins can manage user_roles"
  on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));