import { GraphQLClient, gql } from 'graphql-request';
import { OcvClientOptions } from './index';
import { ContextShard, CreateShardInput, ShardWithContent, UpdateShardInput } from './types';

/**
 * Client for context management
 */
export class ContextClient {
  private client: GraphQLClient;
  private options: OcvClientOptions;
  
  /**
   * Create a new context client
   */
  constructor(client: GraphQLClient, options: OcvClientOptions) {
    this.client = client;
    this.options = options;
  }
  
  /**
   * Get a context shard by ID
   */
  async getShard(id: string): Promise<ContextShard | null> {
    const query = gql`
      query GetContextShard($id: ID!) {
        contextShard(id: $id) {
          id
          userId
          domain
          contentType
          vectorRepresentation
          metadata
          createdAt
          updatedAt
          version
        }
      }
    `;
    
    const response = await this.client.request<{ contextShard: ContextShard | null }>(query, { id });
    return response.contextShard;
  }
  
  /**
   * Get a context shard with decrypted content
   */
  async getShardWithContent(id: string): Promise<ShardWithContent | null> {
    const query = gql`
      query GetContextShardWithContent($id: ID!) {
        contextShardWithContent(id: $id) {
          shard {
            id
            userId
            domain
            contentType
            vectorRepresentation
            metadata
            createdAt
            updatedAt
            version
          }
          content
        }
      }
    `;
    
    const response = await this.client.request<{ contextShardWithContent: ShardWithContent | null }>(query, { id });
    return response.contextShardWithContent;
  }
  
  /**
   * Search for context shards
   */
  async searchShards(
    userId: string,
    query: string,
    domain?: string,
    limit?: number,
  ): Promise<ContextShard[]> {
    const gqlQuery = gql`
      query SearchShards($userId: ID!, $query: String!, $domain: String, $limit: Int) {
        searchShards(userId: $userId, query: $query, domain: $domain, limit: $limit) {
          id
          userId
          domain
          contentType
          vectorRepresentation
          metadata
          createdAt
          updatedAt
          version
        }
      }
    `;
    
    const response = await this.client.request<{ searchShards: ContextShard[] }>(gqlQuery, {
      userId,
      query,
      domain,
      limit,
    });
    
    return response.searchShards;
  }
  
  /**
   * Get all shards for a specific domain
   */
  async getShardsByDomain(
    userId: string,
    domain: string,
    limit?: number,
  ): Promise<ContextShard[]> {
    const query = gql`
      query ShardsByDomain($userId: ID!, $domain: String!, $limit: Int) {
        shardsByDomain(userId: $userId, domain: $domain, limit: $limit) {
          id
          userId
          domain
          contentType
          vectorRepresentation
          metadata
          createdAt
          updatedAt
          version
        }
      }
    `;
    
    const response = await this.client.request<{ shardsByDomain: ContextShard[] }>(query, {
      userId,
      domain,
      limit,
    });
    
    return response.shardsByDomain;
  }
  
  /**
   * Create a new context shard
   */
  async createShard(input: CreateShardInput): Promise<ContextShard> {
    const mutation = gql`
      mutation CreateShard($input: GraphQLCreateShardInput!) {
        createShard(input: $input) {
          id
          userId
          domain
          contentType
          vectorRepresentation
          metadata
          createdAt
          updatedAt
          version
        }
      }
    `;
    
    const response = await this.client.request<{ createShard: ContextShard }>(mutation, { input });
    return response.createShard;
  }
  
  /**
   * Update an existing context shard
   */
  async updateShard(id: string, input: UpdateShardInput): Promise<ContextShard | null> {
    const mutation = gql`
      mutation UpdateShard($id: ID!, $input: GraphQLUpdateShardInput!) {
        updateShard(id: $id, input: $input) {
          id
          userId
          domain
          contentType
          vectorRepresentation
          metadata
          createdAt
          updatedAt
          version
        }
      }
    `;
    
    const response = await this.client.request<{ updateShard: ContextShard | null }>(mutation, {
      id,
      input,
    });
    
    return response.updateShard;
  }
  
  /**
   * Delete a context shard
   */
  async deleteShard(id: string): Promise<boolean> {
    const mutation = gql`
      mutation DeleteShard($id: ID!) {
        deleteShard(id: $id)
      }
    `;
    
    const response = await this.client.request<{ deleteShard: boolean }>(mutation, { id });
    return response.deleteShard;
  }
}
