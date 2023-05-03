import { databaseConnection } from "../database/connection";
import { DiscordEvent } from "../types";

export default {
	name: "READY",

	execute: async (client, { data }) => {
		console.log(`Logged as ${data.user.username}${data.user.discriminator}`);
		client.user = data.user;

		await databaseConnection(process.env.DATABASE_URL!);
	},
} as DiscordEvent<"READY">;
