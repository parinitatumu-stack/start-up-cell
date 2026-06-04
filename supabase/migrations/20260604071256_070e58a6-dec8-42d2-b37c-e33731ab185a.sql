
-- 1. Extend startups with founder/team/contact fields
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS founder_name text,
  ADD COLUMN IF NOT EXISTS team_members text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_number text;

-- 2. Pitch preparation checklist (separate from progress milestones)
CREATE TABLE IF NOT EXISTS public.pitch_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  name text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_checklist TO authenticated;
GRANT ALL ON public.pitch_checklist TO service_role;
ALTER TABLE public.pitch_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist owner or admin select" ON public.pitch_checklist FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM startups s WHERE s.id = pitch_checklist.startup_id AND s.user_id = auth.uid()));
CREATE POLICY "checklist owner write" ON public.pitch_checklist FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM startups s WHERE s.id = pitch_checklist.startup_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM startups s WHERE s.id = pitch_checklist.startup_id AND s.user_id = auth.uid()));

-- 3. Seed success stories
INSERT INTO public.success_stories (startup_name, founder_name, domain, achievement, year, description) VALUES
('AgroSense','Meera Iyer','AgriTech','Raised ₹2.4 Cr seed round',2024,'IoT-based soil monitoring system now deployed across 12 farming cooperatives in Telangana.'),
('FinLeap','Arjun Nair','FinTech','Acquired by HDFC Innovation Lab',2023,'Micro-investment platform for college students. Acquired 18 months after launch.'),
('MediTrack','Sara Khan','HealthTech','Selected for Y Combinator W24',2024,'AI-driven medication reminder system for rural clinics. Now in 40+ clinics.'),
('EduPath','Vikram Patel','EdTech','Winner — Smart India Hackathon',2023,'Personalised career roadmap engine for tier-2 college students. 80,000+ users.'),
('LumenAI','Anika Reddy','AI & Data Science','NASSCOM DeepTech Cohort 2024',2024,'Computer vision platform for retail shelf analytics. 6 enterprise pilots running.')
ON CONFLICT DO NOTHING;
