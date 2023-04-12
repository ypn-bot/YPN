import type { APIGuildChannel, GuildChannelType } from "@discordjs/core";
import type { DiscordEvent } from "../types";
import { GuildTextChannel, parseChannel } from "../util/util";

export default {
	name: "CHANNEL_CREATE",

	execute: async (client, { data }) => {
		if (!GuildTextChannel.includes(data.type)) {
			return;
		}
		const channel = data as APIGuildChannel<GuildChannelType>;
		await client.cache.set(`channel:${channel.guild_id}:${data.id}`, JSON.stringify(parseChannel(channel)));
	},
} as DiscordEvent<"CHANNEL_CREATE">;
