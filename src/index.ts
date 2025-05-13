import axios from 'axios';
import { Request } from 'express';
import { Strategy as OAuth2Strategy, VerifyFunction } from 'passport-oauth2';
import { StreamViStrategyOptions, StreamViTokenResponse, StreamViUser } from './types';

const authorizationURL = 'https://streamvi.io/cabinet/oauth';
const tokenURL = 'https://api-v2.streamvi.io/site/oauth/token';

export class StreamViStrategy extends OAuth2Strategy {
  private _clientSecret: string;
  private _tokenURL: string;
  private _clientID: string;
  private _projectID: string;
  private _callbackURL: string;

  constructor(options: Omit<StreamViStrategyOptions, 'authorizationURL' | 'tokenURL'>, verify?: VerifyFunction) {
    options.projectID = options.projectID || '';

    super({ ...options, authorizationURL, tokenURL }, verify || ((): void => {}));

    this.name = 'streamvi';

    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._projectID = options.projectID || '';
    this._tokenURL = tokenURL;
    this._clientID = options.clientID;
  }

  async authenticate(req: Request, options?: object): Promise<void> {
    const authorizationCode = req.query.code as string;
    this._projectID = (req.query.group_id as string) || '';

    if (!authorizationCode) {
      return super.authenticate(req, options);
    }

    try {
      const accessToken = await this.getAccessToken(authorizationCode);
      const user: StreamViUser = { accessToken };
      this.success(user);
    } catch (error) {
      this.fail(`Failed to exchange authorization code: ${error}`);
    }
  }

  async getAccessToken(authorizationCode: string): Promise<string> {
    try {
      const response = await axios.get<StreamViTokenResponse>(this._tokenURL, {
        params: {
          grant_type: 'authorization_code',
          client_id: this._clientID,
          client_secret: this._clientSecret,
          redirect_uri: this._callbackURL,
          code: authorizationCode,
          project_id: this._projectID,
        },
      });

      if (response.data && response.data.access_token) {
        return response.data.access_token;
      }

      throw new Error(`No access token in response. Response data: ${JSON.stringify(response.data)}`);
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }
}

export * from './types';
