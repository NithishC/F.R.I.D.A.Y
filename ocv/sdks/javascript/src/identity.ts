import { GraphQLClient, gql } from 'graphql-request';
import { OcvClientOptions } from './index';
import { AuthToken, CreateUserInput, Credentials, User } from './types';

/**
 * Client for identity management
 */
export class IdentityClient {
  private client: GraphQLClient;
  private options: OcvClientOptions;
  
  /**
   * Create a new identity client
   */
  constructor(client: GraphQLClient, options: OcvClientOptions) {
    this.client = client;
    this.options = options;
  }
  
  /**
   * Get the current user from JWT token
   */
  async me(token: string): Promise<User | null> {
    const query = gql`
      query Me($token: String!) {
        me(token: $token) {
          id
          email
          displayName
          createdAt
          updatedAt
        }
      }
    `;
    
    const response = await this.client.request<{ me: User | null }>(query, { token });
    return response.me;
  }
  
  /**
   * Get a user by ID
   */
  async getUser(id: string): Promise<User | null> {
    const query = gql`
      query User($id: ID!) {
        user(id: $id) {
          id
          email
          displayName
          createdAt
          updatedAt
        }
      }
    `;
    
    const response = await this.client.request<{ user: User | null }>(query, { id });
    return response.user;
  }
  
  /**
   * Register a new user
   */
  async register(input: CreateUserInput): Promise<User> {
    const mutation = gql`
      mutation Register($input: GraphQLCreateUserInput!) {
        register(input: $input) {
          id
          email
          displayName
          createdAt
          updatedAt
        }
      }
    `;
    
    const response = await this.client.request<{ register: User }>(mutation, { input });
    return response.register;
  }
  
  /**
   * Login with email and password
   */
  async login(credentials: Credentials): Promise<AuthToken | null> {
    const mutation = gql`
      mutation Login($credentials: GraphQLCredentials!) {
        login(credentials: $credentials) {
          token
          expiresAt
          user {
            id
            email
            displayName
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    const response = await this.client.request<{ login: AuthToken | null }>(mutation, { credentials });
    return response.login;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(
    id: string,
    displayName?: string,
  ): Promise<User | null> {
    const mutation = gql`
      mutation UpdateProfile($id: ID!, $displayName: String) {
        updateProfile(id: $id, displayName: $displayName) {
          id
          email
          displayName
          createdAt
          updatedAt
        }
      }
    `;
    
    const response = await this.client.request<{ updateProfile: User | null }>(mutation, {
      id,
      displayName,
    });
    
    return response.updateProfile;
  }
}
