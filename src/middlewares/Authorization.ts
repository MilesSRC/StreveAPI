import { type NextFunction, type Request, type Response } from "express";
import { type Document, type Types } from "mongoose";
import { verify } from 'jsonwebtoken';
import { APIError } from "../library/Messages";
import User from '../models/User';
import { UserCache } from "../caches";

async function authRequired(req: Request, res: Response, next: NextFunction){
	/* Verify JSONWEBTOKEN */
	const auth = req.cookies.token;

	if(!auth)
		return res.status(403).send(APIError(
			"invalid_authorization",
			"Authorization cookie contains an invalid token type for this endpoint."
		))

	// Verify that is in indeed a JWT
	const token = auth.split(".").length === 3 ? auth : undefined;

	if(!token)
		return res.status(403).send(APIError(
			"invalid_token_missing",
			"Authorization cookie contains an invalid token."
		))

	// Verify JWT
	let payload: {
		id: string;
		username: string;
		iat: number;
		exp: number;
	};

	try {
		// @ts-ignore
		payload = verify(token, process.env.JWT_SECRET);
	} catch (err) {
		return res.status(403).send(APIError(
			"invalid_token_failed",
			"Authorization cookie contains an invalid token."
		));
	}

	if(!payload)
		return res.status(500).send(APIError(
			"internal_error",
			"An internal error occurred while verifying the token."
		));

	// Check if user is in cache
	let user = UserCache.get(payload.id) as Document<unknown, {}, IUser> & IUser & {
		_id: Types.ObjectId;
	} | null;

	if(!user){
		user = await User.findOne({ id: payload.id });

		if(user && user.id === payload.id)
			UserCache.set(user.id, user);

		if(!user)
			return res.status(404).send(APIError(
				"user_not_found",
				"That user couldn't be found"
			))
	}

	req.user = user;
	next();
}

function adminRequired(req: Request, res: Response, next: NextFunction){
	if(!req.user)
		return res.status(403).send(APIError(
			"unauthorized",
			"You are not authorized to perform this action."
		))

	if(req.user.role !== 'admin')
		return res.status(403).send(APIError(
			"unauthorized",
			"You are not authorized to perform this action."
		))
		
	next();
}

export { authRequired, adminRequired };