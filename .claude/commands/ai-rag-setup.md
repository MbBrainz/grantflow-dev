---
name: ai-rag-setup
description: Set up RAG (Retrieval-Augmented Generation) system
---

## Set up RAG (Retrieval-Augmented Generation) System

Create a comprehensive RAG implementation with embeddings, vector storage, and retrieval: $ARGUMENTS

### Current Project Analysis

Existing database setup: !`find . -name "*schema*" -o -name "*migration*" -o -name "drizzle.config.*" | head -5`

Vector database configuration: !`grep -r "vector\|embedding" . --include="*.ts" --include="*.sql" | head -5`

AI SDK integration: !`grep -r "embed\|embedMany" . --include="*.ts" | head -5`

### RAG Implementation Types

**Basic RAG**: Simple query → retrieve → generate pipeline
**Advanced RAG**: Multi-query, re-ranking, hybrid search, filtering
**Conversational RAG**: Context-aware retrieval with chat history
**Agentic RAG**: Tool-based retrieval with dynamic knowledge access

### Your Task

1. **Analyze current data infrastructure** and vector storage capabilities
2. **Design embedding and chunking strategy** for optimal retrieval
3. **Set up vector database** with proper indexing and search
4. **Implement embedding pipeline** with batch processing
5. **Create retrieval system** with similarity search and ranking
6. **Build RAG generation pipeline** with context injection
7. **Add evaluation metrics** for retrieval and generation quality
8. **Implement comprehensive testing** for all RAG components

### Implementation Requirements

#### Data Processing Pipeline

- Document ingestion and preprocessing
- Intelligent chunking strategies (sentence, semantic, sliding window)
- Metadata extraction and enrichment
- Batch embedding generation with rate limiting
- Deduplication and quality filtering

#### Vector Storage and Search

- Database setup (PostgreSQL + pgvector, Pinecone, Supabase, etc.)
- Proper indexing (HNSW, IVFFlat) for performance
- Similarity search with filtering and ranking
- Hybrid search combining vector and text search
- Metadata filtering and faceted search

#### RAG Generation

- Context selection and ranking
- Prompt engineering for RAG scenarios
- Context window management
- Response grounding and source attribution
- Quality control and relevance scoring

### Expected Deliverables

1. **Document processing pipeline** with chunking and embedding
2. **Vector database setup** with optimized indexing
3. **Retrieval system** with advanced search capabilities
4. **RAG generation API** with streaming support
5. **Evaluation framework** for quality measurement
6. **Admin interface** for content management
7. **Comprehensive documentation** and examples

### Database Schema Design

#### PostgreSQL with pgvector

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chunks table
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (document_id);
CREATE INDEX ON documents USING gin (metadata);
```

#### Drizzle ORM Schema

```typescript
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id').references(() => documents.id, {
      onDelete: 'cascade',
    }),
    content: text('content').notNull(),
    chunkIndex: integer('chunk_index'),
    metadata: jsonb('metadata'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    embeddingIndex: index('embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    documentIdIndex: index('document_id_idx').on(table.documentId),
  })
)
```

### Embedding Strategy

#### Chunking Algorithms

- **Sentence-based**: Split on sentence boundaries for coherent chunks
- **Semantic**: Use NLP models to identify semantic boundaries
- **Sliding window**: Overlapping chunks to preserve context
- **Recursive**: Hierarchical chunking for different granularities

#### Model Selection

- **OpenAI**: text-embedding-3-small/large for versatility
- **Cohere**: embed-english-v3.0 for specialized domains
- **Local models**: Sentence-transformers for privacy/cost
- **Multilingual**: Support for multiple languages

### Advanced RAG Patterns

#### Multi-Query RAG

```typescript
async function multiQueryRAG(userQuery: string) {
  // Generate multiple query variants
  const queryVariants = await generateQueryVariants(userQuery)

  // Retrieve for each variant
  const retrievalResults = await Promise.all(
    queryVariants.map(query => retrieveDocuments(query))
  )

  // Combine and re-rank results
  const combinedResults = combineAndRerankResults(retrievalResults)

  return combinedResults
}
```

#### Conversational RAG

```typescript
async function conversationalRAG(messages: Message[], query: string) {
  // Extract conversation context
  const conversationContext = extractContext(messages)

  // Generate context-aware query
  const contextualQuery = await generateContextualQuery(
    query,
    conversationContext
  )

  // Retrieve with conversation awareness
  const documents = await retrieveWithContext(
    contextualQuery,
    conversationContext
  )

  return documents
}
```

### Quality Evaluation

#### Retrieval Metrics

- **Precision@K**: Relevant documents in top-K results
- **Recall@K**: Coverage of relevant documents
- **MRR**: Mean Reciprocal Rank of first relevant document
- **NDCG**: Normalized Discounted Cumulative Gain

#### Generation Metrics

- **Faithfulness**: Response grounded in retrieved context
- **Relevance**: Response relevance to user query
- **Completeness**: Coverage of important information
- **Coherence**: Logical flow and readability

### Testing and Validation

#### Unit Testing

- Embedding generation accuracy
- Chunking algorithm correctness
- Similarity search precision
- Database operations integrity

#### Integration Testing

- End-to-end RAG pipeline
- Performance under load
- Quality with various document types
- Scalability testing

#### Evaluation Testing

- Golden dataset evaluation
- A/B testing with different strategies
- User feedback collection
- Continuous quality monitoring

### Performance Optimization

#### Database Optimization

- Proper indexing strategies (HNSW vs IVFFlat)
- Connection pooling and caching
- Query optimization and profiling
- Horizontal scaling considerations

#### Embedding Optimization

- Batch processing for efficiency
- Caching frequently used embeddings
- Model quantization for speed
- Parallel processing pipelines

Focus on building a production-ready RAG system that provides accurate, relevant, and fast retrieval-augmented generation with proper evaluation and optimization strategies.
