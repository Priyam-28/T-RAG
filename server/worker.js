import { Worker } from 'bullmq'; 
import { QdrantVectorStore } from "@langchain/qdrant"; 
import { MistralAIEmbeddings } from "@langchain/mistralai"; 
import { Document } from "@langchain/core/documents"; 
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"; 
import { CharacterTextSplitter } from "@langchain/textsplitters"; 
import 'dotenv/config'; 

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
        console.log("First doc preview:", docs[0]?.pageContent?.substring(0, 200) + "...");
        
        if (docs.length === 0) {
            throw new Error("No documents were extracted from the PDF");
        }
        
        // Optional: Split documents if they're too large
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
                url: `http://localhost:6333`, 
                collectionName: "rag-t", 
            });
            console.log("Connected to Qdrant collection");
        } catch (qdrantError) {
            console.error("Qdrant connection error:", qdrantError.message);
            
            // Try to create collection if it doesn't exist
            console.log("Attempting to create new collection...");
            try {
                vectorStore = await QdrantVectorStore.fromDocuments(
                    splitDocs.slice(0, 1), // Use first document to create collection
                    embeddings,
                    {
                        url: `http://localhost:6333`,
                        collectionName: "rag-t",
                    }
                );
                console.log("Created new Qdrant collection");
                
                // Add remaining documents
                if (splitDocs.length > 1) {
                    await vectorStore.addDocuments(splitDocs.slice(1));
                }
            } catch (createError) {
                throw new Error(`Failed to create Qdrant collection: ${createError.message}`);
            }
        }
        
        // Add documents to vector store
        if (vectorStore && splitDocs.length > 0) {
            console.log("Adding documents to vector store...");
            await vectorStore.addDocuments(splitDocs);
            console.log(`Successfully added ${splitDocs.length} documents to vector store`);
        }
        
        return { success: true, documentsAdded: splitDocs.length };
        
    } catch (error) {
        console.error("Job processing error:", error.message);
        console.error("Stack trace:", error.stack);
        throw error; // Re-throw to mark job as failed
    }
}, { 
    concurrency: 5, // Reduced concurrency for debugging
    connection: { 
        host: 'localhost', 
        port: 6379 
    } 
});

// Add error handling
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

console.log('Worker started and listening for jobs...');