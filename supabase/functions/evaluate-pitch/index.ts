// Edge function: AI Pitch Readiness evaluator using Lovable AI Gateway (Gemini).
// Public function (verify_jwt = false by default in Lovable). Auth is enforced via the user JWT we pass through.

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a senior startup incubator partner evaluating early-stage student startups.
Score the startup honestly on 7 dimensions (0-100 each). Be specific, reference the inputs.
Different startups MUST get different scores depending on quality. Avoid generic feedback.
Return STRICT JSON matching the provided schema. No prose outside JSON.`;

const TOOL = {
  type: "function",
  function: {
    name: "submit_evaluation",
    description: "Submit the pitch readiness evaluation",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        scores: {
          type: "object",
          additionalProperties: false,
          properties: {
            business_clarity: { type: "number" },
            problem_definition: { type: "number" },
            solution_strength: { type: "number" },
            market_potential: { type: "number" },
            business_model_viability: { type: "number" },
            innovation_level: { type: "number" },
            team_readiness: { type: "number" },
          },
          required: [
            "business_clarity","problem_definition","solution_strength",
            "market_potential","business_model_viability","innovation_level","team_readiness"
          ],
        },
        overall_score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        next_steps: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["scores","overall_score","strengths","weaknesses","risks","improvements","next_steps","summary"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = await req.json();

    const userPrompt = `Evaluate this startup:\n${JSON.stringify(payload, null, 2)}\n\nReturn the evaluation via the submit_evaluation tool.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = typeof call.function.arguments === "string"
      ? JSON.parse(call.function.arguments)
      : call.function.arguments;

    return new Response(JSON.stringify(args), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
