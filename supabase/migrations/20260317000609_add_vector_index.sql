SET maintenance_work_mem = '64MB';
CREATE INDEX IF NOT EXISTS sentence_embeddings_embedding_idx
ON sentence_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 4, ef_construction = 16);
