## Submission 
## 1. Security Architecture ⭐⭐⭐⭐⭐

Draw or describe a diagram showing what protects each sensitive asset in this application. Your answer should address:
- Why is the anon key safe to expose in `config.public.json`?
- What would happen if someone got the service role key?
- How do Edge Functions protect the OpenAI API key?
- What role does Row Level Security play?

### 2. Edge Functions & the "Secure Middle" ⭐⭐⭐⭐⭐

Why can't we call OpenAI directly from the browser? Explain the flow: browser → Edge Function → OpenAI. What role does JWT verification play in this chain? How does this pattern apply to other production applications?

### 3. From SQL to Semantics ⭐⭐⭐⭐

Compare keyword search (SQL `ILIKE`) vs semantic search (vector cosine similarity):
- When would each be better?
- Give a specific query example where one succeeds and the other fails
- What makes semantic search "understand" meaning?

### 4. RAG vs Fine-Tuning ⭐⭐⭐⭐

We used RAG instead of fine-tuning a model on conference talks. Research what fine-tuning is (this wasn't covered in class — go find out!). Then explain:
- What are the trade-offs between RAG and fine-tuning?
- Why did we choose RAG for this application?
- When might fine-tuning be the better choice?

### 5. AI-Assisted Development ⭐⭐⭐

Briefly describe how your AI coding assistant helped you during this assignment:
- What did it do well?
- Where did you need to guide it?
- What did you learn about working with AI tools?


# FROM CANVAS
For each of the following static questions, find the three most similar free embeddings for the corresponding talks, paragraphs, and 3-clusters. Repeat this process with the OpenAI embeddings.
1. How can I gain a testimony of Jesus Christ?
2. What are some ways to deal with challenges in life and find a purpose?
3. How can I fix my car if it won't start?
4.
5.


Write a few paragraphs to outline what differences the full-text, paragraph, and cluster model made on selections in the semantic search. 