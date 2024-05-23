// Base
import { Router } from "express";
import { nanoid } from 'nanoid';
import { APIError } from "../library/Messages";
import { authRequired } from "../middlewares/Authorization";
import { UserCache } from "../caches";
import { MongooseError } from "mongoose";

// Models
import User from '../models/User';
import { sign } from "jsonwebtoken";
import { BasicRL, HighRL, OnceRL, StrictRL } from "../library/Ratelimits";

// Base
const UserRouter = Router();

// Create
UserRouter.post('/', process.env.NODE_ENV === 'production' ? OnceRL : BasicRL, async (req, res) => {
	const newUser = new User(req.body);
	newUser.id = nanoid(11);

	if(!newUser.email)
		return res.status(400).json(APIError(
			"missing_email",
			"Email is required"
		));

	if(!newUser.password)
		return res.status(400).json(APIError(
			"missing_password",
			"Password is required"
		));

	let hashed = await Bun.password.hash(newUser.password);
	newUser.password = hashed;

	/* Ensure role cannot be set */
	newUser.role = 'user';

	try {
		await newUser.save();

		// Get a copy of the user data without the password
		const user = newUser.toObject() as any;
		delete user.password;

		/* Generate a JWT and set it as the token cookie */
		const token = sign({
			id: newUser.id,
			username: newUser.name,
		}, process.env.JWT_SECRET, { expiresIn: '12h' });

		// Add user to cache
		UserCache.set(newUser.id, newUser);

		// Set the token cookie
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 43200000,
		});

		// Attempt to create a Stripe customer in the background
		newUser.createStripeCustomer().catch(err => {
			console.error(err);
		});

		res.status(200).json(user);
	} catch (err: MongooseError | Error | any) {
		if(err.errorResponse){
			const response = err.errorResponse;

			if(response.code === 11000 && response.keyValue.email)
				return res.status(400).json(APIError(
					"duplicate_email",
					"An account with that email already exists"
				));

			if(response.code === 11000 && response.keyValue.name)
				return res.status(400).json(APIError(
					"duplicate_name",
					"An account with that name already exists"
				));

			return res.status(500).json(err);
		}
	}
});

// Read
UserRouter.get('/me', BasicRL, authRequired, async (req, res) => {
	if(!req.user)
		return res.status(404).json(APIError(
			"user_not_found",
			"That user couldn't be found"
		))

	// Copy user data without the password
	const user = req.user.toObject() as any;
	delete user.password;

	// Send users data
	res.status(200).json(req.user);
})

// Update
UserRouter.put('/', HighRL, authRequired, async (req, res) => {
    // Disallowed fields
    const disallowedFields = ['role', 'id', 'createdAt', 'updatedAt', '__v', '_id'];

    // Check for disallowed fields in the request body
    for (const field of disallowedFields) {
        if (req.body[field]) {
            return res.status(403).json(APIError(
                "modify_field_internal",
                `You cannot modify the field: ${field}.`
            ));
        }
    }

    // Refer user.password changes to /auth/change-password
    if (req.body.password) {
        return res.status(403).json(APIError(
            "modify_field_pwd",
            "You cannot modify this field. Password must be changed at PUT /auth/password."
        ));
    }

    try {
        // Fetch user from the database to ensure it's a Mongoose document
        const user = await User.findOne({ id: req.user?.id }) as UserDocument;

        if (!user) {
            return res.status(404).json(APIError(
                "user_not_found",
                "User not found."
            ));
        }

        const allowedFields = ['name', 'email']; // Define allowed fields

        // Apply changes to the user object
        allowedFields.forEach(key => {
            if (req.body.hasOwnProperty(key)) {
                // @ts-ignore
                user[key] = req.body[key];
            }
        });

        // Save the user
        await user.save().catch(err => {
			console.log(err);

			return res.status(500).json(APIError(
				"server_error_database",
				"An error occurred while updating the user."
			));
		});

        // Refresh cache
        UserCache.set(user.id, user);

        // Fetch the updated user from the database to ensure the response contains the latest data
        const updatedDBUser = await User.findById(user._id);

		// This shouldn't happen, but to satisfy TypeScript
		if(!updatedDBUser)
			return res.status(404).json(APIError(
				"user_not_found",
				"User not found."
			));

		// Copy user data without the password
		const updatedUser = updatedDBUser.toObject() as any;
		delete updatedUser.password;

        res.status(200).json(updatedUser);
    } catch (err) {
		console.log(err);
		
        res.status(500).json(APIError(
            "server_error",
            "An error occurred while updating the user."
        ));
    }
});

// Delete
UserRouter.delete('/', StrictRL, authRequired, async (req, res) => {
	try {
		/* Remove user from cache */
		UserCache.delete(req.user.id);

		await User.findOneAndDelete({ id: req.user.id });

		res.status(200).json('User has been deleted...');
	} catch (err) {
		res.status(500).json(err);
	}
});

// Export
export default UserRouter;