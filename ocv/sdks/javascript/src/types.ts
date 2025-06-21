/**
 * Common types used throughout the SDK
 */

/**
 * Context shard
 */
export interface ContextShard {
  id: string;
  userId: string;
  domain: string;
  contentType: string;
  vectorRepresentation?: number[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Context shard with decrypted content
 */
export interface ShardWithContent {
  shard: ContextShard;
  content: any;
}

/**
 * Input for creating a new context shard
 */
export interface CreateShardInput {
  userId: string;
  domain: string;
  contentType: string;
  vectorRepresentation?: number[];
  metadata: Record<string, any>;
  content: any;
}

/**
 * Input for updating an existing context shard
 */
export interface UpdateShardInput {
  domain?: string;
  contentType?: string;
  vectorRepresentation?: number[];
  metadata?: Record<string, any>;
  content?: any;
  currentVersion: number;
}

/**
 * Access grant
 */
export interface AccessGrant {
  id: string;
  userId: string;
  clientId: string;
  scopes: string[];
  contextDomains: string[];
  expiresAt?: string;
  createdAt: string;
}

/**
 * Input for granting access
 */
export interface GrantAccessInput {
  userId: string;
  clientId: string;
  scopes: string[];
  contextDomains: string[];
  expiresAt?: string;
}

/**
 * Consent audit log entry
 */
export interface ConsentAuditLog {
  id: string;
  userId: string;
  clientId: string;
  action: string;
  details: any;
  timestamp: string;
}

/**
 * User
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth token
 */
export interface AuthToken {
  token: string;
  expiresAt: string;
  user: User;
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
}

/**
 * Input for authentication
 */
export interface Credentials {
  email: string;
  password: string;
}
