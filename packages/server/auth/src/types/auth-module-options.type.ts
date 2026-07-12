export interface AuthModuleOptions {
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  otpSecret: string;
  mail: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    secure?: boolean;
  };
}
