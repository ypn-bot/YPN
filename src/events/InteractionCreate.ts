import { ApplicationCommandType, InteractionType } from "@discordjs/core";
import { DiscordEvent } from "../types";

export default {
	name: "INTERACTION_CREATE",

	execute: async (client, { data: interaction }) => {
		if (InteractionType.ApplicationCommand === interaction.type) {
			const { data } = interaction;
			if (ApplicationCommandType.ChatInput === data.type) {
				const command = client.commands.get(data.name);
				if (!command) return;
				command.execute(client, interaction);
			}
		}
	},
} as DiscordEvent<"INTERACTION_CREATE">;
