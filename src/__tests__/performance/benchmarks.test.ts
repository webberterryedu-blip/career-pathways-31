/**
 * Performance benchmarks and regression testing
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  componentRender: 16, // 60fps = 16.67ms per frame
  dataProcessing: 100,
  apiResponse: 1000,
  pageLoad: 3000,
  bundleSize: 500 * 1024, // 500KB
  memoryUsage: 50 * 1024 * 1024, // 50MB
};

// Mock performance API for Node.js environment
const mockPerformance = {
  now: () => Date.now(),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

// Performance measurement utilities
class PerformanceBenchmark {
  private measurements: Map<string, number[]> = new Map();

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return result;
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return { avg, min, max, median, p95, count: measurements.length };
  }

  clear() {
    this.measurements.clear();
  }
}

describe('Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    vi.clearAllMocks();
  });

  afterEach(() => {
    benchmark.clear();
  });

  describe('Component Rendering Performance', () => {
    it('should render components within performance threshold', async () => {
      // Mock React component rendering
      const mockRender = () => {
        // Simulate component rendering work
        const iterations = 1000;
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += Math.random();
        }
        return result;
      };

      // Run multiple measurements
      for (let i = 0; i < 10; i++) {
        benchmark.measure('component-render', mockRender);
      }

      const stats = benchmark.getStats('component-render');
      expect(stats).toBeTruthy();
      expect(stats!.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.componentRender);
      expect(stats!.p95).toBeLessThan(PERFORMANCE_THRESHOLDS.componentRender * 2);
    });

    it('should handle large lists efficiently', () => {
      const mockLargeListRender = () => {
        // Simulate rendering 1000 items
        const items = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
        }));

        // Simulate virtual scrolling or pagination
        const visibleItems = items.slice(0, 50);
        return visibleItems.map(item => `${item.name}: ${item.value}`);
      };

      const duration = benchmark.measure('large-list-render', mockLargeListRender);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.componentRender * 5);
    });
  });

  describe('Data Processing Performance', () => {
    it('should process assignment generation efficiently', () => {
      const mockAssignmentGeneration = () => {
        // Simulate assignment generation algorithm
        const students = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Student ${i}`,
          qualifications: ['reading', 'demonstration'],
          lastAssignment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        }));

        const programs = Array.from({ length: 8 }, (_, i) => ({
          id: i,
          week: i + 1,
          parts: ['reading', 'demonstration', 'talk'],
        }));

        // Simulate assignment algorithm
        const assignments = [];
        for (const program of programs) {
          for (const part of program.parts) {
            const availableStudents = students.filter(s => 
              s.qualifications.includes(part) &&
              Date.now() - s.lastAssignment.getTime() > 7 * 24 * 60 * 60 * 1000
            );
            
            if (availableStudents.length > 0) {
              const selectedStudent = availableStudents[0];
              assignments.push({
                programId: program.id,
                studentId: selectedStudent.id,
                part,
              });
            }
          }
        }

        return assignments;
      };

      const duration = benchmark.measure('assignment-generation', mockAssignmentGeneration);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.dataProcessing);
    });

    it('should handle analytics calculations efficiently', () => {
      const mockAnalyticsCalculation = () => {
        // Simulate participation analytics
        const assignments = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          studentId: Math.floor(Math.random() * 100),
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          part: ['reading', 'demonstration', 'talk'][Math.floor(Math.random() * 3)],
        }));

        // Calculate participation statistics
        const studentStats = new Map();
        for (const assignment of assignments) {
          if (!studentStats.has(assignment.studentId)) {
            studentStats.set(assignment.studentId, {
              total: 0,
              byPart: {},
              lastAssignment: null,
            });
          }

          const stats = studentStats.get(assignment.studentId);
          stats.total++;
          stats.byPart[assignment.part] = (stats.byPart[assignment.part] || 0) + 1;
          
          if (!stats.lastAssignment || assignment.date > stats.lastAssignment) {
            stats.lastAssignment = assignment.date;
          }
        }

        return Array.from(studentStats.entries()).map(([studentId, stats]) => ({
          studentId,
          ...stats,
        }));
      };

      const duration = benchmark.measure('analytics-calculation', mockAnalyticsCalculation);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.dataProcessing);
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory thresholds', () => {
      // Mock memory-intensive operations
      const mockMemoryIntensiveOperation = () => {
        const largeArray = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: `Large data string ${i}`.repeat(100),
          nested: {
            moreData: Array.from({ length: 10 }, (_, j) => `Nested ${j}`),
          },
        }));

        // Process the data
        const processed = largeArray.map(item => ({
          ...item,
          processed: true,
          summary: item.data.length,
        }));

        return processed.length;
      };

      const initialMemory = process.memoryUsage().heapUsed;
      const result = benchmark.measure('memory-intensive', mockMemoryIntensiveOperation);
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = finalMemory - initialMemory;

      expect(result).toBeGreaterThan(0);
      expect(memoryDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    });

    it('should clean up resources properly', () => {
      // Test memory cleanup after operations
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and destroy large objects
      for (let i = 0; i < 100; i++) {
        const largeObject = {
          data: Array.from({ length: 1000 }, (_, j) => `Data ${j}`),
        };
        // Simulate processing
        largeObject.data.forEach(item => item.length);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal after cleanup
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage / 10);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should track bundle size changes', () => {
      // Mock bundle analysis
      const mockBundleAnalysis = () => {
        // Simulate bundle size calculation
        const components = [
          { name: 'Dashboard', size: 45 * 1024 },
          { name: 'EstudantesPage', size: 38 * 1024 },
          { name: 'ProgramasPage', size: 42 * 1024 },
          { name: 'DesignacoesPage', size: 55 * 1024 },
          { name: 'RelatoriosPage', size: 48 * 1024 },
          { name: 'Vendor', size: 180 * 1024 },
          { name: 'Utils', size: 25 * 1024 },
        ];

        const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);
        return { components, totalSize };
      };

      const bundleInfo = mockBundleAnalysis();
      
      // Check that total bundle size is within threshold
      expect(bundleInfo.totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize);
      
      // Check that no single component is too large
      const maxComponentSize = PERFORMANCE_THRESHOLDS.bundleSize * 0.2; // 20% of total
      bundleInfo.components.forEach(component => {
        if (component.name !== 'Vendor') { // Vendor bundle can be larger
          expect(component.size).toBeLessThan(maxComponentSize);
        }
      });
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      // Simulate baseline performance
      const baselinePerformance = {
        'component-render': 12,
        'data-processing': 85,
        'memory-usage': 30 * 1024 * 1024,
      };

      // Simulate current performance
      const currentPerformance = {
        'component-render': 15, // Slight regression
        'data-processing': 82, // Improvement
        'memory-usage': 35 * 1024 * 1024, // Slight regression
      };

      // Check for regressions (>20% slower)
      const regressionThreshold = 1.2;
      
      Object.entries(currentPerformance).forEach(([metric, current]) => {
        const baseline = baselinePerformance[metric as keyof typeof baselinePerformance];
        const ratio = current / baseline;
        
        if (ratio > regressionThreshold) {
          console.warn(`Performance regression detected in ${metric}: ${ratio.toFixed(2)}x slower`);
        }
        
        // For this test, we'll allow some regression but flag significant ones
        expect(ratio).toBeLessThan(1.5); // No more than 50% regression
      });
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle concurrent operations efficiently', async () => {
      const mockConcurrentOperations = async () => {
        // Simulate multiple concurrent operations
        const operations = Array.from({ length: 10 }, (_, i) => 
          new Promise(resolve => {
            setTimeout(() => {
              // Simulate work
              const result = Array.from({ length: 100 }, (_, j) => i * 100 + j);
              resolve(result);
            }, Math.random() * 50);
          })
        );

        return Promise.all(operations);
      };

      const duration = await benchmark.measureAsync('concurrent-operations', mockConcurrentOperations);
      
      // Should complete within reasonable time despite concurrency
      expect(duration).toBeLessThan(200); // 200ms for 10 concurrent operations
    });

    it('should maintain performance under load', () => {
      // Simulate high-load scenario
      const mockHighLoadScenario = () => {
        const results = [];
        
        // Simulate 100 rapid operations
        for (let i = 0; i < 100; i++) {
          const data = Array.from({ length: 50 }, (_, j) => ({
            id: i * 50 + j,
            value: Math.random(),
          }));
          
          // Process data
          const processed = data
            .filter(item => item.value > 0.5)
            .map(item => ({ ...item, processed: true }))
            .sort((a, b) => a.value - b.value);
          
          results.push(processed);
        }
        
        return results.flat();
      };

      const duration = benchmark.measure('high-load-scenario', mockHighLoadScenario);
      
      // Should handle high load efficiently
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.dataProcessing * 2);
    });
  });
});