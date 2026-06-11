
-- 1) Profile privilege escalation fix
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;

CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'student'::app_role);

-- Self update cannot change role; admins can update anything via separate policy
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "profiles admin update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2) Mentor email exposure fix
DROP POLICY IF EXISTS "mentors readable" ON public.mentors;

CREATE POLICY "mentors admin select" ON public.mentors
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "mentors assigned select" ON public.mentors
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mentor_assignments ma
    JOIN public.startups s ON s.id = ma.startup_id
    WHERE ma.mentor_id = mentors.id AND s.user_id = auth.uid()
  ));

-- Directory function returns mentor info WITHOUT email for browsing/suggestions
CREATE OR REPLACE FUNCTION public.list_mentors_directory(_domain text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, designation text, domain text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.name, m.designation, m.domain, m.bio
  FROM public.mentors m
  WHERE _domain IS NULL OR m.domain ILIKE '%' || _domain || '%'
  ORDER BY m.name;
$$;

REVOKE ALL ON FUNCTION public.list_mentors_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_mentors_directory(text) TO authenticated;
