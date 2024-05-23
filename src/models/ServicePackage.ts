/**
 * @name ServicePackage
 * @description Service Package Model
 * This model represents a service package that would be displayed to the user when they are creating a new service.
 * The service package contains the specifications of the service, the cost, and the status of the service package.
 * The service package can be active or inactive, and can expire at a certain date.
 * Think of service packages as the plans/promotions that we, a service provider, offers to its users.
 * @author MilesSRC
 */
import { Schema, model } from "mongoose";
import Service from "./Service";
import Server from "./Server";

/* ServicePkg Model */
const ServicePkgSchema = new Schema<ServicePackageDocument>({
    name: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    regions: { type: [String], required: true },

    serverSeries: { type: String, required: true },
    packageSeries: { type: String, required: false, default: undefined },

    specs: { type: {
        ram: { type: Number, required: true },
        cores: { type: Number, required: true },
        disk: { type: Number, required: true },
        bandwidth: { type: Number, required: true }
    }, required: true },

    cost: { type: {
        id: { type: String, required: true }, // Stripe Price ID
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        symbol: { type: String, required: true },
        days: { type: Number, required: true } // Days
    }, required: true },

    status: { type: String, required: true, enum: ['active', 'inactive'] },
    expires: { type: Date, required: false, default: undefined },
});

/* ServicePkg Methods */
class ServicePkg {
    async isAvailable(this: ServicePackageDocument): Promise<boolean> {
        /* Check if the service package is available */
        return this.status === 'active';
    }

    async getServices(this: ServicePackageDocument): Promise<ServiceDocument[]> {
        /* Get all services using this service package */
        return Service.find({ package: this._id });
    }

    /** 
     * Get all servers that can host this service package
     */
    async getServers(this: ServicePackageDocument): Promise<ServerDocument[]> {
        return Server.find({ series: this.serverSeries });
    }
}

ServicePkgSchema.loadClass(ServicePkg)
export default model<ServicePackageDocument>('ServicePackage', ServicePkgSchema);
export { ServicePkgSchema };