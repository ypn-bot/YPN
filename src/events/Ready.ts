import { DiscordEvent } from "../types";

export default {
	name: "READY",

	execute: async (client, { data }) => {
		console.log(`Logged as ${data.user.username}${data.user.discriminator}`);
		client.user = data.user;
	},
} as DiscordEvent<"READY">;
