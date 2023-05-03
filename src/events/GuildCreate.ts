import type { APIGuildChannel, GuildChannelType } from "@discordjs/core";
import { DiscordEvent } from "../types";
import { parseChannel } from "../util/util";

export default {
	name: "GUILD_CREATE",

	execute: async (client, { data }) => {
		const promises = [];

		for (const i of data.channels as APIGuildChannel<GuildChannelType>[]) {
			promises.push(
				client.cache.set(`channel:${data.id}:${i.id}`, JSON.stringify(parseChannel({ ...i, guild_id: data.id }))),
			);
		}

		for (const i of data.threads as APIGuildChannel<GuildChannelType>[]) {
			promises.push(
				client.cache.set(`channel:${data.id}:${i.id}`, JSON.stringify(parseChannel({ ...i, guild_id: data.id }))),
			);
		}

		for (const i of data.emojis ?? []) {
			promises.push(client.cache.setEmoji(data.id, i.id!, i));
		}

		for (const i of data.members ?? []) {
			promises.push(
				client.cache.set(
					`member:${data.id}:${i.user?.id}`,
					JSON.stringify({ id: i.user?.id, guild_id: data.id, nickname: i.nick }),
				),
			);
		}
		await Promise.all(promises);
	},
} as DiscordEvent<"GUILD_CREATE">;
