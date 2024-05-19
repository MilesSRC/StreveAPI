import type { ObjectId, Document } from "mongoose";

declare global {
    declare namespace Express {
        interface Request {
            user: Document<unknown, {}, IUser> & IUser & {
                _id: Types.ObjectId;
            }
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