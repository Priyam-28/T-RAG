import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from "bullmq";
import { VectorStore } from '@langchain/core/vectorstores';
import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MistralAI } from "@langchain/mistralai";
import 'dotenv/config';

const app = express();
const queue = new Queue("file-queue", {
    connection: {
        host: 'localhost',
        port: 6379
    }
});

const client = new MistralAI({
  model: "codestral-latest",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  apiKey: process.env.MISTRAL_API_KEY,
});

app.use(cors());

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
    queue.add('file-queue', JSON.stringify({
        filename: req.file.filename,
        originalname: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path
    }))
    return res.json({message: 'uploaded'});
});

app.get('/chat', async (req, res) => {
  const userQuery = "whar is the idea of the document?"; //req.query.message    ;

  if (!userQuery) {
    return res.status(400).json({ error: "Missing query parameter: message" });
  }

  try {
    const embeddings = new MistralAIEmbeddings({
      model: "mistral-embed",
      apiKey: process.env.MISTRAL_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: `http://localhost:6333`,
      collectionName: "rag-t",
    });

    const ret = vectorStore.asRetriever({ k: 2 });
    const result = await ret.invoke(userQuery);

    const SYSTEM_PROMPT = `
      You are a helpful AI assistant who answers the user query based on the available context from PDF File.
      Context:
      ${JSON.stringify(result)}
    `;

    const response = await client.invoke([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ]);

    return res.json({
      message: response.content,
      docs: result,
    });

  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.listen(8000, () => {
    console.log('Server is running on port 8000');

});