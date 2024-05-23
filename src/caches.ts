// Singleton cache using LRU
import { LRUCache } from "lru-cache";

export const UserCache = new LRUCache<string, UserDocument>({
	max: 500,
	ttl: 1000 * 60 * 15,
});

export const ServiceCache = new LRUCache<string, ServiceDocument>({
	max: 500,
	ttl: 1000 * 60 * 30,
});

export const ServicePackageCache = new LRUCache<string, ServicePackageDocument>({
	max: 500,
	ttl: 1000 * 60 * 60,
});