
DROP FUNCTION IF EXISTS public.list_mentors_directory(text);

CREATE OR REPLACE VIEW public.mentors_directory
WITH (security_invoker = false) AS
SELECT id, name, designation, domain, bio FROM public.mentors;

GRANT SELECT ON public.mentors_directory TO authenticated;
