import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, context_talks } = await req.json();
    if (!question || !context_talks) {
      return new Response(JSON.stringify({ error: "Missing question or context_talks" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = context_talks.map((talk: { title: string; speaker: string; text: string }, i: number) =>
      `[${i + 1}] "${talk.title}" by ${talk.speaker}:\n${talk.text}`
    ).join("\n\n");

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on LDS General Conference talks.
Use only the provided talk excerpts to answer the question.
Cite the talks you draw from by referencing them as [1], [2], etc.
Be concise but thorough.`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext talks:\n${context}`,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
