import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MistralAI } from "@langchain/mistralai";
import { ChatMistralAI } from "@langchain/mistralai"; // Change this import
import 'dotenv/config';

const app = express();
const queue = new Queue("file-queue", {
    connection: {
        host: 'localhost',
        port: 6379
    }
});

// Initialize ChatMistralAI (LangChain wrapper)
const llm = new ChatMistralAI({
    model: "mistral-small-latest",
    temperature: 0.1,
    apiKey: process.env.MISTRAL_API_KEY,
});

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.send('Sab changa si');
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const job = await queue.add('file-queue', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            destination: req.file.destination,
            path: req.file.path
        });

        console.log(`Job ${job.id} added to queue`);
        return res.json({ 
            message: 'uploaded',
            jobId: job.id 
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/chat', async (req, res) => {
    const userQuery = req.query.message || "what is the idea of the document?";

    if (!userQuery) {
        return res.status(400).json({ error: "Missing query parameter: message" });
    }

    try {
        console.log("Processing query:", userQuery);

        // Initialize embeddings
        const embeddings = new MistralAIEmbeddings({
            model: "mistral-embed",
            apiKey: process.env.MISTRAL_API_KEY,
        });

        // Connect to vector store
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: `http://localhost:6333`,
            collectionName: "rag-t",
        });

        // Retrieve relevant documents
        const retriever = vectorStore.asRetriever({ k: 2 });
        const relevantDocs = await retriever.invoke(userQuery);

        console.log("Retrieved docs:", relevantDocs.length);

        if (!relevantDocs || relevantDocs.length === 0) {
            return res.json({
                message: "No relevant documents found in the knowledge base.",
                docs: []
            });
        }

        // Extract context from retrieved documents
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

        const SYSTEM_PROMPT = `You are a helpful AI assistant who answers user queries based on the available context from PDF files.

Context:
${context}

Instructions:
- Answer the user's question based only on the provided context
- If the context doesn't contain enough information, say so clearly
- Be concise and accurate in your response`;

        // Use LangChain's ChatMistralAI
        const response = await llm.invoke([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userQuery },
        ]);

        const answer = response.content || "Sorry, I couldn't generate a response.";

        return res.json({
            message: answer,
            query: userQuery,
            docs: relevantDocs.map(doc => ({
                content: doc.pageContent.substring(0, 200) + '...',
                metadata: doc.metadata
            }))
        });

    } catch (error) {
        console.error("Error in /chat:", error);
        return res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// POST endpoint for chat (alternative)
app.post('/chat', async (req, res) => {
    const { message: userQuery } = req.body;

    if (!userQuery) {
        return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    try {
        console.log("Processing query:", userQuery);

        // Initialize embeddings
        const embeddings = new MistralAIEmbeddings({
            model: "mistral-embed",
            apiKey: process.env.MISTRAL_API_KEY,
        });

        // Connect to vector store
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: `http://localhost:6333`,
            collectionName: "rag-t",
        });

        // Retrieve relevant documents
        const retriever = vectorStore.asRetriever({ k: 2 });
        const relevantDocs = await retriever.invoke(userQuery);

        console.log("Retrieved docs:", relevantDocs.length);

        if (!relevantDocs || relevantDocs.length === 0) {
            return res.json({
                message: "No relevant documents found in the knowledge base.",
                docs: []
            });
        }

        // Extract context from retrieved documents
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

        const SYSTEM_PROMPT = `You are a helpful AI assistant who answers user queries based on the available context from PDF files.

Context:
${context}

Instructions:
- Answer the user's question based only on the provided context
- If the context doesn't contain enough information, say so clearly
- Be concise and accurate in your response`;

        // Use LangChain's ChatMistralAI
        const response = await llm.invoke([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userQuery },
        ]);

        const answer = response.content || "Sorry, I couldn't generate a response.";

        return res.json({
            message: answer,
            query: userQuery,
            docs: relevantDocs.map(doc => ({
                content: doc.pageContent.substring(0, 200) + '...',
                metadata: doc.metadata
            }))
        });

    } catch (error) {
        console.error("Error in /chat:", error);
        return res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});



app.listen(8000, () => {
    console.log('Server is running on port 8000');
    console.log('Available endpoints:');
    console.log('  GET  /');
    console.log('  POST /upload/pdf');
    console.log('  GET  /chat?message=your_question');
    console.log('  POST /chat (with JSON body: {"message": "your_question"})');
});