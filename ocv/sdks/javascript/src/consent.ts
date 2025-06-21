import { GraphQLClient, gql } from 'graphql-request';
import { OcvClientOptions } from './index';
import { AccessGrant, ConsentAuditLog, GrantAccessInput } from './types';

/**
 * Client for consent management
 */
export class ConsentClient {
  private client: GraphQLClient;
  private options: OcvClientOptions;
  
  /**
   * Create a new consent client
   */
  constructor(client: GraphQLClient, options: OcvClientOptions) {
    this.client = client;
    this.options = options;
  }
  
  /**
   * Get all active grants for a user
   */
  async getActiveGrants(userId: string): Promise<AccessGrant[]> {
    const query = gql`
      query ActiveGrants($userId: ID!) {
        activeGrants(userId: $userId) {
          id
          userId
          clientId
          scopes
          contextDomains
          expiresAt
          createdAt
        }
      }
    `;
    
    const response = await this.client.request<{ activeGrants: AccessGrant[] }>(query, { userId });
    return response.activeGrants;
  }
  
  /**
   * Check if a client has access to a specific domain
   */
  async checkAccess(
    userId: string,
    clientId: string,
    domain: string,
    scope: string,
  ): Promise<boolean> {
    const query = gql`
      query CheckAccess($userId: ID!, $clientId: String!, $domain: String!, $scope: String!) {
        checkAccess(userId: $userId, clientId: $clientId, domain: $domain, scope: $scope)
      }
    `;
    
    const response = await this.client.request<{ checkAccess: boolean }>(query, {
      userId,
      clientId,
      domain,
      scope,
    });
    
    return response.checkAccess;
  }
  
  /**
   * Get audit logs for a user
   */
  async getAuditLogs(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ConsentAuditLog[]> {
    const query = gql`
      query AuditLogs($userId: ID!, $limit: Int, $offset: Int) {
        auditLogs(userId: $userId, limit: $limit, offset: $offset) {
          id
          userId
          clientId
          action
          details
          timestamp
        }
      }
    `;
    
    const response = await this.client.request<{ auditLogs: ConsentAuditLog[] }>(query, {
      userId,
      limit,
      offset,
    });
    
    return response.auditLogs;
  }
  
  /**
   * Grant access to a client
   */
  async grantAccess(input: GrantAccessInput): Promise<AccessGrant> {
    const mutation = gql`
      mutation GrantAccess($input: GraphQLGrantAccessInput!) {
        grantAccess(input: $input) {
          id
          userId
          clientId
          scopes
          contextDomains
          expiresAt
          createdAt
        }
      }
    `;
    
    const response = await this.client.request<{ grantAccess: AccessGrant }>(mutation, { input });
    return response.grantAccess;
  }
  
  /**
   * Revoke an access grant
   */
  async revokeAccess(
    grantId: string,
    userId: string,
    clientId: string,
  ): Promise<boolean> {
    const mutation = gql`
      mutation RevokeAccess($grantId: ID!, $userId: ID!, $clientId: String!) {
        revokeAccess(grantId: $grantId, userId: $userId, clientId: $clientId)
      }
    `;
    
    const response = await this.client.request<{ revokeAccess: boolean }>(mutation, {
      grantId,
      userId,
      clientId,
    });
    
    return response.revokeAccess;
  }
}
