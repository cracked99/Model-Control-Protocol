/**
 * Monitoring System Implementation
 */

import { Metrics } from '../types';

/**
 * Monitoring System for collecting and analyzing metrics
 */
class MonitoringSystem {
  private metrics: Map<string, Metrics[]> = new Map();
  private alerts: AlertManager;
  private storage: MetricsStorage;
  private collectionInterval: number | null = null;
  private requestTimestamps: number[] = [];
  
  constructor() {
    this.alerts = new AlertManager();
    this.storage = new MetricsStorage();
  }
  
  async initialize(env: any): Promise<{ status: string }> {
    console.log('Initializing Monitoring System...');
    
    // Initialize storage and alerts
    await this.storage.initialize(env);
    await this.alerts.initialize(env);
    
    // Start periodic metrics collection
    this.startPeriodicCollection(env);
    
    return { status: 'success' };
  }
  
  startPeriodicCollection(env: any): void {
    // In a real implementation, this would set up a periodic metrics collection
    // For now, we'll just collect metrics once
    this.collectSystemMetrics(env).catch(error => {
      console.error('Error collecting system metrics:', error);
    });
  }
  
  async collectSystemMetrics(env: any): Promise<Metrics> {
    try {
      // Collect CPU and memory metrics
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = await this.getMemoryUsage();
      const activeRuleCount = await this.getActiveRuleCount(env);
      const requestRate = await this.getRequestRate();
      
      // Create metrics object
      const metrics: Metrics = {
        timestamp: Date.now(),
        category: 'system',
        data: {
          cpu: cpuUsage,
          memory: memoryUsage,
          activeRules: activeRuleCount,
          requestRate: requestRate,
          ruleCalls: 0, // This would be tracked in a real implementation
          responseTimes: {
            avg: 0,
            min: 0,
            max: 0,
          },
        },
        tags: ['system', 'performance'],
      };
      
      // Record metrics
      await this.recordMetrics(env, 'system', metrics.data, metrics.tags);
      
      // Check alerts
      await this.alerts.checkAlerts(env, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }
  
  async recordMetrics(env: any, category: string, data: Record<string, any>, tags: string[] = []): Promise<void> {
    try {
      // Create metrics object
      const metrics: Metrics = {
        timestamp: Date.now(),
        category,
        data,
        tags,
      };
      
      // Store in memory
      if (!this.metrics.has(category)) {
        this.metrics.set(category, []);
      }
      
      const categoryMetrics = this.metrics.get(category)!;
      categoryMetrics.push(metrics);
      
      // Limit the number of metrics stored in memory
      if (categoryMetrics.length > 100) {
        categoryMetrics.shift();
      }
      
      // Store in persistent storage
      await this.storage.storeMetrics(env, category, metrics);
    } catch (error) {
      console.error('Error recording metrics:', error);
    }
  }
  
  async getMetrics(env: any, category: string = 'system'): Promise<{
    ruleCalls: number;
    responseTimeAvg: number;
    responseTimeMin: number;
    responseTimeMax: number;
    memoryUsage: string;
    cpuUsage: string;
    activeRules: number;
    requestRate: number;
  }> {
    try {
      // Get metrics from storage
      const metricsArray = await this.storage.getMetrics(env, category);
      
      // If no metrics, return defaults
      if (!metricsArray || metricsArray.length === 0) {
        return {
          ruleCalls: 0,
          responseTimeAvg: 0,
          responseTimeMin: 0,
          responseTimeMax: 0,
          memoryUsage: '0MB',
          cpuUsage: '0%',
          activeRules: 0,
          requestRate: 0,
        };
      }
      
      // Get the most recent metrics
      const latestMetrics = metricsArray[metricsArray.length - 1];
      
      // Extract and format metrics
      const memory = latestMetrics.data.memory || { used: 0, total: 0 };
      const memoryUsage = `${Math.round(memory.used)}MB`;
      const cpuUsage = `${Math.round((latestMetrics.data.cpu || 0) * 100)}%`;
      
      return {
        ruleCalls: latestMetrics.data.ruleCalls || 0,
        responseTimeAvg: latestMetrics.data.responseTimes?.avg || 0,
        responseTimeMin: latestMetrics.data.responseTimes?.min || 0,
        responseTimeMax: latestMetrics.data.responseTimes?.max || 0,
        memoryUsage,
        cpuUsage,
        activeRules: latestMetrics.data.activeRules || 0,
        requestRate: latestMetrics.data.requestRate || 0,
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      
      // Return defaults on error
      return {
        ruleCalls: 0,
        responseTimeAvg: 0,
        responseTimeMin: 0,
        responseTimeMax: 0,
        memoryUsage: '0MB',
        cpuUsage: '0%',
        activeRules: 0,
        requestRate: 0,
      };
    }
  }
  
  async getCpuUsage(): Promise<number> {
    // In a Cloudflare Workers environment, we don't have direct access to CPU metrics
    // Instead, we'll use performance.now() to measure execution time as a proxy
    try {
      const startTime = performance.now();
      
      // Run a standardized computation to measure performance
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Normalize to a value between 0-1 where higher means more CPU load
      // Baseline is 50ms on average hardware, 100ms would be 1.0 (high load)
      const normalizedLoad = Math.min(executionTime / 100, 1);
      
      return normalizedLoad;
    } catch (error) {
      console.error('Error measuring CPU usage:', error);
      return 0;
    }
  }
  
  async getMemoryUsage(): Promise<{ used: number; total: number }> {
    try {
      // For Cloudflare Workers, we can use the global caches object to estimate memory usage
      // This is an approximation since we don't have direct memory metrics
      
      let estimatedUsage = 0;
      
      // Estimate KV storage usage if available
      if (typeof caches !== 'undefined') {
        try {
          // Use type assertion for Cloudflare Workers Cache API
          const cacheStorage = caches as unknown as {
            keys(): Promise<string[]>;
            open(name: string): Promise<Cache>;
          };
          
          const cacheNames = await cacheStorage.keys();
          for (const name of cacheNames) {
            const cache = await cacheStorage.open(name);
            // Use type assertion for Cache API
            const cacheWithKeys = cache as unknown as {
              keys(): Promise<Request[]>;
            };
            const keys = await cacheWithKeys.keys();
            estimatedUsage += keys.length * 8192; // Rough estimate: 8KB per cached item
          }
        } catch (e) {
          // Ignore cache errors
        }
      }
      
      // Add base memory usage for the worker (approximation)
      const baseMemory = 32 * 1024 * 1024; // 32MB base allocation
      
      // Add active rules memory usage estimation
      try {
        const ruleEngine = await import('../rule-engine/rule-engine');
        const rules = await ruleEngine.getActiveRules();
        estimatedUsage += rules.length * 50 * 1024; // ~50KB per rule
      } catch (e) {
        // Ignore rule engine errors
      }
      
      // Cloudflare Workers have a limit of 128MB
      const total = 128 * 1024 * 1024; // 128MB
      const used = Math.min(baseMemory + estimatedUsage, total);
      
      return { used, total };
    } catch (error) {
      console.error('Error measuring memory usage:', error);
      return { used: 0, total: 128 * 1024 * 1024 };
    }
  }
  
  async getActiveRuleCount(env: any): Promise<number> {
    try {
      // In a real implementation, this would get the actual rule count from the rule engine
      // For now, we'll just return a mock value
      
      // Try to import the rule engine
      try {
        const ruleEngine = await import('../rule-engine/rule-engine');
        const rules = await ruleEngine.getActiveRules();
        return rules.length;
      } catch (error) {
        return 5; // Default value
      }
    } catch (error) {
      console.error('Error getting active rule count:', error);
      return 0;
    }
  }
  
  async getRequestRate(): Promise<number> {
    try {
      // Use a sliding window to track request rate
      if (!this.requestTimestamps) {
        this.requestTimestamps = [];
      }
      
      // Add current timestamp
      const now = Date.now();
      this.requestTimestamps.push(now);
      
      // Remove timestamps older than 1 minute
      const oneMinuteAgo = now - 60000;
      this.requestTimestamps = this.requestTimestamps.filter(ts => ts >= oneMinuteAgo);
      
      // Calculate requests per second
      return this.requestTimestamps.length / 60;
    } catch (error) {
      console.error('Error calculating request rate:', error);
      return 0;
    }
  }
}

/**
 * Alert Manager for monitoring and sending alerts
 */
class AlertManager {
  private alertThresholds: Map<string, number> = new Map();
  private activeAlerts: Set<string> = new Set();
  
  async initialize(env: any): Promise<void> {
    console.log('Initializing Alert Manager...');
    
    // Load alert thresholds from storage
    try {
      const thresholdsStr = await env.FRAMEWORK_KV?.get('alert_thresholds');
      if (thresholdsStr) {
        const thresholds = JSON.parse(thresholdsStr);
        this.alertThresholds = new Map(Object.entries(thresholds));
      } else {
        // Set default thresholds
        this.alertThresholds.set('cpu', 0.8); // 80% CPU usage
        this.alertThresholds.set('memory', 0.9); // 90% memory usage
        this.alertThresholds.set('requestRate', 100); // 100 requests per second
        
        // Save default thresholds
        await this.saveThresholds(env);
      }
    } catch (error) {
      console.error('Error initializing alert manager:', error);
      
      // Set default thresholds
      this.alertThresholds.set('cpu', 0.8);
      this.alertThresholds.set('memory', 0.9);
      this.alertThresholds.set('requestRate', 100);
    }
  }
  
  async checkAlerts(env: any, metrics: Metrics): Promise<void> {
    try {
      // Check CPU usage
      if (metrics.data.cpu !== undefined) {
        const cpuThreshold = this.alertThresholds.get('cpu') || 0.8;
        if (metrics.data.cpu > cpuThreshold) {
          if (!this.activeAlerts.has('cpu')) {
            await this.sendAlert(env, 'cpu', metrics);
            this.activeAlerts.add('cpu');
          }
        } else if (this.activeAlerts.has('cpu')) {
          await this.sendAlertResolved(env, 'cpu');
          this.activeAlerts.delete('cpu');
        }
      }
      
      // Check memory usage
      if (metrics.data.memory !== undefined) {
        const memoryUsage = metrics.data.memory.used / metrics.data.memory.total;
        const memoryThreshold = this.alertThresholds.get('memory') || 0.9;
        if (memoryUsage > memoryThreshold) {
          if (!this.activeAlerts.has('memory')) {
            await this.sendAlert(env, 'memory', metrics);
            this.activeAlerts.add('memory');
          }
        } else if (this.activeAlerts.has('memory')) {
          await this.sendAlertResolved(env, 'memory');
          this.activeAlerts.delete('memory');
        }
      }
      
      // Check request rate
      if (metrics.data.requestRate !== undefined) {
        const requestRateThreshold = this.alertThresholds.get('requestRate') || 100;
        if (metrics.data.requestRate > requestRateThreshold) {
          if (!this.activeAlerts.has('requestRate')) {
            await this.sendAlert(env, 'requestRate', metrics);
            this.activeAlerts.add('requestRate');
          }
        } else if (this.activeAlerts.has('requestRate')) {
          await this.sendAlertResolved(env, 'requestRate');
          this.activeAlerts.delete('requestRate');
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }
  
  async sendAlert(env: any, alertType: string, metrics: Metrics): Promise<void> {
    try {
      console.log(`ALERT: ${alertType} threshold exceeded`);
      
      // Create alert object
      const alert = {
        timestamp: Date.now(),
        type: alertType,
        message: this.getAlertMessage(alertType, metrics),
        metrics: {
          category: metrics.category,
          timestamp: metrics.timestamp,
          data: metrics.data,
        },
        severity: this.getAlertSeverity(alertType),
      };
      
      // Store alert in KV
      try {
        const alertsStr = await env.FRAMEWORK_KV?.get('alerts');
        const alerts = alertsStr ? JSON.parse(alertsStr) : [];
        alerts.push(alert);
        
        // Keep only the last 100 alerts
        if (alerts.length > 100) {
          alerts.shift();
        }
        
        await env.FRAMEWORK_KV?.put('alerts', JSON.stringify(alerts));
        
        // Send alert notification
        await this.sendAlertNotification(env, alert);
      } catch (error) {
        console.error('Error storing alert in KV:', error);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
  
  async sendAlertResolved(env: any, alertType: string): Promise<void> {
    try {
      console.log(`RESOLVED: ${alertType} alert resolved`);
      
      // Create alert resolution object
      const alertResolution = {
        timestamp: Date.now(),
        type: alertType,
        message: `${alertType} alert resolved`,
      };
      
      // Store alert resolution in KV
      try {
        const alertResolutionsStr = await env.FRAMEWORK_KV?.get('alert_resolutions');
        const alertResolutions = alertResolutionsStr ? JSON.parse(alertResolutionsStr) : [];
        alertResolutions.push(alertResolution);
        
        // Keep only the last 100 alert resolutions
        if (alertResolutions.length > 100) {
          alertResolutions.shift();
        }
        
        await env.FRAMEWORK_KV?.put('alert_resolutions', JSON.stringify(alertResolutions));
        
        // Send resolution notification
        await this.sendResolutionNotification(env, alertResolution);
      } catch (error) {
        console.error('Error storing alert resolution in KV:', error);
      }
    } catch (error) {
      console.error('Error sending alert resolution:', error);
    }
  }
  
  /**
   * Get alert message based on type
   */
  private getAlertMessage(alertType: string, metrics: Metrics): string {
    switch (alertType) {
      case 'cpu':
        return `High CPU usage detected: ${(metrics.data.cpu * 100).toFixed(1)}% (threshold: ${(this.alertThresholds.get('cpu') || 0.8) * 100}%)`;
        
      case 'memory':
        const memoryUsage = metrics.data.memory.used / metrics.data.memory.total;
        const memoryUsagePercent = (memoryUsage * 100).toFixed(1);
        const memoryThreshold = ((this.alertThresholds.get('memory') || 0.9) * 100).toFixed(1);
        return `High memory usage detected: ${memoryUsagePercent}% (threshold: ${memoryThreshold}%)`;
        
      case 'requestRate':
        return `High request rate detected: ${metrics.data.requestRate} req/s (threshold: ${this.alertThresholds.get('requestRate') || 100} req/s)`;
        
      default:
        return `Alert: ${alertType} threshold exceeded`;
    }
  }
  
  /**
   * Get alert severity based on type
   */
  private getAlertSeverity(alertType: string): 'critical' | 'warning' | 'info' {
    switch (alertType) {
      case 'cpu':
      case 'memory':
        return 'critical';
        
      case 'requestRate':
        return 'warning';
        
      default:
        return 'info';
    }
  }
  
  /**
   * Send alert notification
   */
  private async sendAlertNotification(env: any, alert: any): Promise<void> {
    try {
      // Check if webhook URL is configured
      const webhookUrl = await env.FRAMEWORK_KV?.get('alert_webhook_url');
      if (webhookUrl) {
        // Send webhook notification
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'alert',
            data: alert
          })
        });
      }
      
      // Check if email notification is configured
      const emailConfig = await env.FRAMEWORK_KV?.get('alert_email_config');
      if (emailConfig) {
        const config = JSON.parse(emailConfig);
        
        // Send email notification using Cloudflare Email Workers if available
        if (env.EMAIL && typeof env.EMAIL.send === 'function') {
          await env.EMAIL.send({
            to: config.recipients.join(','),
            from: config.sender,
            subject: `[ALERT] ${alert.type.toUpperCase()} - Agentic Framework`,
            text: alert.message,
            html: `
              <h2>⚠️ Alert: ${alert.type}</h2>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Time:</strong> ${new Date(alert.timestamp).toISOString()}</p>
              <hr>
              <p>This is an automated alert from the Agentic Framework MCP Server.</p>
            `
          });
        }
      }
    } catch (error) {
      console.error('Error sending alert notification:', error);
    }
  }
  
  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(env: any, resolution: any): Promise<void> {
    try {
      // Check if webhook URL is configured
      const webhookUrl = await env.FRAMEWORK_KV?.get('alert_webhook_url');
      if (webhookUrl) {
        // Send webhook notification
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'resolution',
            data: resolution
          })
        });
      }
      
      // Check if email notification is configured
      const emailConfig = await env.FRAMEWORK_KV?.get('alert_email_config');
      if (emailConfig) {
        const config = JSON.parse(emailConfig);
        
        // Send email notification using Cloudflare Email Workers if available
        if (env.EMAIL && typeof env.EMAIL.send === 'function') {
          await env.EMAIL.send({
            to: config.recipients.join(','),
            from: config.sender,
            subject: `[RESOLVED] ${resolution.type.toUpperCase()} - Agentic Framework`,
            text: resolution.message,
            html: `
              <h2>✅ Resolved: ${resolution.type}</h2>
              <p><strong>Message:</strong> ${resolution.message}</p>
              <p><strong>Time:</strong> ${new Date(resolution.timestamp).toISOString()}</p>
              <hr>
              <p>This is an automated notification from the Agentic Framework MCP Server.</p>
            `
          });
        }
      }
    } catch (error) {
      console.error('Error sending resolution notification:', error);
    }
  }
  
  async setThreshold(env: any, metric: string, value: number): Promise<void> {
    this.alertThresholds.set(metric, value);
    await this.saveThresholds(env);
  }
  
  async saveThresholds(env: any): Promise<void> {
    try {
      const thresholds = Object.fromEntries(this.alertThresholds);
      await env.FRAMEWORK_KV?.put('alert_thresholds', JSON.stringify(thresholds));
    } catch (error) {
      console.error('Error saving alert thresholds:', error);
    }
  }
}

/**
 * Metrics Storage for storing and retrieving metrics
 */
class MetricsStorage {
  async initialize(env: any): Promise<void> {
    console.log('Initializing Metrics Storage...');
  }
  
  async storeMetrics(env: any, category: string, metrics: Metrics): Promise<void> {
    try {
      // Get existing metrics for category
      const metricsKey = `metrics:${category}`;
      const metricsStr = await env.FRAMEWORK_KV?.get(metricsKey);
      const existingMetrics = metricsStr ? JSON.parse(metricsStr) : [];
      
      // Add new metrics
      existingMetrics.push(metrics);
      
      // Keep only the last 100 metrics
      if (existingMetrics.length > 100) {
        existingMetrics.shift();
      }
      
      // Store updated metrics
      await env.FRAMEWORK_KV?.put(metricsKey, JSON.stringify(existingMetrics));
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }
  
  async getMetrics(env: any, category: string, limit: number = 10): Promise<Metrics[]> {
    try {
      // Get metrics for category
      const metricsKey = `metrics:${category}`;
      const metricsStr = await env.FRAMEWORK_KV?.get(metricsKey);
      
      if (!metricsStr) {
        return [];
      }
      
      const metrics = JSON.parse(metricsStr);
      
      // Return the most recent metrics up to the limit
      return metrics.slice(-limit);
    } catch (error) {
      console.error('Error getting metrics:', error);
      return [];
    }
  }
}

// Export singleton instance
const monitoringSystem = new MonitoringSystem();
export const initialize = monitoringSystem.initialize.bind(monitoringSystem);
export const collectSystemMetrics = monitoringSystem.collectSystemMetrics.bind(monitoringSystem);
export const recordMetrics = monitoringSystem.recordMetrics.bind(monitoringSystem);
export const getMetrics = monitoringSystem.getMetrics.bind(monitoringSystem); 