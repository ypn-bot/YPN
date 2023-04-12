import { YPNClient } from "../YPNClient";
import type { APIGuildMember, APIWebhook, GuildTextChannelType, APIGuildChannel, GuildChannelType} from "@discordjs/core";
import { ChannelType } from "@discordjs/core";
import { ChannelCache, YPNEmojis } from "../types";
import { YPNHook } from "./YPNHook";

export const regex = {
	posible: new RegExp(/:(?<usedname>[a-z_\d]+):/gim),
	emoji: new RegExp(/(?<!\\)<(?<animated>a?):(?<name>[a-z_\d]+):(?<id>\d+)>/gim),
};

export async function hasReplace(content: string): Promise<null | RegExpMatchArray[]> {
	let posibleEmojis = [...content.matchAll(regex.posible)];
	if (!posibleEmojis.length) {
		return null;
	}
	posibleEmojis = posibleEmojis.filter(
		(e) =>
			e.index === 0 ??
			(!["<", "a"].includes(content[e.index! - 1]) &&
				content.slice(e.index! + e.length + 1).replace(/\d+/, "")[0] !== ">"),
	);
	return posibleEmojis.length ? posibleEmojis : null;
}

export async function searchWebhooks(client: YPNClient, channelId: string, webhookId = "*", guildId = "*") {
	let cache: any;
	cache = await client.cache.scanMatch(`channel:${guildId}:${channelId}:${webhookId}`);
	if (cache.length) {
		cache = await client.cache.gets(cache as string[]);
		return cache.map((x: string) => new YPNHook(client, JSON.parse(x) as APIWebhook));
	}

	const result = (await client.api.channels.getWebhooks(channelId)).filter(
		(w) => w.name && [`${client.user}`, "YPN-2"].includes(w.name),
	);

	if (!result.length) {
		const webhooks = await Promise.all([
			createWebhook(client, channelId, "YPN-1"),
			createWebhook(client, channelId, "YPN-2"),
		]);
		return webhooks.map((x) => new YPNHook(client, x));
	}

	await Promise.all(
		result.map((w) => client.cache.set(`webhook:${w.guild_id}:${w.channel_id}:${w.id}`, JSON.stringify(w))),
	);
	return result.map((x) => new YPNHook(client, x));
}

export async function createWebhook(session: YPNClient, channelId: string, name: string) {
	const webhook = (await session.api.webhooks.create(
		channelId,
		{ name },
		{ reason: "Webhook for emojis" },
	)) as APIWebhook;
	session.cache.set(`webhook:${webhook.guild_id}:${webhook.channel_id}:${webhook.id}`, JSON.stringify(webhook));
	return webhook;
}

export async function getWebhook(session: YPNClient, channelId: string, guildId: string, webhookId?: string) {
	let channel = session.channels.get(channelId);
	if (!channel) {
		channel = await resolveChannel(session, guildId, channelId).then(
			(_) =>
				({
					webhooks: [],
					ignored: false,
				}) as ChannelCache,
		);
	}

	let webhooks = channel!.webhooks;
	if (!webhooks.length) {
		webhooks = await searchWebhooks(session, channelId, webhookId, guildId);
		session.channels.set(channelId, { ...channel!, webhooks });
	}

	return webhooks;
}

export function formatEmoji(emojis: string[]): YPNEmojis[] {
	const formats: YPNEmojis[] = [];
	emojis.forEach((x) => {
		if (!x.length) {
			return;
		}
		const emoji = JSON.parse(x) as YPNEmojis;
		formats.push({
			...emoji,
			guildId: emoji.guildId,
			id: emoji.id,
			name: emoji.name,
			animated: emoji.animated,
		});
	});
	return formats;
}

export function EmojiToString(emoji: YPNEmojis) {
	return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

export function replaceEmojis(content: string, replaces: YPNEmojis[]): string | void {
	const ogcontent = `${content}`;
	for (const e of replaces) {
		content = content.replace(new RegExp(`:(?:${e.name}+)?${e.name}+:(?![0-9]{18,19}>)`, "gm"), EmojiToString(e));
	}
	if (content !== ogcontent) {
		return content;
	}
}

export async function resolveMember(client: YPNClient, guildId: string, id: string): Promise<APIGuildMember> {
	let member: any;

	member = await client.cache.get(`member:${guildId}:${id}`);

	if (member) return JSON.parse(member) as APIGuildMember;

	member = await client.api.guilds.getMember(guildId, id, {});

	return member;
}

export async function resolveChannel(client: YPNClient, guildId: string, id: string): Promise<GuildTextChannelType> {
	let channel: any;

	channel = await client.cache.get(`channel:${guildId}:${id}`);

	if (channel) return JSON.parse(channel) as unknown as GuildTextChannelType;

	channel = (await client.api.channels.get(id, {})) as unknown as GuildTextChannelType;

	return channel;
}

export const GuildTextChannel = [0, 2, 5, 10, 11, 12, 13, 15];

export function parseChannel(channel: APIGuildChannel<GuildChannelType>) {
	switch (channel.type) {
		case ChannelType.GuildForum:
		case ChannelType.GuildAnnouncement:
		case ChannelType.AnnouncementThread:
		case ChannelType.PrivateThread:
		case ChannelType.PublicThread:
		case ChannelType.GuildText:
		case ChannelType.GuildVoice:
		case ChannelType.GuildStageVoice:
			return channel;
		default:
			return {
				id: channel.id,
				guild_id: channel.guild_id!,
				type: channel.type,
			};
	}
}
