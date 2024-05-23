import { Schema, Types, model, type ObjectId } from "mongoose";
import Service from "./Service";
import axios from "axios";

/* Server Model */
const ServerSchema = new Schema<ServerDocument>({
    name: { type: String, required: true },
    address: { type: String, required: true },
    port: { type: Number, required: true },
    region: { type: String, required: true },
    series: { type: String, required: true },

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

    async getServices(this: ServerDocument): Promise<ServiceDocument[]> {
        /* Get all services running in the server */
        return Service.find({ server: this._id, status: "active" });
    }

    async canFitService(this: ServerDocument, service: ServiceDocument): Promise<boolean> {
        /* Get current available resources from server */
        /* Check if service can fit in the server */
        console.warn("Method not implemented. -> server :: canFitService");
        return true;
    }

    async allocateService(this: ServerDocument, service: ServiceDocument): Promise<boolean> {
        /* Let the server know to start building the service */
        const serverEndpoint = `${this.provider.url}:${this.port}/`;
        const serverKey = this.provider.machineId;

        await axios.post(`${serverEndpoint}/api/service`).catch(err => {
            console.error(`Server ${this.id} couldn't host service ${service.id}`);
            return false;
        });

        /* Update service status to "installing" when the server adknowledges the request  */
        service.status = "installing";
        await service.save();

        console.warn("Method not implemented. -> server :: allocateService");
        return true;
    }

    async deallocateService(this: ServerDocument, service: ServiceDocument): Promise<boolean> {
        /* Deallocate service resources in the server */
        console.warn("Method not implemented. -> server :: deallocateService");
        return true;
    }
}

ServerSchema.loadClass(Server);
export default model<ServerDocument>('Server', ServerSchema);
export { ServerSchema };