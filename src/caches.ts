// Singleton cache using LRU
import { LRUCache } from "lru-cache";

export const UserCache = new LRUCache({
	max: 500,
	ttl: 1000 * 60 * 15,
});