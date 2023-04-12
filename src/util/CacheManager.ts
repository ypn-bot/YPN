import IOredis from "ioredis";
import type { APIEmoji } from "@discordjs/core";
import { formatEmoji } from "./util";
import type { YPNClient } from "../YPNClient";
import { Identify } from "../types";

const redisOptions = {
	port: Number(process.env.REDIS_PORT) || 6379,
	host: process.env.REDIS_HOST || "localhost",
	enableReadyCheck: true,
	retryStrategy(times: number) {
		return Math.min(times * 50, 3000);
	},
};

export class CacheManger extends IOredis {
	session: YPNClient;

	constructor(session: YPNClient) {
		super(redisOptions);
		this.session = session;

		this.on("error", (err) => {
			console.error("Error: ", err);
		})
			.on("connect", () => {
				console.log("Connected to Redis");
			})
			.on("reconnecting", () => {
				console.log("Reconnecting to Redis");
			})
			.on("end", () => {
				console.warn("Disconnected from Redis");
			})
			.on("ready", () => {
				console.log("Redis is ready");
			})
			.on("close", () => {
				console.warn("Connection to Redis closed");
			});
	}

	async deleteAllKeysMatched(match: string, splice = 100) {
		let pipeline = this.pipeline();
		const arr = await this.scanMatch(match);
		const chunks = Math.ceil(arr.length / splice);
		for (let i = 0; i < chunks; i++) {
			pipeline.del(arr.slice(i * splice, (i + 1) * splice));
			await pipeline.exec();
			pipeline = this.pipeline();
		}
		return { result: arr, chunks, splice };
	}

	async scanMatch(match: string) {
		return new Promise<string[]>((r, j) => {
			const stream = this.scanStream({
				match,
			});

			const keys: string[] = [];
			stream
				.on("data", (resultKeys) => keys.push(...resultKeys))
				.on("end", () => r(keys))
				.on("error", (err) => j(err));
		});
	}

	async gets(matchs: string[]) {
		return Promise.all(matchs.map((x) => this.get(x)));
	}

	async setEmoji(guildId: string, emojiId: string, data: Identify<APIEmoji & { guild_id: string }>) {
		await this.set(`emoji:${guildId}:${emojiId}:${data.name}`, JSON.stringify(data));
		return data;
	}

	async getEmoji(guildId: string, emojiId: string, name: string) {
		const emoji = await this.get(`emoji:${guildId}:${emojiId}:${name}`);
		if (!emoji) {
			return;
		}
		return formatEmoji([emoji]);
	}

	async getGuildEmojis(guildId: string) {
		const emojis = await this.scanMatch(`emoji:${guildId}:*:*`);

		return formatEmoji(emojis);
	}

	async searchEmojis(usedName: string | string[], emojiId = "*", guildId = "*"): Promise<string[]> {
		let cache = [];

		if (Array.isArray(usedName)) {
			cache = await Promise.all(usedName.map((x) => this.scanMatch(`emoji:${guildId}:${emojiId}:${x}`)));
			return ([] as string[]).concat(...cache);
		}
		cache = await this.scanMatch(`emoji:${guildId}:${emojiId}:${usedName}`);
		return cache;
	}
}
