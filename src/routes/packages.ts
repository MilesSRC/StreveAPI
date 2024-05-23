// Base
import { Router } from "express";
import { authRequired } from "../middlewares/Authorization";
import { ServicePackageCache } from "../caches";
import { APIError } from "../library/Messages";
import stripe from '../library/Stripe';

// Models
import ServicePackage from "../models/ServicePackage";

// Types
import type { Request, Response } from "express";

// Router
const ServicePackageRouter = Router();

// Secure Endpoint
ServicePackageRouter.use(authRequired);

// Get all service packages
ServicePackageRouter.get("/", async (req: Request, res: Response) => {
    // Get all service packages
    let servicePackages = await ServicePackage
        .find()
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service packages"
            ));
        });

    // Return the service packages
    return res.status(200).json(servicePackages);
});

// Start checkout session for service package
ServicePackageRouter.post("/:id/checkout", async (req: Request, res: Response) => {
    // Get the service package
    let servicePackage = await ServicePackage
        .findOne({id: req.params.id})
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service package"
            ));
        }) as ServicePackageDocument | null;

    // Check if service package exists
    if (!servicePackage) {
        return res.status(404).json(APIError(
            "service_package_not_found",
            "Service package not found"
        ));
    }

    // Get the product
    let product = await stripe.products.retrieve(servicePackage.id);
    let price = product.default_price;

    // Create a checkout session
    let session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'us_bank_account'],

        line_items: [{
            price: servicePackage.cost.id,
            quantity: 1
        }],

        customer: req.user.stripeId || "",

        mode: 'subscription',
        success_url: `${process.env.URL}/api/services/${servicePackage.id}/success?session={CHECKOUT_SESSION_ID}&user=${req.user.id}&service=${req.query.service||"null"}`,
        cancel_url: `${process.env.URL}/api/services/${servicePackage.id}/cancel&user=${req.user.id}&service=${req.query.service||"null"}`
    });

    // Return the session
    return res.status(200).send(session.url || `${process.env.URL}/dashboard`);
});

// Export
export default ServicePackageRouter;