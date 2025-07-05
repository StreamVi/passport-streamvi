declare module 'passport-streamvi' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';
  import { Request } from 'express';

  export interface StreamViStrategyOptions {
    projectID?: string;
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    pkce?: boolean;
    state?: boolean;
  }

  export interface StreamViTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }

  export interface StreamViProfile {
    id: string;
    username: string;
    displayName: string;
    emails?: Array<{ value: string; type?: string }>;
    photos?: Array<{ value: string; type?: string }>;
  }

  export interface StreamViUser {
    accessToken: string;
    refreshToken?: string;
    profile?: StreamViProfile;
  }

  export class StreamViStrategy extends OAuth2Strategy {
    constructor(
      options: Omit<StreamViStrategyOptions, 'authorizationURL' | 'tokenURL'>,
      verify: (accessToken: string, refreshToken: string, profile: StreamViProfile, done: (error: any, user?: StreamViUser) => void) => void,
    );
    authenticate(req: Request, options?: object): Promise<void>;
    getAccessToken(authorizationCode: string): Promise<string>;
  }
}
