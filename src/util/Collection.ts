export interface CollectionOptions {
	limit: number;
	defaultExpire: number;
	cacheOnDemand: boolean;
}

export class Collection<K, V> {
	static default: CollectionOptions = {
		cacheOnDemand: true,
		limit: Infinity,
		defaultExpire: 0,
	};

	private readonly data = new Map<
		K,
		{
			value: V;
			expire: number;
			expireOn: number;
		}
	>();

	private timeout: NodeJS.Timeout | null = null;
	options: CollectionOptions;

	constructor(options: Partial<CollectionOptions>) {
		this.options = {...Collection.default, ...options};
	}

	set(key: K, value: V, expire = this.options.defaultExpire) {
		if (this.options.limit <= 0) {
			return;
		}
		if (expire > 0) {
			const expireOn = Date.now() + expire;
			this.data.set(key, { value, expire, expireOn });
		} else {
			this.data.set(key, { value, expire: -1, expireOn: -1 });
		}
		if (this.size > this.options.limit) {
			const iter = this.data.keys();
			while (this.size > this.options.limit) {
				this.delete(iter.next().value);
			}
		}
		this.resetTimeout();
	}

	get(key: K) {
		const data = this.data.get(key);
		if (this.options.cacheOnDemand && data && data.expire !== -1) {
			if (this.closer?.expireOn === data.expireOn) {
				setImmediate(() => this.resetTimeout());
			}
			data.expireOn = Date.now() + data.expire;
		}
		return data?.value;
	}

	has(key: K) {
		return this.data.has(key);
	}

	delete(key: K) {
		return this.data.delete(key);
	}

	resetTimeout() {
		this.stopTimeout();
		this.startTimeout();
	}

	stopTimeout() {
		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = null;
	}

	startTimeout() {
		const { expireOn, expire } = this.closer || { expire: -1, expireOn: -1 };
		if (expire === -1) {
			return;
		}
		if (this.timeout) {
			throw new Error("Timeout not cleared");
		}
		this.timeout = setTimeout(() => {
			this.clearExpired();
			this.resetTimeout();
		}, expireOn - Date.now());
	}

	clearExpired() {
		for (const [key, value] of this.data) {
			if (value.expireOn === -1) {
				continue;
			}
			if (Date.now() > value.expireOn) {
				this.data.delete(key);
			}
		}
	}

	get closer() {
		let d;
		for (const value of this.data.values()) {
			if (value.expire === -1) {
				continue;
			}
			if (!d) {
				d = value;
				continue;
			}
			if (d.expireOn > value.expireOn) {
				d = value;
			}
		}
		return d;
	}

	get size() {
		return this.data.size;
	}
}
