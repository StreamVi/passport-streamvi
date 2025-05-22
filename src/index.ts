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

  authenticate(req: Request, options?: any): void {
    const authorizationCode = req.query.code as string;
    this._projectID = (req.query.project_id as string) || '';
    
    if (!authorizationCode) {
      return super.authenticate(req, options);
    }
    
    this.getAccessToken(authorizationCode)
      .then((accessToken) => {
        // Adding projectId to user object
        const user: StreamViUser = { 
          accessToken,
          projectId: this._projectID 
        };
        this.success(user);
      })
      .catch((error) => {
        this.fail(`Failed to exchange authorization code: ${error}`);
      });
  }

  async getAccessToken(authorizationCode: string): Promise<string> {
    
    // Preparing request parameters in the correct format
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this._clientID);
    params.append('client_secret', this._clientSecret);
    params.append('redirect_uri', this._callbackURL);
    params.append('code', authorizationCode);
    params.append('project_id', this._projectID);
    
    try {
      
      // Sending request with correct headers and parameters as in the working example
      const response = await axios.post<StreamViTokenResponse>(
        this._tokenURL, 
        params.toString(), // Converting URLSearchParams to string
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            // Removing 'Accept' header that's not in the working example
          }
        }
      );
      if (response.data && response.data.access_token) {
        return response.data.access_token;
      }

      throw new Error(`No access token in response. Response data: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }
}

export * from './types'; 