import { Worker } from 'bullmq';

const worker = new Worker('file-queue', async job => {
  if (job) {
    console.log("Job :",job.data);
  }
}, { concurrency: 100,
    connection: {
        host: 'localhost',
        port: 6379
    }
});