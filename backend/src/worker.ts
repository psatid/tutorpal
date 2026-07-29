import { ClassReminderService } from "./services/class-reminder.service";

const service = new ClassReminderService();
let running = false;
let interval: ReturnType<typeof setInterval> | undefined;

async function run() {
	if (running) return;
	running = true;
	try {
		await service.poll();
	} catch (error) {
		console.error("Class reminder poll failed", error);
	} finally {
		running = false;
	}
}
await run();
interval = setInterval(run, 60_000);

function shutdown() {
	if (interval) clearInterval(interval);
	process.exit(0);
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
