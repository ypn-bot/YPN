import type { YPNClient } from "../YPNClient";
import type { RawFile } from "@discordjs/rest";
import {
	WebhookType,
	APIUser,
	APIGuildMember,
	RESTPostAPIWebhookWithTokenQuery,
	RESTPostAPIWebhookWithTokenJSONBody,
	APIWebhook,
} from "@discordjs/core";

export class YPNHook {
	client: YPNClient;
	name: string;
	type: WebhookType = WebhookType.Incoming;
	token: string;
	channelId: string;
	avatar: string | null;
	guildId: string;
	id: string;
	user: Partial<APIUser>;
	as?: APIGuildMember;

	constructor(client: YPNClient, data: APIWebhook) {
		this.client = client;
		this.name = data.name!;
		this.type = data.type;
		this.token = data.token!;
		this.channelId = data.channel_id;
		this.avatar = data.avatar;
		this.guildId = data.guild_id!;
		this.id = data.id;
		this.user = data.user ?? {};
	}

	async sendAs(content: string, member: APIGuildMember, username: string, avatarUrl: string, thread?: string) {
		this.as = member;
		const body: WebhookMessageBody = { content, wait: true, avatar_url: avatarUrl, username };
		if (thread) body["thread_id"] = thread;
		return this.client.api.webhooks.execute(this.id, this.token, body, {});
	}
}

export type WebhookMessageBody = RESTPostAPIWebhookWithTokenJSONBody &
	RESTPostAPIWebhookWithTokenQuery & { files?: RawFile[]; wait: true };
