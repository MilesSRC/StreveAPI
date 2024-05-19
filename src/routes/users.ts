// Base
import { Router } from "express";
import { nanoid } from 'nanoid';
import { APIError } from "../library/Messages";
import { authRequired } from "../middlewares/Authorization";
import { UserCache } from "../caches";
import { MongooseError } from "mongoose";
import { rateLimit } from 'express-rate-limit';

// Models
import User from '../models/User';

// Base
const UserRouter = Router();

// Endpoint Security
UserRouter.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 25,
	standardHeaders: 'draft-7',

	keyGenerator: (req, res) => {
		return process.env.NODE_ENV === 'production' ? req.ip || 'local' : 'local';
	},

	message: APIError(
		"hit_rate_limit",
		"Woah! Slow down there, partner. You're hitting the rate limit."
	)
}));

// Create
UserRouter.post('/', async (req, res) => {
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
		const savedUser = await newUser.save();

		// Sanitize password
		savedUser.password = "";

		res.status(200).json(savedUser);
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
UserRouter.get('/me', authRequired, async (req, res) => {
	if(!req.user)
		return res.status(404).json(APIError(
			"user_not_found",
			"That user couldn't be found"
		))

	// sanitize password
	req.user.password = "";

	// Send users data
	res.status(200).json(req.user);
})

// Update
UserRouter.put('/', authRequired, async (req, res) => {
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
        const user = await User.findOne({ id: req.user?.id }) as IUser;

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
        const updatedUser = await User.findById(user._id) as IUser;

		// Remove sensitive information
		updatedUser.password = "";

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
UserRouter.delete('/', authRequired, async (req, res) => {
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