// Base
import { Router } from "express";
import { APIError } from "../../library/Messages";
import { authRequired, adminRequired, securityKeyRequired } from "../../middlewares/Authorization";

// Models
import User from '../../models/User';

// Base
const AdminRouter = Router();

// Get admins
AdminRouter.get('/users', securityKeyRequired, async (req, res) => {
    // Get all users
    let users = await User.find({ role: 'admin' });

    // Return the users
    return res.status(200).json(users);
});

// Update user to be an admin
AdminRouter.post('/user', securityKeyRequired, async (req, res) => {
    // Get the user
    let user = await User.findOne({ id: req.body.id });

    // Check if the user exists
    if (!user)
        return res.status(404).json(APIError(
            "user_not_found",
            "The user could not be found"
        ));

    // Update the user
    user.role = 'admin';

    // Save the user
    await user.save();

    // Return the user
    return res.status(200).json(user);
});

// Remove an admin
AdminRouter.delete('/user', securityKeyRequired, async (req, res) => {
    // Get the user
    let user = await User.findOne({ id: req.body.id });

    // Check if the user exists
    if (!user)
        return res.status(404).json(APIError(
            "user_not_found",
            "The user could not be found"
        ));

    // Update the user
    user.role = 'user';

    // Save the user
    await user.save();

    // Return the user
    return res.status(200).json(user);
});

// Get all users
AdminRouter.get('/users', authRequired, adminRequired, async (req, res) => {
    // Get all users
    let users = await User.find();

    // Return the users
    return res.status(200).json(users);
});

// Export
export default AdminRouter;