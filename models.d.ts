import type { ObjectId, Document } from "mongoose";

declare global {
    declare namespace Express {
        interface Request {
            user: UserDocument;
        }
    }

    //
    // User Model
    //
    interface IUser {
        _id: ObjectId,

        name: string,
        fullName: string,
        email: string,
        id: string,
        stripeId: string | null,
        password: string, /* SHA512 */
        role: 'admin' | 'user',

        createdAt: Date,
        updatedAt: Date,

        __v: number,

        save(): Promise<UserDocument>;
    }

    interface IUserMethods {
        sanitize(this: UserDocument): IUser;
        createStripeCustomer(this: UserDocument): Promise<void>;
    }

    type UserDocument = Document & IUser & IUserMethods;

    //
    // User Service Model
    //
    interface IService {
        /* Service Identifier Data */
        id: string,
        name: string,
        series: String,
        region: string,

        /* Linked User Data */
        user: ObjectId,
        pricing: SubscriptionCurrencyData,
        activeInvoice: ObjectId | null,
    
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
        region: string, // Datacenter Region (Shorthand, IE, 'us-east-1')
        series: string, // Server Series (IE, 'm5.large') - Used for hardware spec types
    
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

    //
    // Service Package Model
    //
    interface IServicePkg {
        name: string;
        id: string;
        description: string;
        regions: string[];
    
        serverSeries: string;
        packageSeries?: string;
    
        specs: {
            ram: number;
            cores: number;
            disk: number;
            bandwidth: number;
        };
    
        cost: {
            id: string;
            price: number;
            currency: string;
            symbol: string;
            days: number;
        };
    
        status: 'active' | 'inactive';
        expires?: Date;
    }

    interface IServicePkgMethods {
        isAvailable(this: ServicePkgDocument): Promise<boolean>;
        getServices(this: ServicePkgDocument): Promise<IService[]>;
        getServers(this: ServicePkgDocument): Promise<IServer[]>;
    }

    //
    // Invoice Model
    //
    interface IInvoice {
        id: string,
        user: ObjectId,
        pricing: SubscriptionCurrencyData,
        status: 'paid' | 'unpaid' | 'stale' | 'invalid' | 'cancelled',
    }

    interface IInvoiceMethods {
        $fetchStatus(this: InvoiceDocument): Promise<string>;
        fetchStatus(this: InvoiceDocument): Promise<string>;
    }

    type InvoiceDocument = Document & IInvoice & IInvoiceMethods;

    //
    // Mongoose Models
    //
    type ServicePackageDocument = Document & IServicePkg & IServicePkgMethods;
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

    //
    // Stripe Data
    //
    interface StripeCustomerData {
        id: string,
        object: 'customer',
        address: null,
        balance: number,
        created: number,
        currency: null,
        default_source: null,
        delinquent: boolean,
        description: null,
        discount: null,
        email: string,
        invoice_prefix: string,
        invoice_settings: {
            custom_fields: null,
            default_payment_method: null,
            footer: null,
            rendering_options: null
        },
        livemode: boolean,
        metadata: {},
        name: string,
        next_invoice_sequence: number,
        phone: null,
        preferred_locales: [],
        shipping: null,
        tax_exempt: 'none',
        test_clock: null,
    }

    interface StripeInvoiceCreationData {
        customer: string,
    }
}

export {};