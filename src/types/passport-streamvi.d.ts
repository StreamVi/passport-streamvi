declare module 'passport-streamvi' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';
  import { Request } from 'express';

  export interface StreamViStrategyOptions {
    projectID?: string;
    clientSecret: string;
    callbackURL: string;
    clientID: string;
  }

  export interface StreamViTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }

  export interface StreamViUser {
    accessToken: string;
  }

  export class StreamViStrategy extends OAuth2Strategy {
    constructor(options: Omit<StreamViStrategyOptions, 'authorizationURL' | 'tokenURL'>, verify?: (token: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => void);
    authenticate(req: Request, options?: object): Promise<void>;
    getAccessToken(authorizationCode: string): Promise<string>;
  }
} 