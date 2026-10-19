import axios from 'axios';
import { Request } from 'express';
import { Strategy as OAuth2Strategy, VerifyFunction } from 'passport-oauth2';
import { StreamViStrategyOptions, StreamViTokenResponse, StreamViUser } from './types';

const authorizationURL = 'https://streamvi.io/cabinet/oauth';
const tokenURL = 'https://api-v2.streamvi.io/site/oauth/token';

type StateCallback = (error: Error | null, verified?: boolean | string) => void;
interface StateMetadata {
  authorizationURL: string;
  tokenURL: string;
  clientID: string;
  callbackURL: string;
}
interface StateStore {
  verify(request: Request, state: unknown, ...args: [StateCallback] | [StateMetadata, StateCallback]): void;
}

export class StreamViStrategy extends OAuth2Strategy {
  private _clientSecret: string;
  private _tokenURL: string;
  private _clientID: string;
  private _projectID: string;
  private _callbackURL: string;
  private _pkceEnabled: boolean;

  constructor(options: Omit<StreamViStrategyOptions, 'authorizationURL' | 'tokenURL'>, verify?: VerifyFunction) {
    super({ ...options, authorizationURL, tokenURL }, verify || ((): void => {}));

    this.name = 'streamvi';

    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._projectID = options.projectID || '';
    this._tokenURL = tokenURL;
    this._clientID = options.clientID;
    this._pkceEnabled = !!options.pkce;
  }

  authenticate(req: Request, options?: any): void {
    const authorizationCode = req.query.code;
    if (req.query.error || !authorizationCode) {
      return super.authenticate(req, options);
    }
    if (typeof authorizationCode !== 'string') {
      this.fail({ message: 'Invalid authorization code.' }, 400);
      return;
    }
    this._projectID = typeof req.query.project_id === 'string' ? req.query.project_id : '';
    const stateStore = (this as unknown as { _stateStore: StateStore })._stateStore;
    const state = req.query.state || req.body?.state;
    let completed = false;
    const verified: StateCallback = (error, result): void => {
      if (completed) return;
      completed = true;
      if (error) {
        this.error(error);
        return;
      }
      if (!result || (this._pkceEnabled && typeof result !== 'string')) {
        this.fail({ message: 'Invalid authorization request state.' }, 403);
        return;
      }
      // The store may be asynchronous. Exchange only after successful verification.
      this.getAccessToken(authorizationCode, typeof result === 'string' ? result : undefined)
        .then((tokenResponse) => {
          const user: StreamViUser = {
            accessToken: tokenResponse.access_token,
            projectId: tokenResponse.projectID || this._projectID,
            projectExternalId: tokenResponse.projectExternalID || '',
          };
          this.success(user);
        })
        .catch(() => {
          this.fail({ message: 'Failed to exchange authorization code.' });
        });
    };
    try {
      if (stateStore.verify.length === 4) {
        stateStore.verify(
          req,
          state,
          {
            authorizationURL,
            tokenURL,
            clientID: this._clientID,
            callbackURL: this._callbackURL,
          },
          verified,
        );
      } else {
        stateStore.verify(req, state, verified);
      }
    } catch (error) {
      verified(error instanceof Error ? error : new Error('Failed to verify authorization request state.'));
    }
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
