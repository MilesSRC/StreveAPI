import { rateLimit } from 'express-rate-limit';
import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import { APIError } from './Messages';

// Redis Client
const redis = createClient({
    url: 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
});

await redis.connect();

// Rate Limiting
/**
 * 1 min - 100 reqs
 */
export const BasicRL = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 100, // 100 requests

    message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	),

    keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

    standardHeaders: 'draft-7',

    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
    }),
});

/**
 * 1 min - 50 reqs
 */
export const MedRL = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 50, // 50 requests

    message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	),

    keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

    standardHeaders: 'draft-7',

    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
    }),
});

/**
 * 1 min - 25 reqs
 */
export const HighRL = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 25, // 25 requests

    message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	),

    keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

    standardHeaders: 'draft-7',

    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
    }),
});

/**
 * 1 min - 5 reqs
 */
export const StrictRL = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 5, // 5 requests

    message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	),

    keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

    skipFailedRequests: true,
    standardHeaders: 'draft-7',

    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
    }),
});

/**
 * 1 hour - 1 req
 */
export const OnceRL = rateLimit({
    windowMs: 1000 * 60 * 60, // 1 hour
    max: 1, // 1 request

    message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	),

    keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

    standardHeaders: 'draft-7',
    skipFailedRequests: true,

    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
    }),
});