import { Worker } from 'bullmq'; 
import { QdrantVectorStore } from "@langchain/qdrant"; 
import { MistralAIEmbeddings } from "@langchain/mistralai"; 
import { Document } from "@langchain/core/documents"; 
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"; 
import { CharacterTextSplitter } from "@langchain/textsplitters"; 
import 'dotenv/config'; 

// Environment variables for production
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';

// Redis connection configuration - handle both Redis URL and host/port
const redisConfig = REDIS_URL ? REDIS_URL : {
    host: REDIS_HOST,
    port: REDIS_PORT
};

console.log('Worker starting...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Redis config:', REDIS_URL ? 'Using Redis URL' : `Using host: ${REDIS_HOST}:${REDIS_PORT}`);
console.log('Qdrant URL:', QDRANT_URL);

const worker = new Worker('file-queue', async (job) => { 
    try {
        console.log("Processing job:", job.id);
        console.log("Job data:", job.data); 
        
        // Parse job data with validation
        let data;
        try {
            data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
        } catch (parseError) {
            throw new Error(`Failed to parse job data: ${parseError.message}`);
        }
        
        if (!data.path) {
            throw new Error("No file path provided in job data");
        }
        
        console.log("File path:", data.path);
        
        // Check if file exists
        const fs = await import('fs');
        if (!fs.existsSync(data.path)) {
            throw new Error(`File does not exist: ${data.path}`);
        }
        
        // Load PDF and get documents 
        console.log("Loading PDF...");
        const loader = new PDFLoader(data.path); 
        const docs = await loader.load(); 
        
        console.log(`Loaded ${docs.length} documents`);
        if (docs.length > 0) {
            console.log("First doc preview:", docs[0]?.pageContent?.substring(0, 200) + "...");
        }
        
        if (docs.length === 0) {
            throw new Error("No documents were extracted from the PDF");
        }
        
        // Split documents if they're too large
        const textSplitter = new CharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        
        console.log("Splitting documents...");
        const splitDocs = await textSplitter.splitDocuments(docs);
        console.log(`Split into ${splitDocs.length} chunks`);
        
        // Initialize embeddings
        console.log("Initializing embeddings...");
        const embeddings = new MistralAIEmbeddings({ 
            model: "mistral-embed", 
            apiKey: process.env.MISTRAL_API_KEY,
        }); 
        
        // Test embeddings
        try {
            console.log("Testing embeddings...");
            const testEmbedding = await embeddings.embedQuery("test");
            console.log("Embedding test successful, dimension:", testEmbedding.length);
        } catch (embeddingError) {
            throw new Error(`Embedding test failed: ${embeddingError.message}`);
        }
        
        // Connect to Qdrant
        console.log("Connecting to Qdrant...");
        let vectorStore;
        try {
            vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, { 
                url: QDRANT_URL, 
                collectionName: "rag-t", 
            });
            console.log("Connected to existing Qdrant collection");
        } catch (qdrantError) {
            console.error("Qdrant connection error:", qdrantError.message);
            
            // Try to create collection if it doesn't exist
            console.log("Attempting to create new collection...");
            try {
                vectorStore = await QdrantVectorStore.fromDocuments(
                    splitDocs.slice(0, 1), // Use first document to create collection
                    embeddings,
                    {
                        url: QDRANT_URL,
                        collectionName: "rag-t",
                    }
                );
                console.log("Created new Qdrant collection");
                
                // Add remaining documents if any
                if (splitDocs.length > 1) {
                    console.log(`Adding remaining ${splitDocs.length - 1} documents...`);
                    await vectorStore.addDocuments(splitDocs.slice(1));
                }
            } catch (createError) {
                throw new Error(`Failed to create Qdrant collection: ${createError.message}`);
            }
        }
        
        // Add documents to vector store (if collection already existed)
        if (vectorStore && splitDocs.length > 0) {
            try {
                console.log("Adding documents to vector store...");
                await vectorStore.addDocuments(splitDocs);
                console.log(`Successfully added ${splitDocs.length} documents to vector store`);
            } catch (addError) {
                // If adding fails, the collection might already exist, just log warning
                console.warn("Could not add documents (might already exist):", addError.message);
            }
        }
        
        return { 
            success: true, 
            documentsAdded: splitDocs.length,
            filename: data.originalname || data.filename,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("Job processing error:", error.message);
        console.error("Stack trace:", error.stack);
        throw error; // Re-throw to mark job as failed
    }
}, { 
    concurrency: 3, // Reduced for production stability
    connection: redisConfig
});

// Enhanced error handling and logging
worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`);
    console.log('Result:', result);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
    console.error('Job data:', job.data);
});

worker.on('error', (err) => {
    console.error('🚨 Worker error:', err);
});

worker.on('stalled', (jobId) => {
    console.warn(`⚠️  Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await worker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await worker.close();
    process.exit(0);
});

console.log('🚀 Worker started and listening for jobs...');
console.log('Worker configuration:');
console.log(`  - Concurrency: 3`);
console.log(`  - Queue: file-queue`);
console.log(`  - Redis: ${REDIS_URL ? 'URL connection' : `${REDIS_HOST}:${REDIS_PORT}`}`);
console.log(`  - Qdrant: ${QDRANT_URL}`);