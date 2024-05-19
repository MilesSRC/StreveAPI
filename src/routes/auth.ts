/* Base Imports */
import { Router } from "express";
import { sign } from "jsonwebtoken";
import User from '../models/User';
import { APIError } from "../library/Messages";
import { UserCache } from "../caches";

/* Router */
const AuthRouter = Router();

/* Login */
AuthRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email)
        return res.status(400).json(APIError(
            "missing_email",
            "Email is required"
        ));

    if(!password)
        return res.status(400).json(APIError(
            "missing_password",
            "Password is required"
        ));

    const user = await User.findOne({ email });

    if(!user)
        return res.status(404).json(APIError(
            "invalid_credentials",
            "Invalid email or password"
        ));

    const OK = await Bun.password.verify(password, user.password).catch(err => {
        res.status(404).json(APIError(
            "invalid_credentials",
            "Invalid email or password"
        ));
    });

    if(!OK)
        return res.status(404).json(APIError(
            "invalid_credentials",
            "Invalid email or password"
        ));

    const token = sign({
        id: user.id,
        username: user.name,
    }, process.env.JWT_SECRET, { expiresIn: req.query.remember ? '14d' : '12h' });

    /* Add user to cache */
    UserCache.set(user.id, user);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: req.query.remember ? 1209600000 : 43200000,
    })
    res.status(200).json({ token });
});

/* Export */
export default AuthRouter;