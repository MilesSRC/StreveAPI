import { Schema, model } from "mongoose";
import Service from "./Service";

/* ServicePkg Model */
const ServicePkgSchema = new Schema<any>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    regions: { type: [String], required: true },

    serverSeries: { type: String, required: true, default: null },
    packageSeries: { type: String, required: false, default: null },

    specs: { type: {
        ram: { type: Number, required: true },
        cores: { type: Number, required: true },
        disk: { type: Number, required: true },
        bandwidth: { type: Number, required: true }
    }, required: true },

    cost: { type: {
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        symbol: { type: String, required: true },
        days: { type: Number, required: true } // Days
    }, required: true },

    status: { type: String, required: true, enum: ['active', 'inactive'] },
    expires: { type: Date, required: false, default: null },
});

/* ServicePkg Methods */
class ServicePkg {
    async isAvailable(this: ServiceDocument): Promise<boolean> {
        /* Check if the service package is available */
        return this.status === 'active';
    }

    async getServices(this: ServiceDocument): Promise<ServiceDocument[]> {
        /* Get all services using this service package */
        return Service.find({ package: this._id });
    }

    async canFitService(this: ServiceDocument, service: ServiceDocument): Promise<boolean> {
        /* Check if the service can fit in the server */
        return (
            this.specs.ram >= service.specs.ram &&
            this.specs.cores >= service.specs.cores &&
            this.specs.disk >= service.specs.disk &&
            this.specs.bandwidth >= service.specs.bandwidth
        );
    }
}

ServicePkgSchema.loadClass(ServicePkg)
export default model<ServiceDocument>('ServicePackage', ServicePkgSchema);
export { ServicePkgSchema };