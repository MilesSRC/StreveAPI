import { Schema, model } from "mongoose";
import Stripe from "../library/Stripe";

const UserSchema = new Schema<UserDocument>({
    id: { type: String, required: true, unique: true },
    stripeId: { type: String, required: false, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    fullName: { type: String, required: true },

    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

class User {
    /**
     * Return a sanitized version of the user
     * (Should exclude sensitive information like passwords)
     */
    async sanitize(this: UserDocument) {
        const user = this.toObject() as any;
        delete user.password;
        return user;
    }

    /** 
     * Create Stripe customer for user
     */
    async createStripeCustomer(this: UserDocument): Promise<StripeCustomerData | null | void> {
        // Stripe API Call
        if(!this.email || !this.fullName)
            return console.error(`User ${this.id} has missing information`);

        if(this.stripeId && this.stripeId.startsWith('cus_'))
            return;

        await Stripe.customers.create({
            email: this.email,
            name: this.fullName,
            
            metadata: {
                userId: this.id
            }
        }).catch(err => {
            console.error(`Failed to create Stripe customer for user ${this.id}`);
            console.error(err);
        }).then((customer: any) => {
            customer = customer as StripeCustomerData;

            // Update user with Stripe customer ID
            this.stripeId = customer.id;
            this.save();

            return customer;
        })
    }
}  

UserSchema.loadClass(User);
export default model<UserDocument>('User', UserSchema);
export { UserSchema };