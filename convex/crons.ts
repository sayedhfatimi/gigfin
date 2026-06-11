import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs inside the self-hosted backend — no external scheduler, works offline.
crons.daily(
  "materialize recurring expenses",
  { hourUTC: 1, minuteUTC: 0 },
  internal.recurring.materializeDue,
);

export default crons;
