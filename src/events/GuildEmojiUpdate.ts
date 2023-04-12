import { DiscordEvent } from "../types";

export default {
	name: "GUILD_EMOJIS_UPDATE",

	execute: async (client, { data }) => {
		const promises = [];

		await client.cache.deleteAllKeysMatched(`emoji:${data.guild_id}:*`);
		for (const i of data.emojis) {
			promises.push(client.cache.set(`emoji:${data.guild_id}:${i.id}`, JSON.stringify(i)));
		}
		await Promise.all(promises);
	},
} as DiscordEvent<"GUILD_EMOJIS_UPDATE">;
