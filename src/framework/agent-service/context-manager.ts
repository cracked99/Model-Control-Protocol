/**
 * Context Management System
 */

import { v4 as uuidv4 } from 'uuid';
import * as LZString from 'lz-string';
import { Context } from '../types';

/**
 * Memory Management System for organizing context information
 */
class MemoryManager {
  // Memory storage tiers
  private shortTermMemory: Map<string, any> = new Map();
  private workingMemory: Map<string, any> = new Map();
  private longTermMemory: Map<string, any> = new Map();
  
  constructor() {
    // Initialize memory systems
  }
  
  storeInShortTerm(key: string, data: any): void {
    this.shortTermMemory.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
    
    // Enforce short-term memory limits
    this.enforceMemoryLimits('shortTerm', 20);
  }
  
  storeInWorkingMemory(key: string, data: any): void {
    this.workingMemory.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
    
    // Enforce working memory limits
    this.enforceMemoryLimits('working', 50);
  }
  
  storeInLongTermMemory(key: string, data: any): void {
    this.longTermMemory.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
    
    // Enforce long-term memory limits
    this.enforceMemoryLimits('longTerm', 100);
  }
  
  retrieveMemory(key: string): any {
    // Try short-term first
    if (this.shortTermMemory.has(key)) {
      const memory = this.shortTermMemory.get(key);
      memory.accessCount++;
      return memory.data;
    }
    
    // Try working memory next
    if (this.workingMemory.has(key)) {
      const memory = this.workingMemory.get(key);
      memory.accessCount++;
      
      // Promote frequently accessed memories to short-term
      if (memory.accessCount > 5) {
        this.storeInShortTerm(key, memory.data);
      }
      
      return memory.data;
    }
    
    // Try long-term memory last
    if (this.longTermMemory.has(key)) {
      const memory = this.longTermMemory.get(key);
      memory.accessCount++;
      
      // Promote frequently accessed memories to working memory
      if (memory.accessCount > 3) {
        this.storeInWorkingMemory(key, memory.data);
      }
      
      return memory.data;
    }
    
    return null;
  }
  
  private enforceMemoryLimits(memoryType: string, limit: number): void {
    let targetMemory: Map<string, any>;
    
    switch (memoryType) {
      case 'shortTerm':
        targetMemory = this.shortTermMemory;
        break;
      case 'working':
        targetMemory = this.workingMemory;
        break;
      case 'longTerm':
        targetMemory = this.longTermMemory;
        break;
      default:
        return;
    }
    
    if (targetMemory.size <= limit) return;
    
    // Sort by least recently accessed and lowest access count
    const entries = Array.from(targetMemory.entries())
      .sort((a, b) => {
        // First by access count (ascending)
        const accessDiff = a[1].accessCount - b[1].accessCount;
        if (accessDiff !== 0) return accessDiff;
        
        // Then by timestamp (oldest first)
        return a[1].timestamp - b[1].timestamp;
      });
    
    // Remove oldest entries until we're under the limit
    const entriesToRemove = entries.slice(0, targetMemory.size - limit);
    for (const [key] of entriesToRemove) {
      targetMemory.delete(key);
    }
  }
  
  getAllMemories(): { shortTerm: any[], working: any[], longTerm: any[] } {
    return {
      shortTerm: Array.from(this.shortTermMemory.entries()),
      working: Array.from(this.workingMemory.entries()),
      longTerm: Array.from(this.longTermMemory.entries())
    };
  }
}

/**
 * Context Summarization Engine for creating concise context representations
 */
class SummarizationEngine {
  summarizeInteraction(request: any, response: any): string {
    // Extract key information from the interaction
    const requestType = this.classifyRequest(request.content);
    const responseType = this.classifyResponse(response.content);
    
    // Generate a concise summary
    return `${requestType} request received a ${responseType} response`;
  }
  
  summarizeContext(context: Context): string {
    if (!context.data.interactions || context.data.interactions.length === 0) {
      return "No previous interactions";
    }
    
    // Count interaction types
    const interactionCount = context.data.interactions.length;
    
    // Extract key information
    const keyTopics = this.extractKeyTopics(context.data.interactions);
    const userPreferences = this.extractUserPreferences(context.data);
    
    // Generate summary
    let summary = `Session with ${interactionCount} interactions`;
    
    if (keyTopics.length > 0) {
      summary += ` discussing ${keyTopics.join(", ")}`;
    }
    
    if (Object.keys(userPreferences).length > 0) {
      summary += `. User preferences: ${JSON.stringify(userPreferences)}`;
    }
    
    return summary;
  }
  
  private classifyRequest(content: string): string {
    // Simple classification based on keywords
    if (content.includes("help") || content.includes("?")) return "assistance";
    if (content.includes("create") || content.includes("make")) return "creation";
    if (content.includes("update") || content.includes("change")) return "modification";
    if (content.includes("delete") || content.includes("remove")) return "deletion";
    return "general";
  }
  
  private classifyResponse(content: string): string {
    // Simple classification based on response characteristics
    if (content.includes("error") || content.includes("cannot")) return "error";
    if (content.includes("success") || content.includes("completed")) return "success";
    if (content.includes("here's how") || content.includes("steps")) return "instructional";
    return "informational";
  }
  
  private extractKeyTopics(interactions: any[]): string[] {
    // In a real implementation, this would use NLP to extract key topics
    // For now, we'll just return a placeholder
    return ["framework", "development"];
  }
  
  private extractUserPreferences(contextData: any): Record<string, any> {
    return contextData.userPreferences || {};
  }
}

/**
 * Context Manager handles storing and retrieving context for agent interactions
 */
export class ContextManager {
  private contextStore: Map<string, Context> = new Map();
  private compressionEngine: CompressionEngine;
  private memoryManager: MemoryManager;
  private summarizationEngine: SummarizationEngine;
  
  constructor() {
    this.compressionEngine = new CompressionEngine();
    this.memoryManager = new MemoryManager();
    this.summarizationEngine = new SummarizationEngine();
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
    
    // Try to get from memory manager
    const memoryContext = this.memoryManager.retrieveMemory(`context:${contextKey}`);
    if (memoryContext) {
      this.contextStore.set(contextKey, memoryContext);
      return memoryContext;
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
        
        // Store in memory manager for faster access next time
        this.memoryManager.storeInWorkingMemory(`context:${contextKey}`, context);
        
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
    const updatedContext = this.extractContextFromResponse(currentContext, request, response);
    
    // Generate context summary
    updatedContext.metadata.summary = this.summarizationEngine.summarizeContext(updatedContext);
    
    // Compress context if needed
    const compressedContext = await this.compressionEngine.compressIfNeeded(updatedContext);
    
    // Store updated context in memory
    this.contextStore.set(contextKey, compressedContext);
    
    // Store in appropriate memory tier based on recency and importance
    const isRecentInteraction = Date.now() - new Date(updatedContext.lastUpdated).getTime() < 3600000; // 1 hour
    const isImportantInteraction = this.isImportantInteraction(request, response);
    
    if (isRecentInteraction && isImportantInteraction) {
      this.memoryManager.storeInShortTerm(`context:${contextKey}`, compressedContext);
    } else if (isRecentInteraction || isImportantInteraction) {
      this.memoryManager.storeInWorkingMemory(`context:${contextKey}`, compressedContext);
    } else {
      this.memoryManager.storeInLongTermMemory(`context:${contextKey}`, compressedContext);
    }
    
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
        entityRecognition: {},
      },
      metadata: {
        compressionLevel: 0,
        originalSize: 0,
        compressedSize: 0,
        summary: "New context created",
      },
    };
  }
  
  extractContextFromResponse(currentContext: Context, request: any, response: any): Context {
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
    
    // Generate interaction summary
    const interactionSummary = this.summarizationEngine.summarizeInteraction(request, response);
    
    updatedContext.data.interactions.push({
      timestamp: new Date().toISOString(),
      request: response.requestId,
      response: response.id,
      summary: interactionSummary,
    });
    
    // Extract and update user preferences
    this.updateUserPreferences(updatedContext, request, response);
    
    // Update knowledge base with any new information
    this.updateKnowledgeBase(updatedContext, request, response);
    
    // Update entity recognition
    this.updateEntityRecognition(updatedContext, request, response);
    
    // Limit the number of interactions stored
    if (updatedContext.data.interactions.length > 20) {
      // Keep the first 5 (initial context) and the last 15 (recent interactions)
      const initialInteractions = updatedContext.data.interactions.slice(0, 5);
      const recentInteractions = updatedContext.data.interactions.slice(-15);
      updatedContext.data.interactions = [...initialInteractions, ...recentInteractions];
    }
    
    return updatedContext;
  }
  
  private updateUserPreferences(context: Context, request: any, response: any): void {
    // In a real implementation, this would extract user preferences
    // from the request and response
    if (!context.data.userPreferences) {
      context.data.userPreferences = {};
    }
    
    // Example: Extract preferred format if mentioned
    if (request.content.includes("in JSON format")) {
      context.data.userPreferences.preferredFormat = "JSON";
    } else if (request.content.includes("in markdown")) {
      context.data.userPreferences.preferredFormat = "markdown";
    }
  }
  
  private updateKnowledgeBase(context: Context, request: any, response: any): void {
    // In a real implementation, this would extract key information
    // and store it in the knowledge base
    if (!context.data.knowledgeBase) {
      context.data.knowledgeBase = {};
    }
    
    // Example: Extract framework-related information
    if (request.content.includes("framework") || response.content.includes("framework")) {
      context.data.knowledgeBase.frameworkDiscussed = true;
    }
  }
  
  private updateEntityRecognition(context: Context, request: any, response: any): void {
    // In a real implementation, this would use NER to extract entities
    if (!context.data.entityRecognition) {
      context.data.entityRecognition = {};
    }
    
    // Simple entity extraction (in a real system, this would use NLP)
    const combinedText = request.content + " " + response.content;
    
    // Extract potential entities (very simplified)
    const potentialEntities = combinedText.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
    
    for (const entity of potentialEntities) {
      if (!context.data.entityRecognition[entity]) {
        context.data.entityRecognition[entity] = 1;
      } else {
        context.data.entityRecognition[entity]++;
      }
    }
  }
  
  isImportantInteraction(request: any, response: any): boolean {
    // Determine if an interaction is important enough to keep in short-term memory
    // In a real implementation, this would use more sophisticated heuristics
    
    // Check for error responses
    if (response.content.includes("error") || response.content.includes("failed")) {
      return true;
    }
    
    // Check for important requests
    if (request.content.includes("important") || request.content.includes("critical")) {
      return true;
    }
    
    // Check for long interactions (indicating complexity)
    if (request.content.length > 200 || response.content.length > 500) {
      return true;
    }
    
    return false;
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
  
  async getContextSummary(env: any, sessionId: string): Promise<string> {
    const context = await this.getContext(env, { sessionId });
    return context.metadata.summary || "No summary available";
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
    
    // Determine compression level based on size
    let compressionLevel = 1;
    if (originalSize > 10000) compressionLevel = 2;
    if (originalSize > 50000) compressionLevel = 3;
    
    // Compress the context data
    const compressedData = this.compress(context.data, compressionLevel);
    const compressedSize = JSON.stringify(compressedData).length;
    
    // Only use compression if it actually reduces size
    if (compressedSize >= originalSize) {
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
    
    return {
      ...context,
      data: compressedData,
      metadata: {
        ...context.metadata,
        compressionLevel,
        originalSize,
        compressedSize,
      },
    };
  }
  
  compress(data: any, level: number): any {
    if (level === 0) return data;
    
    // Convert to string
    const dataStr = JSON.stringify(data);
    
    // Apply different compression techniques based on level
    switch (level) {
      case 1:
        // Basic LZ compression
        return LZString.compress(dataStr);
      case 2:
        // UTF16 compression (better for longer texts)
        return LZString.compressToUTF16(dataStr);
      case 3:
        // URI-safe compression (maximum compression)
        return LZString.compressToEncodedURIComponent(dataStr);
      default:
        return LZString.compress(dataStr);
    }
  }
  
  decompress(data: any, level: number): any {
    if (level === 0) return data;
    
    let decompressed;
    
    // Apply corresponding decompression technique
    switch (level) {
      case 1:
        decompressed = LZString.decompress(data);
        break;
      case 2:
        decompressed = LZString.decompressFromUTF16(data);
        break;
      case 3:
        decompressed = LZString.decompressFromEncodedURIComponent(data);
        break;
      default:
        decompressed = LZString.decompress(data);
    }
    
    // Parse back to object
    try {
      return JSON.parse(decompressed || '{}');
    } catch (e) {
      console.error('Error parsing decompressed data:', e);
      return {};
    }
  }
}

// Export singleton instance
const contextManager = new ContextManager();
export const initialize = contextManager.initialize.bind(contextManager);
export const getContext = contextManager.getContext.bind(contextManager);
export const updateContext = contextManager.updateContext.bind(contextManager);
export const getContextSummary = contextManager.getContextSummary.bind(contextManager); 