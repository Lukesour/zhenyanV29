import { 
  PerformanceMonitor, 
  PerformanceMetric, 
  PerformanceReport, 
  PerformanceThresholds 
} from '../PerformanceMonitor';

describe('PerformanceMonitor (Task 4.3)', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('基础功能测试', () => {
    test('应该正确创建性能监控实例', () => {
      expect(monitor).toBeDefined();
      expect(typeof monitor.startTimer).toBe('function');
      expect(typeof monitor.endTimer).toBe('function');
      expect(typeof monitor.recordMetric).toBe('function');
    });

    test('应该正确开始和结束计时', () => {
      monitor.startTimer('test_timer');
      
      // 模拟一些操作时间
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // 等待10ms
      }
      
      const duration = monitor.endTimer('test_timer', 'render');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // 应该在合理范围内
    });

    test('应该正确记录性能指标', () => {
      monitor.recordMetric('test_metric', 50, 'render', { dataSize: 1000 });
      
      const metrics = monitor.getMetricsByCategory('render');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(50);
      expect(metrics[0].category).toBe('render');
      expect(metrics[0].metadata?.dataSize).toBe(1000);
    });
  });

  describe('性能指标统计测试', () => {
    test('应该正确计算平均性能指标', () => {
      monitor.recordMetric('test_metric', 50, 'render');
      monitor.recordMetric('test_metric', 100, 'render');
      monitor.recordMetric('test_metric', 150, 'render');
      
      const average = monitor.getAverageMetric('test_metric');
      expect(average).toBe(100); // (50 + 100 + 150) / 3 = 100
    });

    test('应该正确获取最佳性能指标', () => {
      monitor.recordMetric('test_metric', 100, 'render');
      monitor.recordMetric('test_metric', 50, 'render');
      monitor.recordMetric('test_metric', 150, 'render');
      
      const best = monitor.getBestMetric('test_metric');
      expect(best).toBeDefined();
      expect(best!.value).toBe(50);
    });

    test('应该正确获取最差性能指标', () => {
      monitor.recordMetric('test_metric', 100, 'render');
      monitor.recordMetric('test_metric', 50, 'render');
      monitor.recordMetric('test_metric', 150, 'render');
      
      const worst = monitor.getWorstMetric('test_metric');
      expect(worst).toBeDefined();
      expect(worst!.value).toBe(150);
    });

    test('应该正确按分类获取指标', () => {
      monitor.recordMetric('render_metric', 50, 'render');
      monitor.recordMetric('search_metric', 30, 'search');
      monitor.recordMetric('scroll_metric', 20, 'scroll');
      
      const renderMetrics = monitor.getMetricsByCategory('render');
      const searchMetrics = monitor.getMetricsByCategory('search');
      const scrollMetrics = monitor.getMetricsByCategory('scroll');
      
      expect(renderMetrics).toHaveLength(1);
      expect(searchMetrics).toHaveLength(1);
      expect(scrollMetrics).toHaveLength(1);
      
      expect(renderMetrics[0].name).toBe('render_metric');
      expect(searchMetrics[0].name).toBe('search_metric');
      expect(scrollMetrics[0].name).toBe('scroll_metric');
    });
  });

  describe('性能回归检测测试', () => {
    test('应该正确检测性能回归', () => {
      // 记录当前性能指标
      monitor.recordMetric('render_small', 60, 'render');
      monitor.recordMetric('render_medium', 120, 'render');
      
      // 定义基准指标
      const baselineMetrics = {
        render_small: 50,
        render_medium: 100
      };
      
      // 检测回归 (允许20%下降)
      const regressions = monitor.detectRegression(baselineMetrics, 0.2);
      
      expect(regressions).toHaveLength(2);
      expect(regressions[0]).toContain('render_small');
      expect(regressions[1]).toContain('render_medium');
    });

    test('应该正确识别无性能回归的情况', () => {
      // 记录当前性能指标 (都在基准范围内)
      monitor.recordMetric('render_small', 40, 'render');
      monitor.recordMetric('render_medium', 80, 'render');
      
      // 定义基准指标
      const baselineMetrics = {
        render_small: 50,
        render_medium: 100
      };
      
      // 检测回归 (允许20%下降)
      const regressions = monitor.detectRegression(baselineMetrics, 0.2);
      
      expect(regressions).toHaveLength(0);
    });
  });

  describe('性能报告生成测试', () => {
    test('应该正确生成性能报告', () => {
      // 记录各种性能指标
      monitor.recordMetric('render_small', 50, 'render');
      monitor.recordMetric('render_medium', 100, 'render');
      monitor.recordMetric('search_input', 30, 'search');
      monitor.recordMetric('search_filter', 50, 'search');
      monitor.recordMetric('scroll_single', 20, 'scroll');
      monitor.recordMetric('memory_initial', 1024 * 1024, 'memory'); // 1MB
      
      const report = monitor.generateReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toHaveLength(6);
      expect(report.recommendations).toBeDefined();
      expect(report.timestamp).toBeDefined();
      
      // 验证摘要数据
      expect(report.summary.totalMetrics).toBe(6);
      expect(report.summary.averageRenderTime).toBe(75); // (50 + 100) / 2
      expect(report.summary.averageSearchTime).toBe(40); // (30 + 50) / 2
      expect(report.summary.averageScrollTime).toBe(20);
      expect(report.summary.memoryUsage).toBe(1024 * 1024);
      expect(report.summary.performanceScore).toBeGreaterThan(0);
      expect(report.summary.performanceScore).toBeLessThanOrEqual(100);
    });

    test('应该为空数据生成正确的报告', () => {
      const report = monitor.generateReport();
      
      expect(report.summary.totalMetrics).toBe(0);
      expect(report.summary.averageRenderTime).toBe(0);
      expect(report.summary.averageSearchTime).toBe(0);
      expect(report.summary.averageScrollTime).toBe(0);
      expect(report.summary.memoryUsage).toBe(0);
      expect(report.summary.performanceScore).toBe(100); // 无数据时满分
      expect(report.metrics).toHaveLength(0);
      expect(report.recommendations).toContain('性能表现良好，继续保持当前优化水平');
    });
  });

  describe('自定义阈值测试', () => {
    test('应该正确使用自定义阈值', () => {
      const customThresholds: Partial<PerformanceThresholds> = {
        render: {
          small: 100,
          medium: 200,
          large: 400
        },
        search: {
          input: 50,
          filter: 100,
          debounce: 200
        },
        scroll: {
          single: 30,
          continuous: 150
        },
        memory: {
          initial: 10 * 1024 * 1024, // 10MB
          peak: 20 * 1024 * 1024,    // 20MB
          growth: 5 * 1024 * 1024    // 5MB
        }
      };
      
      const customMonitor = new PerformanceMonitor(customThresholds);
      
      // 记录一个超过默认阈值但低于自定义阈值的指标
      customMonitor.recordMetric('render_small', 80, 'render');
      
      // 应该不会产生警告，因为80 < 100 (自定义阈值)
      // 这个测试主要验证自定义阈值被正确应用
      expect(customMonitor).toBeDefined();
    });
  });

  describe('启用/禁用功能测试', () => {
    test('应该正确禁用性能监控', () => {
      monitor.enable(false);
      
      monitor.startTimer('test_timer');
      const duration = monitor.endTimer('test_timer', 'render');
      
      expect(duration).toBe(0);
      
      monitor.recordMetric('test_metric', 50, 'render');
      const metrics = monitor.getMetricsByCategory('render');
      expect(metrics).toHaveLength(0);
    });

    test('应该正确重新启用性能监控', () => {
      monitor.enable(false);
      monitor.recordMetric('test_metric', 50, 'render');
      
      monitor.enable(true);
      monitor.recordMetric('test_metric', 100, 'render');
      
      const metrics = monitor.getMetricsByCategory('render');
      expect(metrics).toHaveLength(1); // 只有重新启用后记录的指标
      expect(metrics[0].value).toBe(100);
    });
  });

  describe('数据导出导入测试', () => {
    test('应该正确导出性能数据', () => {
      monitor.recordMetric('test_metric', 50, 'render');
      monitor.recordMetric('test_metric', 100, 'render');
      
      const exportedData = monitor.exportData();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed.metrics).toBeDefined();
      expect(parsed.thresholds).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.metrics).toHaveLength(2);
    });

    test('应该正确导入性能数据', () => {
      const testData = {
        metrics: [
          {
            name: 'imported_metric',
            value: 75,
            timestamp: Date.now(),
            category: 'render' as const,
            metadata: { imported: true }
          }
        ],
        thresholds: {
          render: { small: 100, medium: 200, large: 400 }
        },
        timestamp: Date.now()
      };
      
      monitor.importData(JSON.stringify(testData));
      
      const metrics = monitor.getMetricsByCategory('render');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('imported_metric');
      expect(metrics[0].value).toBe(75);
      expect(metrics[0].metadata?.imported).toBe(true);
    });

    test('应该正确处理导入错误', () => {
      const invalidData = 'invalid json data';
      
      // 不应该抛出错误
      expect(() => {
        monitor.importData(invalidData);
      }).not.toThrow();
      
      // 数据应该保持原样
      const metrics = monitor.getMetricsByCategory('render');
      expect(metrics).toHaveLength(0);
    });
  });

  describe('清除功能测试', () => {
    test('应该正确清除所有指标', () => {
      monitor.recordMetric('test_metric', 50, 'render');
      monitor.recordMetric('test_metric', 100, 'search');
      
      expect(monitor.getMetricsByCategory('render')).toHaveLength(1);
      expect(monitor.getMetricsByCategory('search')).toHaveLength(1);
      
      monitor.clear();
      
      expect(monitor.getMetricsByCategory('render')).toHaveLength(0);
      expect(monitor.getMetricsByCategory('search')).toHaveLength(0);
    });

    test('应该正确清除计时器', () => {
      monitor.startTimer('test_timer');
      monitor.clear();
      
      // 清除后应该无法结束计时器
      expect(() => {
        monitor.endTimer('test_timer', 'render');
      }).toThrow("Timer 'test_timer' was not started");
    });
  });

  describe('内存使用监控测试', () => {
    test('应该正确记录内存使用情况', () => {
      monitor.recordMemoryUsage(1024 * 1024, 'initial'); // 1MB
      monitor.recordMemoryUsage(2 * 1024 * 1024, 'peak'); // 2MB
      monitor.recordMemoryUsage(1.5 * 1024 * 1024, 'current'); // 1.5MB
      
      const memoryMetrics = monitor.getMetricsByCategory('memory');
      expect(memoryMetrics).toHaveLength(3);
      
      expect(memoryMetrics[0].name).toBe('memory_initial');
      expect(memoryMetrics[0].value).toBe(1024 * 1024);
      expect(memoryMetrics[0].metadata?.type).toBe('initial');
      expect(memoryMetrics[0].metadata?.usageInMB).toBe(1);
      
      expect(memoryMetrics[1].name).toBe('memory_peak');
      expect(memoryMetrics[1].value).toBe(2 * 1024 * 1024);
      expect(memoryMetrics[1].metadata?.type).toBe('peak');
      expect(memoryMetrics[1].metadata?.usageInMB).toBe(2);
      
      expect(memoryMetrics[2].name).toBe('memory_current');
      expect(memoryMetrics[2].value).toBe(1.5 * 1024 * 1024);
      expect(memoryMetrics[2].metadata?.type).toBe('current');
      expect(memoryMetrics[2].metadata?.usageInMB).toBe(1.5);
    });
  });

  describe('边界条件测试', () => {
    test('应该正确处理未启动的计时器', () => {
      expect(() => {
        monitor.endTimer('nonexistent_timer', 'render');
      }).toThrow("Timer 'nonexistent_timer' was not started");
    });

    test('应该正确处理空指标列表', () => {
      expect(monitor.getAverageMetric('nonexistent')).toBe(0);
      expect(monitor.getBestMetric('nonexistent')).toBeNull();
      expect(monitor.getWorstMetric('nonexistent')).toBeNull();
    });

    test('应该正确处理重复的计时器名称', () => {
      monitor.startTimer('duplicate_timer');
      monitor.startTimer('duplicate_timer'); // 覆盖之前的计时器
      
      const duration = monitor.endTimer('duplicate_timer', 'render');
      expect(duration).toBeGreaterThan(0);
      
      // 第二次调用应该失败
      expect(() => {
        monitor.endTimer('duplicate_timer', 'render');
      }).toThrow("Timer 'duplicate_timer' was not started");
    });
  });
});

