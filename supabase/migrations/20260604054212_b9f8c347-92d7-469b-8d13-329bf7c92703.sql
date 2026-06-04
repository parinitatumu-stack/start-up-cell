
-- Role enum
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Startups
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT,
  vision TEXT,
  problem_statement TEXT,
  solution TEXT,
  target_audience TEXT,
  market_opportunity TEXT,
  business_model TEXT,
  innovation_description TEXT,
  expected_impact TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.startups TO authenticated;
GRANT ALL ON public.startups TO service_role;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "startup owner or admin select" ON public.startups FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "startup owner insert" ON public.startups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "startup owner or admin update" ON public.startups FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "startup owner delete" ON public.startups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  problem_statement TEXT,
  solution TEXT,
  target_audience TEXT,
  business_model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal owner or admin select" ON public.proposals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "proposal owner insert" ON public.proposals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "proposal owner or admin update" ON public.proposals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- Mentors
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  bio TEXT
);
GRANT SELECT ON public.mentors TO authenticated;
GRANT ALL ON public.mentors TO service_role;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentors readable" ON public.mentors FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentors admin write" ON public.mentors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.mentors (name, domain, designation, bio) VALUES
('Dr. Asha Rao', 'AgriTech', 'Senior Research Fellow', '15+ years building sustainable agriculture ventures across South Asia.'),
('Rahul Verma', 'FinTech', 'Ex-Goldman, Founder', 'Built two FinTech startups; angel investor in 20+ early-stage companies.'),
('Priya Sharma', 'HealthTech', 'Clinical Innovation Lead', 'Leads digital health programs at top-tier hospitals.'),
('Kiran Reddy', 'EdTech', 'EdTech Founder & Advisor', 'Founded an EdTech company serving 2M+ students.'),
('Neha Kapoor', 'AI & Data Science', 'Principal AI Engineer', 'AI/ML lead at multiple unicorns. PhD in Machine Learning.');

-- Mentor assignments
CREATE TABLE public.mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(startup_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_assignments TO authenticated;
GRANT ALL ON public.mentor_assignments TO service_role;
ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentor_assignments owner or admin select" ON public.mentor_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "mentor_assignments admin write" ON public.mentor_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones owner or admin select" ON public.milestones FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "milestones owner or admin write" ON public.milestones FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid())) WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications self" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications self update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);

-- AI evaluations
CREATE TABLE public.ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  feedback JSONB NOT NULL,
  overall_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_evaluations TO authenticated;
GRANT ALL ON public.ai_evaluations TO service_role;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_eval owner or admin select" ON public.ai_evaluations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "ai_eval owner insert" ON public.ai_evaluations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- MVP submissions
CREATE TABLE public.mvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  repo_url TEXT,
  demo_url TEXT,
  build_summary TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvp_submissions TO authenticated;
GRANT ALL ON public.mvp_submissions TO service_role;
ALTER TABLE public.mvp_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mvp owner or admin select" ON public.mvp_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "mvp owner write" ON public.mvp_submissions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "mvp owner or admin update" ON public.mvp_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- Demo day
CREATE TABLE public.demo_day_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  pitch_title TEXT NOT NULL,
  deck_url TEXT,
  slot TEXT,
  presenter_name TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_day_registrations TO authenticated;
GRANT ALL ON public.demo_day_registrations TO service_role;
ALTER TABLE public.demo_day_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo owner or admin select" ON public.demo_day_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "demo owner write" ON public.demo_day_registrations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));
CREATE POLICY "demo owner or admin update" ON public.demo_day_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.startups s WHERE s.id = startup_id AND s.user_id = auth.uid()));

-- Success stories
CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_name TEXT NOT NULL,
  founder_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  achievement TEXT,
  description TEXT,
  year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.success_stories TO authenticated, anon;
GRANT ALL ON public.success_stories TO service_role;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "success public read" ON public.success_stories FOR SELECT USING (true);
CREATE POLICY "success admin write" ON public.success_stories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Jury members
CREATE TABLE public.jury_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT
);
GRANT SELECT ON public.jury_members TO authenticated;
GRANT ALL ON public.jury_members TO service_role;
ALTER TABLE public.jury_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jury read" ON public.jury_members FOR SELECT TO authenticated USING (true);
INSERT INTO public.jury_members (name, designation) VALUES
('Anika Mehta', 'Partner, Accel'),
('Ravi Subramanian', 'Founder, Stellar Ventures'),
('Dr. Priya Iyer', 'Dean of Innovation, IIT'),
('Karan Verma', 'Angel Investor');
