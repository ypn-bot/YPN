import { DiscordEvent } from "../types";

export default {
	name: "GUILD_DELETE",

	execute: async (client, { data }) => {
		await client.cache.deleteAllKeysMatched(`*:${data.id}:*`);
	},
} as DiscordEvent<"GUILD_DELETE">;
