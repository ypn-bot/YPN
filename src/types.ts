import {
	APIApplicationCommandInteraction,
	APIApplicationCommand,
	Permissions,
	MappedEvents,
	GatewayDispatchEvents,
} from "@discordjs/core";
import type { YPNClient } from "./YPNClient";
import type { YPNHook } from './util/YPNHook';

export type APICommand = Omit<
	APIApplicationCommand,
	"id" | "guild_id" | "application_id" | "version" | "default_member_permissions"
> & { default_member_permissions?: Permissions };

export interface Command<T extends APIApplicationCommandInteraction = APIApplicationCommandInteraction> {
	data: APICommand;

	execute: (client: YPNClient, interaction: T, ...args: unknown[]) => Promise<void>;
}

export type Identify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
export type When<C, T, F = null> = C extends boolean ? (C extends true ? T : F) : F;

export type MappedEventsNames = `${Identify<keyof MappedEvents>}`;

export type DispatchEvents = Identify<`${GatewayDispatchEvents}`>;

// @ts-expect-error
export type InMappedEvents<T> = T extends MappedEventsNames ? MappedEvents[T] : T;

export type SupportEvents = Exclude<DispatchEvents, "APPLICATION_COMMAND_PERMISSIONS_UPDATE">;

export interface DiscordEvent<T extends SupportEvents = SupportEvents> {
	name: T;

	execute: (client: YPNClient<true>, args: InMappedEvents<T>[0]) => Promise<void>;
}

export interface ChannelCache {
	webhooks: YPNHook[];
	lastWebhook?: string;
	ignored: boolean;
}

export interface YPNEmojis {
	guildId: string;
	id: string;
	name: string;
	animated?: boolean;
	require_colons?: boolean;
	managed?: boolean;
	availabed?: boolean;
}
