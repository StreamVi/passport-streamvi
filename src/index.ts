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
  private _pkceEnabled: boolean;

  constructor(options: Omit<StreamViStrategyOptions, 'authorizationURL' | 'tokenURL'>, verify?: VerifyFunction) {
    options.projectID = options.projectID || '';

    // Прокидываем pkce и state, если они заданы
    const { pkce, state, ...rest } = options as any;
    const strategyOptions = { ...rest, authorizationURL, tokenURL };
    if (typeof pkce !== 'undefined') strategyOptions.pkce = pkce;
    if (typeof state !== 'undefined') strategyOptions.state = state;

    super(strategyOptions, verify || ((): void => {}));

    this.name = 'streamvi';

    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._projectID = options.projectID || '';
    this._tokenURL = tokenURL;
    this._clientID = options.clientID;
    this._pkceEnabled = !!pkce;
  }

  authenticate(req: Request, options?: any): void {
    const authorizationCode = req.query.code as string;
    this._projectID = (req.query.project_id as string) || '';

    if (!authorizationCode) {
      return super.authenticate(req, options);
    }

    let code_verify = '';
    if (this._pkceEnabled) {
      const stateStore = (this as any)._stateStore;
      const state = (req.query && req.query.state) || (req.body && req.body.state);
      stateStore.verify(req, state, (err: any, ok: any) => {
        if (err) {
          this.fail(`Failed to verify code: ${err}`);
        } else {
          code_verify = ok;
        }
      });
    }

    this.getAccessToken(authorizationCode, code_verify)
      .then((tokenResponse) => {
        // Adding projectId to user object
        const user: StreamViUser = {
          accessToken: tokenResponse.access_token,
          projectId: tokenResponse.projectID || this._projectID,
          projectExternalId: tokenResponse.projectExternalID || '',
        };
        this.success(user);
      })
      .catch((error) => {
        this.fail(`Failed to exchange authorization code: ${error}`);
      });
  }

  async getAccessToken(authorizationCode: string, codeVerifier?: string): Promise<{ access_token: string; projectID: string; projectExternalID: string }> {
    // Preparing request parameters in the correct format
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this._clientID);
    params.append('client_secret', this._clientSecret);
    params.append('redirect_uri', this._callbackURL);
    params.append('code', authorizationCode);
    params.append('project_id', this._projectID);

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    try {
      // Sending request with correct headers and parameters as in the working example
      const response = await axios.post<StreamViTokenResponse>(
        this._tokenURL,
        params.toString(), // Converting URLSearchParams to string
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Removing 'Accept' header that's not in the working example
          },
        },
      );
      if (response.data && response.data.access_token) {
        return {
          access_token: response.data.access_token,
          projectID: response.data.project_id || '',
          projectExternalID: response.data.project_external_id || '',
        };
      }

      throw new Error(`No access token in response. Response data: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }
}

export * from './types';
