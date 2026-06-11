
DROP VIEW IF EXISTS public.mentors_directory;

CREATE OR REPLACE FUNCTION public.list_mentors_directory(_domain text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, designation text, domain text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.name, m.designation, m.domain, m.bio
  FROM public.mentors m
  WHERE _domain IS NULL OR _domain = '' OR m.domain ILIKE '%' || _domain || '%'
  ORDER BY m.name;
$$;

REVOKE ALL ON FUNCTION public.list_mentors_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_mentors_directory(text) TO authenticated;
