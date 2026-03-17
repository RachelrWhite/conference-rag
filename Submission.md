## Submission
## 1. Security Architecture ⭐⭐⭐⭐⭐

Draw or describe a diagram showing what protects each sensitive asset in this application. Your answer should address:
- Why is the anon key safe to expose in `config.public.json`?
- What would happen if someone got the service role key?
- How do Edge Functions protect the OpenAI API key?
- What role does Row Level Security play?

**Answer:**

```
Browser (public)
  │  anon key + JWT
  ▼
Supabase (RLS enforces per-user rules)
  │  service role key (never leaves server)
  ▼
Edge Functions (server-side, Deno runtime)
  │  OPENAI_API_KEY (env variable, never exposed)
  ▼
OpenAI API
```

**Why is the anon key safe to expose?**
The anon key is intentionally public — it only identifies which Supabase project you're talking to. It cannot bypass Row Level Security (RLS). Every query made with the anon key is filtered through RLS policies, so a user can only read data they're allowed to see. In this app, sentence_embeddings is readable by any authenticated user, and page_views is readable/writable by anyone — those policies are intentional, and the anon key cannot exceed those boundaries.

**What would happen if someone got the service role key?**
It would be catastrophic. The service role key bypasses all RLS policies entirely — whoever holds it has full read, write, and delete access to every table in the database. They could wipe all embeddings, steal user emails, or corrupt data. This is why it lives only in `config.secret.json`, which is git-ignored and never committed or deployed.

**How do Edge Functions protect the OpenAI API key?**
The OpenAI API key is stored as a Supabase secret environment variable (`Deno.env.get("OPENAI_API_KEY")`). It never appears in the browser, never touches `config.js` or any committed file. When the browser needs an embedding or an AI answer, it calls the Edge Function with a JWT — the Edge Function runs server-side, calls OpenAI using the secret key, and returns only the result. The browser never sees the key.

**What role does Row Level Security play?**
RLS is the enforcement layer that makes the anon key safe. Without RLS, anyone with the anon key could query any table freely. With RLS, Supabase checks each query against policies before returning data. For example, users can only read their own session data, and public tables like `page_views` explicitly allow anonymous access. RLS means the database itself enforces access control — not just the application code, which could be bypassed.

---

### 2. Edge Functions & the "Secure Middle" ⭐⭐⭐⭐⭐

Why can't we call OpenAI directly from the browser? Explain the flow: browser → Edge Function → OpenAI. What role does JWT verification play in this chain? How does this pattern apply to other production applications?

**Answer:**

We can't call OpenAI directly from the browser because doing so would require embedding the OpenAI API key in client-side JavaScript — where any user could open DevTools, find the key, and use it to rack up charges or abuse the API. There's no way to hide a secret in code that runs in someone else's browser.

**The flow:**
1. **Browser → Edge Function:** The user types a question. The browser sends it to the Supabase Edge Function (`embed-question` or `generate-answer`) along with a JWT (the user's auth token, issued by Supabase when they signed in).
2. **Edge Function verifies JWT:** The Edge Function runs server-side in a Deno runtime. Supabase automatically validates the JWT before the function code even runs — so only authenticated users can trigger it. Unauthenticated requests are rejected.
3. **Edge Function → OpenAI:** The function retrieves the OpenAI API key from a secure environment variable and calls OpenAI on behalf of the user. The key never leaves the server.
4. **Edge Function → Browser:** Only the result (embedding vector or generated text) is returned to the browser.

**JWT's role:** The JWT proves the user is who they say they are. It's signed by Supabase's auth server, so it can't be forged. This means the Edge Function can trust that the request comes from a legitimately authenticated user — enabling rate limiting, logging, and access control based on identity.

**In production:** This "secure middle" pattern is everywhere. Payment processors (Stripe), maps APIs (Google Maps), email services (SendGrid), and any other third-party API with a secret key follow the same pattern: the browser calls your backend, your backend holds the secret and calls the third party. This prevents key theft and lets you add logic like rate limiting, caching, logging, and cost controls in the middle layer.

---

### 3. From SQL to Semantics ⭐⭐⭐⭐

Compare keyword search (SQL `ILIKE`) vs semantic search (vector cosine similarity):
- When would each be better?
- Give a specific query example where one succeeds and the other fails
- What makes semantic search "understand" meaning?

**Answer:**

**Keyword search (ILIKE)** looks for exact text matches. It's fast, predictable, and requires no AI — but it only finds documents that contain the literal words you searched for.

**Semantic search (cosine similarity on embeddings)** converts text into a high-dimensional vector where similar meanings cluster together, then finds vectors closest to your query vector. It understands synonyms, paraphrasing, and conceptual relationships — but requires pre-computed embeddings and a vector database.

**When each is better:**
- Use ILIKE when you know the exact term (e.g., searching for a specific person's name, a scripture reference like "Mosiah 2:17", or a quoted phrase).
- Use semantic search when you're searching by concept or theme and don't know the exact wording the author used.

**Example where one wins and the other fails:**

Query: *"enduring to the end"*
- ILIKE succeeds — many talks use this exact phrase.
- Semantic search also works, but no advantage over ILIKE here.

Query: *"how to keep going when life is hard"*
- ILIKE fails — no talk is likely to use those exact words together.
- Semantic search succeeds — it finds talks about perseverance, trials, and endurance because those concepts map to nearby vectors, even though the wording is completely different.

**What makes semantic search "understand" meaning?**
Embeddings are trained on massive amounts of text so that words and sentences with similar meanings end up close together in vector space. "Trials," "adversity," "hardship," and "challenges" all end up near each other. Cosine similarity measures the angle between two vectors — a small angle means similar meaning. The model doesn't literally "understand" language, but the geometry of the vector space reflects semantic relationships learned from patterns in human text.

---

### 4. RAG vs Fine-Tuning ⭐⭐⭐⭐

We used RAG instead of fine-tuning a model on conference talks. Research what fine-tuning is (this wasn't covered in class — go find out!). Then explain:
- What are the trade-offs between RAG and fine-tuning?
- Why did we choose RAG for this application?
- When might fine-tuning be the better choice?

**Answer:**

**What is fine-tuning?**
Fine-tuning is the process of taking a pre-trained language model (like GPT-4) and continuing to train it on a specific dataset so it learns new patterns, styles, or facts. You feed the model thousands of examples of the behavior you want, adjust its weights through additional training, and end up with a model that's specialized for your domain. For example, you could fine-tune a model on all General Conference talks so it learns to speak in that style and knows the content deeply.

**Trade-offs:**

| | RAG | Fine-Tuning |
|---|---|---|
| **Data freshness** | Easy — just add new embeddings | Hard — must retrain the model |
| **Cost** | Low — just embedding + API calls | High — training compute is expensive |
| **Accuracy on facts** | High — retrieves actual source text | Can hallucinate or misremember facts baked into weights |
| **Style/tone** | Generic model voice | Can match domain style closely |
| **Transparency** | Shows sources | Opaque — can't see what it "knows" |
| **Setup time** | Hours | Days to weeks |

**Why we chose RAG:**
RAG was the right choice for this application because we care about factual accuracy — the AI answer should come from actual conference talks, not from patterns the model memorized. RAG retrieves the real text and feeds it to the model as context, so the answer is grounded in what was actually said. It's also far cheaper and faster to set up, and when new conference talks are published, we just scrape and embed them — no retraining needed. The ability to show source links is also a major advantage for trust.

**When fine-tuning is better:**
Fine-tuning makes more sense when you want the model to adopt a specific style or tone (e.g., always responding in formal church language), when your task is classification or structured output rather than open-ended Q&A, when your knowledge base is too large to fit in a context window, or when you need extremely fast inference without retrieval overhead. It also shines when the domain knowledge is stable and doesn't change often.

---

### 5. AI-Assisted Development ⭐⭐⭐

Briefly describe how your AI coding assistant helped you during this assignment:
- What did it do well?
- Where did you need to guide it?
- What did you learn about working with AI tools?

**Answer:**

The AI assistant (Claude) was genuinely useful throughout this project, especially for tasks that would have taken me a long time to figure out on my own.

**What it did well:**
It was excellent at reading through multiple files at once and understanding how they fit together — for example, tracing why the Holland search was broken required looking at the JavaScript, the SQL schema, and the actual database simultaneously. It caught things I wouldn't have noticed, like the fact that `match_sentences` wasn't returning a `url` column, which caused `href="undefined"` errors. It also wrote solid boilerplate quickly, like the SQL for `match_sentences_by_speaker`, and explained concepts like RLS and JWT clearly in context rather than generically.

**Where I needed to guide it:**
The AI made several attempts at fixing the Holland search before landing on the right solution. It sometimes proposed fixes that addressed symptoms rather than root causes — for example, it tried increasing `match_count` to 100 before realizing the real problem was that the RPC function didn't exist. I had to push back and ask it to dig deeper rather than accept the first plausible-sounding answer. I also had to do the actual database queries to give it real data to work with — it couldn't see my Supabase database directly, so I had to act as the "eyes" and relay results back.

**What I learned about working with AI tools:**
The AI is most useful when you treat it as a knowledgeable collaborator rather than an oracle. It can get stuck in a loop proposing variations of the same wrong approach, and it's my job to redirect it with new information. Running SQL queries in Supabase and pasting results back was a key debugging pattern — the AI's suggestions got dramatically better once it had real data. I also learned to use plan mode before big changes so I understood what was going to happen before it happened.

---

# FROM CANVAS
For each of the following static questions, find the three most similar free embeddings for the corresponding talks, paragraphs, and 3-clusters. Repeat this process with the OpenAI embeddings.
1. How can I gain a testimony of Jesus Christ?
2. What are some ways to deal with challenges in life and find a purpose?
3. How can I fix my car if it won't start?
4. What is the purpose of families?
5. Why are we here on earth? 


Write a few paragraphs to outline what differences the full-text, paragraph, and cluster model made on selections in the semantic search.
