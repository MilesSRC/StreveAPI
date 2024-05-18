import { Schema, model } from "mongoose";

interface IUser {
    name: string,
    email: string,
    id: string,
    password: string, /* SHA512 */
    role: 'admin' | 'user',

    createdAt: Date,
    updatedAt: Date,
    __v: number,
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

export default model<IUser>('User', UserSchema);
export { UserSchema };