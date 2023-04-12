import { join } from "path";
import { readdir, stat } from "fs/promises";
import { Command, DiscordEvent } from "../types";

export type ResolveImport<T> = { default: T };

export async function walk(path: string) {
	const files = await readdir(path);
	const fileList: string[] = [];
	for (const file of files) {
		const filePath = join(path, file);
		const dir = await stat(filePath);
		if (dir.isDirectory()) {
			fileList.push(...(await walk(filePath)));
		} else {
			fileList.push(filePath);
		}
	}
	return fileList;
}

export async function loadCommands(): Promise<Command[]> {
	const commands: Command[] = [];
	const cmds = await walk(join(process.cwd(), "dist", "src", "commands"));
	for (const i of cmds) {
		if (!i.endsWith(".js")) {
			continue;
		}
		const cmd = (await import(i)) as ResolveImport<Command>;
		if (cmd.default) {
			commands.push(cmd.default);
			console.log(`Loaded command: ${commands[commands.length - 1].data.name}`);
		}
	}
	return commands;
}

export async function loadEvents(): Promise<DiscordEvent[]> {
	const events: DiscordEvent[] = [];
	const evs = await walk(join(process.cwd(), "dist", "src", "events"));
	for (const i of evs) {
		if (!i.endsWith(".js")) {
			continue;
		}
		const event = (await import(i)) as ResolveImport<DiscordEvent>;
		if (event.default) {
			events.push(event.default);
			console.log(`Loaded event: ${events[events.length - 1].name}`);
		}
	}
	return events;
}
