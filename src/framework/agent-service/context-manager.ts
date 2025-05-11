/**
 * Context Management System
 */

import { v4 as uuidv4 } from 'uuid';
import * as LZString from 'lz-string';
import { Context } from '../types';

/**
 * Context Manager handles storing and retrieving context for agent interactions
 */
export class ContextManager {
  private contextStore: Map<string, Context> = new Map();
  private compressionEngine: CompressionEngine;
  
  constructor() {
    this.compressionEngine = new CompressionEngine();
  }
  
  async initialize(env: any): Promise<{ status: string }> {
    console.log('Initializing Context Manager...');
    
    // Load any persistent context
    await this.loadPersistentContext(env);
    
    return { status: 'success' };
  }
  
  async getContext(env: any, request: any): Promise<Context> {
    // Get relevant context for request
    const contextKey = this.generateContextKey(request);
    
    // Try to get from memory first
    if (this.contextStore.has(contextKey)) {
      return this.contextStore.get(contextKey)!;
    }
    
    // Try to get from KV
    try {
      const storedContext = await env.FRAMEWORK_KV?.get(`context:${contextKey}`);
      if (storedContext) {
        const context = JSON.parse(storedContext);
        
        // Decompress if needed
        if (context.metadata.compressionLevel > 0) {
          context.data = this.compressionEngine.decompress(context.data, context.metadata.compressionLevel);
        }
        
        this.contextStore.set(contextKey, context);
        return context;
      }
    } catch (error) {
      console.error(`Error getting context ${contextKey} from KV:`, error);
    }
    
    // Create new context if none exists
    const newContext = this.createInitialContext(request);
    this.contextStore.set(contextKey, newContext);
    
    return newContext;
  }
  
  async updateContext(env: any, request: any, response: any): Promise<Context> {
    // Update context with new information
    const contextKey = this.generateContextKey(request);
    const currentContext = this.contextStore.get(contextKey) || this.createInitialContext(request);
    
    // Extract relevant information from response
    const updatedContext = this.extractContextFromResponse(currentContext, response);
    
    // Compress context if needed
    const compressedContext = await this.compressionEngine.compressIfNeeded(updatedContext);
    
    // Store updated context in memory
    this.contextStore.set(contextKey, compressedContext);
    
    // Persist context if needed
    if (this.shouldPersistContext(contextKey)) {
      await this.persistContext(env, contextKey, compressedContext);
    }
    
    return compressedContext;
  }
  
  generateContextKey(request: any): string {
    // Generate a unique key based on session ID
    return request.sessionId || uuidv4();
  }
  
  createInitialContext(request: any): Context {
    return {
      id: uuidv4(),
      sessionId: request.sessionId || uuidv4(),
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      data: {
        interactions: [],
        userPreferences: {},
        knowledgeBase: {},
      },
      metadata: {
        compressionLevel: 0,
        originalSize: 0,
        compressedSize: 0,
      },
    };
  }
  
  extractContextFromResponse(currentContext: Context, response: any): Context {
    // Create a copy of the current context
    const updatedContext: Context = {
      ...currentContext,
      lastUpdated: new Date().toISOString(),
      data: { ...currentContext.data },
    };
    
    // Add the interaction to the context
    if (!updatedContext.data.interactions) {
      updatedContext.data.interactions = [];
    }
    
    updatedContext.data.interactions.push({
      timestamp: new Date().toISOString(),
      request: response.requestId,
      response: response.id,
      summary: this.generateInteractionSummary(response),
    });
    
    // Limit the number of interactions stored
    if (updatedContext.data.interactions.length > 10) {
      updatedContext.data.interactions = updatedContext.data.interactions.slice(-10);
    }
    
    return updatedContext;
  }
  
  generateInteractionSummary(response: any): string {
    // In a real implementation, this would generate a concise summary
    // of the interaction for efficient context storage
    return response.content.substring(0, 100) + (response.content.length > 100 ? '...' : '');
  }
  
  shouldPersistContext(contextKey: string): boolean {
    // In a real implementation, this would determine if the context
    // should be persisted based on importance, frequency, etc.
    return true;
  }
  
  async persistContext(env: any, contextKey: string, context: Context): Promise<void> {
    try {
      // Store in KV
      await env.FRAMEWORK_KV?.put(`context:${contextKey}`, JSON.stringify(context));
    } catch (error) {
      console.error(`Error persisting context ${contextKey}:`, error);
    }
  }
  
  async loadPersistentContext(env: any): Promise<void> {
    try {
      // In a real implementation, this would load frequently used contexts
      // or contexts that are likely to be needed soon
      
      // For now, we'll just log that we're ready
      console.log('Context Manager ready for context loading');
    } catch (error) {
      console.error('Error loading persistent context:', error);
    }
  }
}

/**
 * Compression Engine for efficient context storage
 */
class CompressionEngine {
  async compressIfNeeded(context: Context): Promise<Context> {
    // Check if compression is needed
    const contextDataStr = JSON.stringify(context.data);
    const originalSize = contextDataStr.length;
    
    // Only compress if the context is large enough to benefit
    if (originalSize < 1000) {
      return {
        ...context,
        metadata: {
          ...context.metadata,
          compressionLevel: 0,
          originalSize,
          compressedSize: originalSize,
        },
      };
    }
    
    // Compress the context data
    const compressedData = this.compress(context.data, 1);
    const compressedSize = JSON.stringify(compressedData).length;
    
    return {
      ...context,
      data: compressedData,
      metadata: {
        ...context.metadata,
        compressionLevel: 1,
        originalSize,
        compressedSize,
      },
    };
  }
  
  compress(data: any, level: number): any {
    if (level === 0) return data;
    
    // Convert to string
    const dataStr = JSON.stringify(data);
    
    // Compress using LZ-based compression
    return LZString.compress(dataStr);
  }
  
  decompress(data: any, level: number): any {
    if (level === 0) return data;
    
    // Decompress using LZ-based decompression
    const decompressed = LZString.decompress(data);
    
    // Parse back to object
    return JSON.parse(decompressed || '{}');
  }
}

// Export singleton instance
const contextManager = new ContextManager();
export const initialize = contextManager.initialize.bind(contextManager);
export const getContext = contextManager.getContext.bind(contextManager);
export const updateContext = contextManager.updateContext.bind(contextManager); 