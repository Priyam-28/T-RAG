import { Worker } from 'bullmq';
import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import 'dotenv/config';

const worker = new Worker('file-queue', async (job) => {
    console.log("Job:", job.data);
    const data = JSON.parse(job.data);
    
    // Load PDF and get documents
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    console.log("Docs loaded:", docs);

    
    const embeddings = new MistralAIEmbeddings({
      model: "mistral-embed",
      apiKey: process.env.MISTRAL_API_KEY, // Default value
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: `http://localhost:6333`,
      collectionName: "rag-t",
    });
    
    await vectorStore.addDocuments(docs);
    console.log(`All docs are added to vector store`);
  


}, {
  concurrency: 100,
  connection: {
    host: 'localhost',
    port: 6379
  }
});