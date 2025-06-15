import { Worker } from 'bullmq';
import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";

const worker = new Worker('file-queue', async (job) => {
    console.log("Job:", job.data);
    const data = JSON.parse(job.data);
    
    // Load PDF and get documents
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    console.log("Docs loaded:", docs);

    // Extract text content from all documents
    const combinedText = docs.map(doc => doc.pageContent).join('\n');
    
    // Split the combined text into chunks
    const textSplitter = new CharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 0,
    });
    
    const chunks = await textSplitter.splitText(combinedText);
    console.log("Text chunks:", chunks.length);
    console.log(chunks[0]); // Log first chunk for verification

}, {
  concurrency: 100,
  connection: {
    host: 'localhost',
    port: 6379
  }
});