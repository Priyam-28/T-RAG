import { Queue } from 'bullmq';

const queue = new Queue('file-queue', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

(async () => {
  await queue.obliterate({ force: true }); // force: true allows clearing even with active jobs
  console.log('Queue cleared successfully!');
})();
