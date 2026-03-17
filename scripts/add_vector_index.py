import json
import requests

with open('config.secret.json') as f:
    secrets = json.load(f)

url = f"https://api.supabase.com/v1/projects/{secrets['SUPABASE_PROJECT_REF']}/database/query"
headers = {
    "Authorization": f"Bearer {secrets['SUPABASE_ACCESS_TOKEN']}",
    "Content-Type": "application/json"
}

sql = """
CREATE INDEX IF NOT EXISTS sentence_embeddings_embedding_idx
ON sentence_embeddings
USING hnsw (embedding vector_cosine_ops);
"""

print("Creating vector index (may take 1-2 minutes)...")
resp = requests.post(url, headers=headers, json={"query": sql}, timeout=300)
if resp.status_code in (200, 201):
    print("✅ Vector index created!")
else:
    print(f"❌ Failed: {resp.status_code}")
    print(resp.text[:500])
