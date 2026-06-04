import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Startup Cell — Where ideas become ventures" },
      { name: "description", content: "Student Innovation & Startup Cell Portal. Register startups, connect mentors, track milestones, evaluate pitch readiness with AI." },
      { property: "og:title", content: "Startup Cell — Where ideas become ventures" },
      { property: "og:description", content: "Premium university innovation hub for student founders." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen surface-navy-grid">
      <header className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
        <Logo className="text-ivory" />
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.22em] uppercase font-medium text-ivory/70">
          <a href="#features" className="hover:text-aqua transition">Features</a>
          <a href="#pitch" className="hover:text-aqua transition">Pitch Checker</a>
          <a href="#stories" className="hover:text-aqua transition">Success Stories</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden sm:inline-flex items-center px-5 py-2.5 text-[11px] tracking-[0.22em] uppercase border border-ivory/20 rounded-md text-ivory hover:border-aqua hover:text-aqua transition">
            Login
          </Link>
          <Link to="/auth" search={{ mode: "signup" } as never} className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] tracking-[0.22em] uppercase bg-aqua text-navy font-semibold rounded-md hover:bg-aqua-bright transition">
            Sign Up <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 border border-aqua/30 rounded-full text-[11px] tracking-[0.22em] uppercase text-aqua/90 mb-12">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_8px_var(--aqua)]" />
          FEDF · Problem 233 · KL Hyderabad
        </div>

        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.95] text-ivory tracking-tight">
          Where <span className="italic text-aqua">ideas</span>
          <br />
          become <span className="italic text-ivory/40">ventures.</span>
        </h1>

        <p className="font-display text-2xl md:text-3xl text-ivory/90 mt-10">
          Student Innovation & <span className="text-aqua italic">Startup Cell Portal</span>
        </p>

        <p className="max-w-2xl mx-auto mt-6 text-ivory/60 text-base leading-relaxed">
          One platform for college students to register startups, connect with mentors, track milestones, and walk into any pitch — completely ready.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth" search={{ mode: "signup" } as never}>
            <Button size="lg" className="bg-aqua text-navy hover:bg-aqua-bright text-[11px] tracking-[0.22em] uppercase font-semibold px-8 h-12 rounded-md">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="border-ivory/20 bg-transparent text-ivory hover:bg-ivory/5 hover:text-aqua text-[11px] tracking-[0.22em] uppercase font-semibold px-8 h-12 rounded-md">
              Explore Features
            </Button>
          </a>
        </div>

        <div className="mt-24 inline-flex border border-aqua/15 rounded-2xl overflow-hidden bg-navy-2/30 backdrop-blur">
          {[
            ["10+", "Modules"],
            ["50+", "Startups"],
            ["20+", "Mentors"],
            ["100%", "Free"],
          ].map(([n, l], i) => (
            <div key={l} className={`px-10 py-6 ${i > 0 ? "border-l border-aqua/10" : ""}`}>
              <div className="font-display text-4xl text-aqua">{n}</div>
              <div className="mt-1 text-[10px] tracking-[0.22em] uppercase text-ivory/50">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-[10px] tracking-[0.4em] uppercase text-ivory/30">scroll</div>
      </main>

      <section id="features" className="border-t border-aqua/10 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="eyebrow">Built for the full startup lifecycle</p>
          <h2 className="font-display text-5xl md:text-6xl text-ivory mt-3">Everything you need, <span className="italic text-aqua">in one place</span>.</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {[
              { t: "Register & track startups", d: "Bring your idea into the system. Tag your domain, articulate your vision, and watch your status move." },
              { t: "Mentor matchmaking", d: "Admins assign domain-matched mentors. Get guidance from real industry leaders, not random advisors." },
              { t: "Proposal review pipeline", d: "Submit, edit, resubmit. Admins approve or send back with comments. Transparent every step." },
              { t: "Milestone progress tracker", d: "Real progress, calculated from real milestones. No vanity percentages." },
              { t: "AI pitch readiness", d: "Gemini-powered evaluation across 7 dimensions. Specific feedback, real risks, real next steps." },
              { t: "Demo Day & MVP submissions", d: "Submit your MVP, upload your deck, book your slot. Then go pitch." },
            ].map(({ t, d }) => (
              <div key={t} className="card-navy p-7">
                <h3 className="font-display text-2xl text-ivory">{t}</h3>
                <p className="mt-3 text-ivory/60 text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pitch" className="py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
          <p className="eyebrow">Flagship feature</p>
          <h2 className="font-display text-5xl md:text-6xl text-ivory mt-3">AI <span className="italic text-aqua">Pitch Readiness</span> Engine</h2>
          <p className="text-ivory/60 max-w-2xl mx-auto mt-6">
            Real evaluation — not a checklist. Submit your startup, get scored on Business Clarity, Problem Definition, Solution Strength, Market Potential, Business Model, Innovation, and Team Readiness. Every result is different.
          </p>
          <Link to="/auth" search={{ mode: "signup" } as never} className="inline-flex mt-10">
            <Button size="lg" className="bg-aqua text-navy hover:bg-aqua-bright text-[11px] tracking-[0.22em] uppercase font-semibold px-8 h-12 rounded-md">
              Score my startup <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-aqua/10 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-between gap-4 text-[11px] tracking-[0.22em] uppercase text-ivory/40">
          <Logo className="text-ivory" />
          <span>FEDF · Section 13 · KL Hyderabad</span>
        </div>
      </footer>
    </div>
  );
}
