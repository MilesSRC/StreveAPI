import { Schema, model } from "mongoose";
import Stripe from "../library/Stripe";

const InvoiceSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    pricing: { type: {
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        symbol: { type: String, required: true },
        duration: { type: {
            amount: { type: Number, required: true },
            unit: { type: String, required: true, enum: ['day', 'week', 'month', 'year'] }
        }, required: true },
        billingStart: { type: Date, required: true }
    }, required: true },

    status: { type: String, enum: ['paid', 'unpaid', 'stale', 'invalid', 'cancelled'], default: 'unpaid' },
});

class Invoice { 
    async $fetchStatus(this: InvoiceDocument): Promise<string> {
        /* Get status from Stripe */
        const invoice = await Stripe.invoices.retrieve(this.id);

        /* If invoice is not found, return stale */
        if(!invoice) return 'invalid';

        /* If invoice is paid, return paid */
        return invoice.status || 'invalid';
    }

    async fetchStatus(this: InvoiceDocument): Promise<string> {
        let status = await this.$fetchStatus();

        if(status !== this.status)
            /* Stripe provides: draft, open, paid, uncollectible, void, and uncollectible */
            switch(status) {
                case "paid":
                    this.status = "paid";
                    break;
                case "void":
                    this.status = "cancelled";
                    break;
                case "uncollectible":
                    this.status = "invalid";
                    break;
                case "open":
                    this.status = "unpaid";
                    break;
                default:
                    this.status = "stale";
                    break;
            }

        await this.save();
        return this.status;
    }
}

InvoiceSchema.loadClass(Invoice);
export default model('Invoice', InvoiceSchema);
export { InvoiceSchema };