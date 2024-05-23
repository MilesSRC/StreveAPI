import Stripe from "stripe";

// Env Protection
if(!process.env.STRIPE_API_KEY)
    throw new Error("Missing STRIPE API KEY");

if(process.env.STRIPE_API_KEY.split("sk_")[1].split("_")[0] !== "test" && process.env.NODE_ENV !== "production")
    throw new Error("Stripe API Key is not a test key and NODE_ENV is not production");

export default new Stripe(process.env.STRIPE_API_KEY);