declare global {
    namespace NodeJS {
      interface ProcessEnv {
        MONGO: string;
        PORT: string;
        JWT_SECRET: string;
        SERVICES_MARKUP_RATE: string; // Float as string
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}