import { GraphQLClient } from 'graphql-request';
import { ContextClient } from './context';
import { ConsentClient } from './consent';
import { IdentityClient } from './identity';

export interface OcvClientOptions {
  /**
   * GraphQL API endpoint URL
   */
  endpoint: string;
  
  /**
   * Optional auth token
   */
  token?: string;
  
  /**
   * Client ID for consent management
   */
  clientId: string;
}

/**
 * Main client for Open Context Vault
 */
export class OcvClient {
  private client: GraphQLClient;
  private options: OcvClientOptions;
  
  /**
   * Context management client
   */
  public context: ContextClient;
  
  /**
   * Consent management client
   */
  public consent: ConsentClient;
  
  /**
   * Identity management client
   */
  public identity: IdentityClient;
  
  /**
   * Create a new OCV client
   */
  constructor(options: OcvClientOptions) {
    this.options = options;
    
    this.client = new GraphQLClient(options.endpoint, {
      headers: options.token 
        ? { Authorization: `Bearer ${options.token}` } 
        : {},
    });
    
    this.context = new ContextClient(this.client, options);
    this.consent = new ConsentClient(this.client, options);
    this.identity = new IdentityClient(this.client, options);
  }
  
  /**
   * Set the auth token
   */
  setToken(token: string): void {
    this.options.token = token;
    this.client.setHeader('Authorization', `Bearer ${token}`);
  }
  
  /**
   * Clear the auth token
   */
  clearToken(): void {
    this.options.token = undefined;
    this.client.setHeader('Authorization', '');
  }
}

// Export everything
export * from './types';
export * from './context';
export * from './consent';
export * from './identity';
