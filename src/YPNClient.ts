import type { ChannelCache, Command, When } from "./types";
import { Client, type ClientOptions, type MappedEvents, APIUser } from "@discordjs/core";
import { Collection } from "./util/Collection";
import { CacheManger } from "./util/CacheManager";
import { loadEvents } from "./util/Files";

export class YPNClient<on extends boolean = boolean> extends Client {
	commands: Map<string, Command> = new Map();
	cache: CacheManger;
	user!: When<on, APIUser>;
	channels: Collection<string, ChannelCache> = new Collection({
		limit: 5000,
		cacheOnDemand: true,
	});

	constructor(options: ClientOptions) {
		super(options);
		this.cache = new CacheManger(this);
	}

	async init() {
		await loadEvents().then((events) =>
			events.forEach((event) => {
				this.on(event.name as unknown as keyof MappedEvents, (args: any) =>
					event.execute(this as YPNClient<true>, args),
				);
			}),
		);
	}
}
