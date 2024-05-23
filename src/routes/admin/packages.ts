// Base
import { Router } from "express";
import { authRequired, adminRequired } from "../../middlewares/Authorization";
import { ServicePackageCache } from "../../caches";
import { APIError } from "../../library/Messages";
import { nanoid } from "nanoid";
import stripe from '../../library/Stripe';

// Models
import Service from "../../models/Service";
import Server from "../../models/Server";
import ServicePackage, { ServicePkgSchema } from "../../models/ServicePackage";

// Types
import type { Request, Response } from "express";
import Stripe from "../../library/Stripe";

// Router
const ServicePackageRouter = Router();

// Modifiable Fields
const modificationsAllowed = [
    "name",
    "description",
    "regions",
    "serverSeries",
    "packageSeries",
    "specs",
    "cost",
    "status",
    "expires"
]

// Secure Endpoint
ServicePackageRouter.use(authRequired);
ServicePackageRouter.use(adminRequired);

// Create a new service package
ServicePackageRouter.post("/", async (req: Request, res: Response) => {
    // Ensure request is formatted correctly
    for (let field of modificationsAllowed) 
        if (!req.body[field]) 
            return res.status(400).json(APIError(
                "missing_field",
                `Missing required field: ${field}`
            ));
        
    // Create a new service package
    let servicePackage = new ServicePackage({
        name: req.body.name,
        id: `pkg-${nanoid(4)}`,
        description: req.body.description,
        regions: req.body.regions,
        serverSeries: req.body.serverSeries,
        packageSeries: req.body.packageSeries,
        specs: req.body.specs,
        cost: req.body.cost,
        status: req.body.status,
        expires: req.body.expires
    });

    // Change cost.price to cents
    servicePackage.cost.price *= 100;

    // Create Stripe Product
    let product = await Stripe.products.create({
        name: servicePackage.name,
        id: servicePackage.id,
        type: 'service'
    }).catch(err => {
        return res.status(500).json(APIError(
            "stripe_error",
            "Failed to create Stripe product"
        ));
    });

    // Create Stripe Price
    let price = await Stripe.prices.create({
        product: servicePackage.id,
        unit_amount: servicePackage.cost.price, // Convert to cents
        currency: servicePackage.cost.currency,
        recurring: {
            interval: 'day',
            interval_count: servicePackage.cost.days
        }
    }).catch(err => {
        return res.status(500).json(APIError(
            "stripe_error",
            "Failed to create Stripe price"
        ));
    }) as {
        id: string
    };

    // Save the service package
    servicePackage.cost.id = price.id;
    await servicePackage.save();

    // Cache the service package
    ServicePackageCache.set(servicePackage.id, servicePackage);

    // Return the service package
    return res.status(201).json(servicePackage);
});

// Update a service package
ServicePackageRouter.put("/:id", async (req: Request, res: Response) => {
    // Ensure only modifiable fields are updated
    for (let field in req.body) 
        if (!modificationsAllowed.includes(field)) 
            return res.status(400).json(APIError(
                "invalid_field",
                `Invalid field: ${field}`
            ));

    // Find the service package
    let servicePackage = await ServicePackage
        .findOne({ id: req.params.id })
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service package"
            ));
        }) as ServicePackageDocument;

    // Update the service package
    for (let field in req.body) 
        // @ts-ignore
        servicePackage[field] = req.body[field];

    // Save the service package
    await servicePackage.save();

    // Update the cache
    ServicePackageCache.set(servicePackage.id, servicePackage);

    // Return the service package
    return res.status(200).json(servicePackage);
});

// Delete a service package
ServicePackageRouter.delete("/:id", async (req: Request, res: Response) => {
    // Find the service package
    let servicePackage = await ServicePackage
        .findOne({ id: req.params.id })
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service package"
            ));
        }) as ServicePackageDocument;

    // Delete the Stripe product
    await stripe.products.del(servicePackage.id).catch(err => {
        APIError(
            "stripe_error",
            "Failed to delete Stripe product",
            {
                extra: { err, servicePackage }
            }
        )
    });

    // Delete the cache
    ServicePackageCache.delete(servicePackage.id);

    // Delete the service package
    await servicePackage.deleteOne();

    // Return the service package
    return res.status(200).json(servicePackage);
});

// Find servers on a service package
ServicePackageRouter.get("/:id/servers", async (req: Request, res: Response) => {
    // Find the service package
    let servicePackage = await ServicePackage
        .findOne({ id: req.params.id })
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service package"
            ));
        }) as ServicePackageDocument;

    // Find servers
    let servers = await servicePackage.getServers();

    // Return the servers
    return res.status(200).json(servers);
});

// Find services on a service package
ServicePackageRouter.get("/:id/services", async (req: Request, res: Response) => {
    // Find the service package
    let servicePackage = await ServicePackage
        .findOne({ id: req.params.id })
        .catch(err => {
            return res.status(500).json(APIError(
                "database_error",
                "Failed to find service package"
            ));
        }) as ServicePackageDocument;

    // Find services
    let services = await servicePackage.getServices();

    // Return the services
    return res.status(200).json(services);
});

// Export
export default ServicePackageRouter;