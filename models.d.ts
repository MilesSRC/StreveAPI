import type { ObjectId, Document } from "mongoose";

declare global {
    declare namespace Express {
        interface Request {
            user: Document<unknown, {}, IUser> & IUser & {
                _id: Types.ObjectId;
            }
        }
    }

    //
    // User Model
    //
    interface IUser {
        _id: ObjectId,

        name: string,
        email: string,
        id: string,
        password: string, /* SHA512 */
        role: 'admin' | 'user',

        createdAt: Date,
        updatedAt: Date,

        __v: number,

        save(): Promise<IUser>;
    }

    //
    // User Service Model
    //
    interface IService {
        /* Service Identifier Data */
        id: string,
        name: string,
    
        /* Linked User Data */
        user: ObjectId,
        pricing: SubscriptionCurrencyData,
    
        /* Hardware Information + VM Specs */
        server: ObjectId,
        serviceAddress: string,
        specs: {
            ram: number,
            cores: number,
            disk: number,
            bandwidth: number,
        }
    
        /* Service Status */
        status: 'active' | 'inactive' | 'suspended' | 'terminated' | 'installing' | 'pending' | 'cancelled',
        suspended: IServiceSuspension | null,
        createdAt: Date,
        updatedAt: Date,
        __v: number,
    }

    interface IServiceMethods {
        start(this: ServiceDocument): Promise<boolean>;
        stop(this: ServiceDocument): Promise<boolean>;
        suspend(this: ServiceDocument): Promise<boolean>;
        terminate(this: ServiceDocument): Promise<boolean>;
        isRunning(this: ServiceDocument): boolean;
        getServer(this: ServiceDocument): Promise<ServerDocument>;
        getIndividualCost(this: ServiceDocument): SubscriptionCurrencyData;
    }

    interface IServiceSuspension {
        suspensionStart: Date,
        suspensionEnd: Date,
        suspendedBy: ObjectId,
        suspendedFor: string,
    }

    //
    // Dedicated Server Model
    //
    interface IServer {
        _id: Types.ObjectId,
    
        name: string,
        address: string,
        port: number,
    
        provider: {
            name: string,
            url: string,
    
            apiEndpoint: string,
            machineId: string,
        }
    
        specs: {
            ram: number,
            cores: number,
            disk: number,
            bandwidth: number,
        },
    
        cost: SubscriptionCurrencyData,
    
        createdAt: Date,
        updatedAt: Date,
        __v: number,
    }
    
    interface IServerMethods {
        isAvailable(this: ServerDocument): Promise<boolean>;
        getServices(this: ServerDocument): Promise<IService[]>;
        canFitService(this: ServerDocument, service: IService): Promise<boolean>;
        allocateService(this: ServerDocument, service: IService): Promise<boolean>;
        deallocateService(this: ServerDocument, service: IService): Promise<boolean>;
    }

    type ServerDocument = Document & IServer & IServerMethods;

    type ServiceDocument = Document & IService & IServiceMethods;

    //
    // Currency
    //
    interface CurrencyData {
        price: number,
        currency: string,
        symbol: string,
    }

    interface SubscriptionCurrencyData extends CurrencyData {
        duration: {
            amount: number,
            unit: 'day' | 'week' | 'month' | 'year',
        },
        billingStart: Date
    }
}

export {};