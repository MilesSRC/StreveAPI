import type { ObjectId } from "mongoose";

declare global {
    declare namespace Express {
        interface Request {
            user: IUser;
        }
    }

    interface IUser {
        _id: ObjectId,

        name: string,
        email: string,
        id: string,
        password: string, /* SHA512 */
        role: 'admin' | 'user',

        createdAt: Date,
        updatedAt: Date,

        __v: number,

        save(): Promise<IUser>;
    }    
}

export {};