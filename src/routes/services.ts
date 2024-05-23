// Base
import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/Authorization";
import { ServiceCache, ServicePackageCache } from "../caches";
import { rateLimit } from 'express-rate-limit';
import { APIError } from "../library/Messages";
import { nanoid } from "nanoid";
import stripe from '../library/Stripe';

// Models
import Service from "../models/Service";
import Server from "../models/Server";
import ServicePackage from "../models/ServicePackage";

// Types
import type { Request, Response } from "express";
// Router
const ServiceRouter = Router();

// Rate Limiting
ServiceRouter.use(rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 100, // 100 requests
}));

// Get all services
ServiceRouter.get("/", authRequired, async (req: Request, res: Response) => {
    const services = await Service.find({ user: req.user._id });
    return res.json(services);
});

// Create a new service
// Must have a service package to create a service
ServiceRouter.post("/", authRequired, async (req: Request, res: Response) => {
    // Ensure the req.body is a valid transaction (stripe)
    if(!req.body.package || !req.body.details)
        return res.status(400).send(APIError(
            "invalid_request",
            "Missing required fields"
        ));

    // Start by checking if the user has a valid package
    const pkg = req.body.package;
    const details = req.body.details;

    // Check if the package exists (check cache, if not, query database)
    let srvPkg = ServicePackageCache.get(pkg) as ServicePackageDocument | undefined | null;

    if(!srvPkg){
        srvPkg = await ServicePackage.findOne({ id: pkg });

        if(srvPkg)
            ServicePackageCache.set(srvPkg.id, srvPkg);
        else
            return res.status(404).send(APIError(
                "package_not_found",
                "That package couldn't be found"
            ));
    }

    /* Create a new service */
    const service = new Service({
        id: nanoid(10),
        user: req.user._id,
        package: srvPkg._id,
        ...details
    });

    /* We need to wait for the assigned server to adknowledge build state */
    service.status = 'pending';

    /* Populate service.specs with package.specs */
    service.specs = srvPkg.specs;
    
    /* Find a server that can host the service */
    const servers = await Server.find({ status: 'online', region: service.region, series: srvPkg.serverSeries });

    if(servers.length === 0)
        return res.status(500).send(APIError(
            "no_servers_available",
            "No servers are available to host this service"
        ));

    // Select a server based on availabity (server.async canFitService(this: ServerDocument, service: IService): Promise<boolean>)
    let selectedServer = servers[0];
    for(const server of servers){
        if(await server.canFitService(service)){
            selectedServer = server;
            break;
        }
    }

    // Customer Stripe ID
    const customer = { id: req.user.stripeId } || await req.user.createStripeCustomer();
    const customerID = customer.id;
    
    /* Continue Checkout */
    return res.redirect(307, `/api/services/${srvPkg.id}/checkout?service=${service.id}`);
});

// Export
export default ServiceRouter;