import { Schema, Types, model, type ObjectId } from "mongoose";
import Service from "./Service";

/* Server Model */
const ServerSchema = new Schema<ServerDocument>({
    name: { type: String, required: true },
    address: { type: String, required: true },
    port: { type: Number, required: true },

    provider: { type: {
        name: { type: String, required: true },
        url: { type: String, required: true },

        apiEndpoint: { type: String, required: true },
        machineId: { type: String, required: true },
    }, required: true },

    specs: { type: {
        ram: { type: Number, required: true },
        cores: { type: Number, required: true },
        disk: { type: Number, required: true },
        bandwidth: { type: Number, required: true },
    }, required: true },

    cost: { type: {
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        symbol: { type: String, required: true },
        duration: { type: {
            amount: { type: Number, required: true },
            unit: { type: String, required: true, enum: ['day', 'week', 'month', 'year'] }
        }, required: true },
        billingStart: { type: Date, required: true }
    }, required: true },
}, { timestamps: true });

/* Server Methods */
class Server {
    async isAvailable(this: ServerDocument): Promise<boolean> {
        /* Hit the machine internal API to check if it's available */
        console.warn("Method not implemented. -> server :: isAvailable");
        return true;
    }

    async getServices(this: ServerDocument): Promise<IService[]> {
        /* Get all services running in the server */
        return Service.find({ server: this._id, status: "active" });
    }

    async canFitService(this: ServerDocument, service: IService): Promise<boolean> {
        /* Get current available resources from server */
        /* Check if service can fit in the server */
        console.warn("Method not implemented. -> server :: canFitService");
        return true;
    }

    async allocateService(this: ServerDocument, service: IService): Promise<boolean> {
        /* Allocate service resources in the server */
        console.warn("Method not implemented. -> server :: allocateService");
        return true;
    }

    async deallocateService(this: ServerDocument, service: IService): Promise<boolean> {
        /* Deallocate service resources in the server */
        console.warn("Method not implemented. -> server :: deallocateService");
        return true;
    }
}

ServerSchema.loadClass(Server);
export default model<ServerDocument>('Server', ServerSchema);
export { ServerSchema };