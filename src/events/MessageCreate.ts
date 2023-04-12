import { DiscordEvent } from "../types";
import { formatEmoji, getWebhook, hasReplace, replaceEmojis, resolveMember } from "../util/util";
import { CDNRoutes, ImageFormat } from "@discordjs/core";

export default {
	name: "MESSAGE_CREATE",

	execute: async (client, { data: message }, bypass = false) => {
		if (!message.guild_id || message.author?.bot) return;

		if (message.webhook_id && !bypass) return;

		if (!message.member) message.member = await resolveMember(client, message.guild_id, message.author.id);

		const replaces = (await hasReplace(message.content))?.map((g) => g.groups?.usedname ?? "");
		if (!replaces?.length) return;

		const search = await client.cache.searchEmojis(replaces);

		const emojis = (await client.cache.gets(search)).map((x) => (typeof x === "string" ? x : "")) as string[];
		if (!emojis.length) return;

		const newContent = replaceEmojis(message.content, formatEmoji(emojis));
		if (!newContent) return;

		// tries
		try {
			let webhook;
			const webhooks = await getWebhook(client, message.channel_id, message.guild_id);
			const as = webhooks.find((w) => w.as);
			webhook = webhooks[Math.floor(Math.random() * webhooks.length)];
			if (as && as.id === message.author.id) webhook = as;
			await webhook.sendAs(
				newContent,
				message.member,
				message.member.nick ?? message.author.username,
				CDNRoutes.userAvatar(message.author.id, message.author.avatar!, ImageFormat.WebP),
			);
			await client.api.channels.deleteMessage(message.channel_id, message.id, { reason: "Replace with emojis " });
		} catch (e: any) {
			console.error(e);
		}
	},
} as DiscordEvent<"MESSAGE_CREATE">;
