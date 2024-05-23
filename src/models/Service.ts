/**
 * @name Service
 * @description A service can be thought of as a virtual machine that a user can rent from us.
 * The service is a virtual machine that runs on a server, and the user can interact with the service.
 * The service has specifications, a cost, and a status.
 * The service can be active, inactive, suspended, terminated, installing, pending, or cancelled.
 * The service can be started, stopped, suspended, or terminated.
 * Typically, a service belongs to a user and runs on a dedicated server owned by us.
 * Services aren't limited to just virtual machines, but can be any virtual game server, web server, or application server.
 * Service types are defined by the series of the service and the server / region it runs on.
 * @author MilesSRC
 */
import { Schema, model, Types } from "mongoose";
import Server from "./Server";

/* Service Model */
const ServiceSchema = new Schema<ServiceDocument>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    series: { type: String, required: true },
    region: { type: String, required: true },

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
    
    activeInvoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: false, default: null },

    server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
    serviceAddress: { type: String, required: true },

    specs: { type: {
        ram: { type: Number, required: true },
        cores: { type: Number, required: true },
        disk: { type: Number, required: true },
        bandwidth: { type: Number, required: true }
    }, required: true },

    status: { type: String, required: true, enum: ['active', 'inactive', 'suspended', 'terminated', 'installing', 'pending', 'cancelled'] },
    suspended: { type: Schema.Types.Mixed, required: false, default: null }
}, { timestamps: true });

/* Service Methods */
class Service {
    async start(this: ServiceDocument): Promise<boolean> {
        /* Tell the server its running on to start the service */
        return true;
    }

    async stop(this: ServiceDocument): Promise<boolean> {
        /* Tell the server its running on to stop the service */
        return true;
    }

    async suspend(this: ServiceDocument, data: IServiceSuspension): Promise<boolean> {
        /* Tell the server its running on to suspend the service */
        /* Save the suspension data */
        /* Email the user */
        return true;
    }

    async terminate(this: ServiceDocument): Promise<boolean> {
        /* Tell the server its running on to terminate the service */
        /* Email the user */
        /* Queue the service for deletion */
        return true;
    }

    isRunning(this: ServiceDocument): boolean {
        return this.status === 'active';
    }

    async getServer(this: ServiceDocument): Promise<ServerDocument> {
        return await Server.findById(this.server) as ServerDocument;
    }

    /**
     * Get the individual cost of the service compared to the server cost it's running on
     * 
     * NOT TO BE USED FOR BILLING PURPOSES
     */
    async getIndividualCost(this: ServiceDocument): Promise<SubscriptionCurrencyData> {
        /* Get the server and service costs */
        const server = await this.getServer();
        const serverCost = server.cost.price;

        /* Calculate the cost of the RAM, Cores, Disk, and Bandwidth this service uses */
        const quaterCost = serverCost / 4;
        const ramCost = ((this.specs.ram / server.specs.ram) * quaterCost);
        const coresCost = ((this.specs.cores / server.specs.cores) * quaterCost);
        const diskCost = ((this.specs.disk / server.specs.disk) * quaterCost);
        const bandwidthCost = ((this.specs.bandwidth / server.specs.bandwidth) * quaterCost);

        /* Sum all the proportional costs */
        const resourceCost = ramCost + coresCost + diskCost + bandwidthCost;

        /* Add the service-specific cost if any */
        const individualCost = resourceCost + this.pricing.price;

        /* Perform any needed markup or rounding */
        const marketCost = individualCost * (parseFloat(process.env.SERVICES_MARKUP_RATE) || 1);
        const roundedCost = Math.round(marketCost * 100) / 100;

        return {
            price: roundedCost,
            currency: this.pricing.currency,
            symbol: this.pricing.symbol,
            duration: this.pricing.duration,
            billingStart: this.pricing.billingStart
        };
    }
}

ServiceSchema.loadClass(Service)
export default model<ServiceDocument>('Service', ServiceSchema);
export { ServiceSchema };