import type { APIGuildChannel, GuildChannelType } from "@discordjs/core";
import type { DiscordEvent } from "../types";
import { GuildTextChannel } from "../util/util";

export default {
	name: "CHANNEL_DELETE",

	execute: async (client, { data }) => {
		if (!GuildTextChannel.includes(data.type)) {
			return;
		}
		const channel = data as APIGuildChannel<GuildChannelType>;
		await client.cache.del(`channel:${channel.guild_id}:${data.id}`);
	},
} as DiscordEvent<"CHANNEL_DELETE">;
