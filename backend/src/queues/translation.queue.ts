import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { TranslationService } from "../services/translation.service";

const connection = new IORedis(process.env.REDIS_URL || "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

export const translationQueue = new Queue("translation-tasks", {
  connection: connection as any,
});

export const translationWorker = new Worker(
  "translation-tasks",
  async (job: Job) => {
    const { chapterId } = job.data;
    console.log(
      `[Queue] Starting background translation for Chapter ID: ${chapterId}`,
    );

    await TranslationService.translateChapter(chapterId);

    console.log(
      `[Queue] Completed background translation for Chapter ID: ${chapterId}`,
    );
  },
  {
    connection: connection as any,
    concurrency: 1,
  },
);

translationWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(
    `[Queue] Job failed for Chapter ID: ${job?.data?.chapterId}`,
    err.message,
  );
});
