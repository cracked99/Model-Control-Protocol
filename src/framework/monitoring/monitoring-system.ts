/**
 * Monitoring System Implementation
 */

import { Metrics } from '../types';

/**
 * Monitoring System handles metrics collection and alerting
 */
class MonitoringSystem {
  private metrics: Map<string, Metrics[]> = new Map();
  private alerts: AlertManager;
  private storage: MetricsStorage;
  private collectionInterval: number | null = null;
  
  constructor() {
    this.alerts = new AlertManager();
    this.storage = new MetricsStorage();
  }
  
  async initialize(env: any): Promise<{ status: string }> {
    console.log('Initializing Monitoring System...');
    
    // Initialize storage
    await this.storage.initialize(env);
    
    // Initialize alerts
    await this.alerts.initialize(env);
    
    // Start periodic metrics collection
    this.startPeriodicCollection(env);
    
    return { status: 'success' };
  }
  
  startPeriodicCollection(env: any): void {
    // In a real Cloudflare Worker, we would use a scheduled event
    // For this example, we'll just log that it's ready
    console.log('Periodic metrics collection ready');
  }
  
  async collectSystemMetrics(env: any): Promise<Metrics> {
    // Collect system metrics
    const systemMetrics: Metrics = {
      timestamp: Date.now(),
      category: 'system',
      data: {
        cpu: await this.getCpuUsage(),
        memory: await this.getMemoryUsage(),
        activeRules: await this.getActiveRuleCount(env),
        requestRate: await this.getRequestRate(),
      },
      tags: ['system', 'performance'],
    };
    
    // Store metrics
    await this.storage.storeMetrics(env, 'system', systemMetrics);
    
    // Check for alerts
    await this.alerts.checkAlerts(env, systemMetrics);
    
    return systemMetrics;
  }
  
  async recordMetrics(env: any, category: string, data: Record<string, any>, tags: string[] = []): Promise<void> {
    // Create metrics object
    const metrics: Metrics = {
      timestamp: Date.now(),
      category,
      data,
      tags,
    };
    
    // Store metrics in memory
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metrics);
    
    // Keep only the last 100 metrics per category in memory
    if (categoryMetrics.length > 100) {
      this.metrics.set(category, categoryMetrics.slice(-100));
    }
    
    // Store metrics in KV
    await this.storage.storeMetrics(env, category, metrics);
    
    // Check for alerts
    await this.alerts.checkAlerts(env, metrics);
  }
  
  async getMetrics(env: any, category: string, limit: number = 10): Promise<Metrics[]> {
    // Get metrics from storage
    return await this.storage.getMetrics(env, category, limit);
  }
  
  async getCpuUsage(): Promise<number> {
    // In a real implementation, this would get CPU usage
    // For this example, we'll just return a random value
    return Math.random() * 100;
  }
  
  async getMemoryUsage(): Promise<{ used: number; total: number }> {
    // In a real implementation, this would get memory usage
    // For this example, we'll just return random values
    return {
      used: Math.random() * 1024,
      total: 1024,
    };
  }
  
  async getActiveRuleCount(env: any): Promise<number> {
    // Get active rule count from rule engine
    try {
      const ruleEngine = await import('../rule-engine/rule-engine');
      const activeRules = await ruleEngine.getActiveRules();
      return activeRules.length;
    } catch (error) {
      console.error('Error getting active rule count:', error);
      return 0;
    }
  }
  
  async getRequestRate(): Promise<number> {
    // In a real implementation, this would calculate the request rate
    // For this example, we'll just return a random value
    return Math.random() * 100;
  }
}

/**
 * Alert Manager handles checking for alert conditions and sending alerts
 */
class AlertManager {
  private alertThresholds: Map<string, number> = new Map();
  private activeAlerts: Set<string> = new Set();
  
  async initialize(env: any): Promise<void> {
    console.log('Initializing Alert Manager...');
    
    // Load alert thresholds from KV
    try {
      const thresholdsStr = await env.FRAMEWORK_KV?.get('alert_thresholds');
      if (thresholdsStr) {
        const thresholds = JSON.parse(thresholdsStr);
        this.alertThresholds = new Map(Object.entries(thresholds));
      } else {
        // Set default thresholds
        this.alertThresholds.set('cpu', 90);
        this.alertThresholds.set('memory', 90);
        this.alertThresholds.set('error_rate', 5);
        
        // Save default thresholds
        await this.saveThresholds(env);
      }
    } catch (error) {
      console.error('Error loading alert thresholds:', error);
    }
  }
  
  async checkAlerts(env: any, metrics: Metrics): Promise<void> {
    // Check for alert conditions
    const alerts: string[] = [];
    
    if (metrics.category === 'system') {
      // Check CPU usage
      if (metrics.data.cpu > (this.alertThresholds.get('cpu') || 90)) {
        alerts.push('high_cpu_usage');
      }
      
      // Check memory usage
      if (metrics.data.memory && metrics.data.memory.used / metrics.data.memory.total * 100 > (this.alertThresholds.get('memory') || 90)) {
        alerts.push('high_memory_usage');
      }
    }
    
    // Send alerts for new conditions
    for (const alert of alerts) {
      if (!this.activeAlerts.has(alert)) {
        await this.sendAlert(env, alert, metrics);
        this.activeAlerts.add(alert);
      }
    }
    
    // Clear resolved alerts
    for (const activeAlert of this.activeAlerts) {
      if (!alerts.includes(activeAlert)) {
        await this.sendAlertResolved(env, activeAlert);
        this.activeAlerts.delete(activeAlert);
      }
    }
  }
  
  async sendAlert(env: any, alertType: string, metrics: Metrics): Promise<void> {
    // In a real implementation, this would send an alert
    console.log(`ALERT: ${alertType} - ${JSON.stringify(metrics)}`);
    
    // Log alert to KV
    try {
      const alertsStr = await env.FRAMEWORK_KV?.get('alerts');
      const alerts = alertsStr ? JSON.parse(alertsStr) : [];
      
      alerts.push({
        type: alertType,
        timestamp: Date.now(),
        metrics,
      });
      
      // Keep only the last 100 alerts
      const trimmedAlerts = alerts.slice(-100);
      
      await env.FRAMEWORK_KV?.put('alerts', JSON.stringify(trimmedAlerts));
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }
  
  async sendAlertResolved(env: any, alertType: string): Promise<void> {
    // In a real implementation, this would send an alert resolution
    console.log(`ALERT RESOLVED: ${alertType}`);
    
    // Log alert resolution to KV
    try {
      const resolutionsStr = await env.FRAMEWORK_KV?.get('alert_resolutions');
      const resolutions = resolutionsStr ? JSON.parse(resolutionsStr) : [];
      
      resolutions.push({
        type: alertType,
        timestamp: Date.now(),
      });
      
      // Keep only the last 100 resolutions
      const trimmedResolutions = resolutions.slice(-100);
      
      await env.FRAMEWORK_KV?.put('alert_resolutions', JSON.stringify(trimmedResolutions));
    } catch (error) {
      console.error('Error logging alert resolution:', error);
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
 * Metrics Storage handles storing and retrieving metrics
 */
class MetricsStorage {
  async initialize(env: any): Promise<void> {
    console.log('Initializing Metrics Storage...');
  }
  
  async storeMetrics(env: any, category: string, metrics: Metrics): Promise<void> {
    try {
      // Get existing metrics for this category
      const metricsStr = await env.FRAMEWORK_KV?.get(`metrics:${category}`);
      const existingMetrics = metricsStr ? JSON.parse(metricsStr) : [];
      
      // Add new metrics
      existingMetrics.push(metrics);
      
      // Keep only the last 100 metrics per category
      const trimmedMetrics = existingMetrics.slice(-100);
      
      // Store updated metrics
      await env.FRAMEWORK_KV?.put(`metrics:${category}`, JSON.stringify(trimmedMetrics));
    } catch (error) {
      console.error(`Error storing metrics for ${category}:`, error);
    }
  }
  
  async getMetrics(env: any, category: string, limit: number = 10): Promise<Metrics[]> {
    try {
      // Get metrics for this category
      const metricsStr = await env.FRAMEWORK_KV?.get(`metrics:${category}`);
      const metrics = metricsStr ? JSON.parse(metricsStr) : [];
      
      // Return the most recent metrics up to the limit
      return metrics.slice(-limit);
    } catch (error) {
      console.error(`Error getting metrics for ${category}:`, error);
      return [];
    }
  }
}

// Export singleton instance
const monitoringSystem = new MonitoringSystem();
export const initialize = monitoringSystem.initialize.bind(monitoringSystem);
export const recordMetrics = monitoringSystem.recordMetrics.bind(monitoringSystem);
export const getMetrics = monitoringSystem.getMetrics.bind(monitoringSystem);
export const collectSystemMetrics = monitoringSystem.collectSystemMetrics.bind(monitoringSystem); 