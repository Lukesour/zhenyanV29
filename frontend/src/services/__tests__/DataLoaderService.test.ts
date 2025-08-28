/**
 * DataLoaderService测试
 * 
 * Linus的测试原则：
 * 1. 测试核心功能，不测试实现细节
 * 2. 测试边界条件和错误场景
 * 3. 测试要简单明确，一目了然
 * 4. 不为了覆盖率而测试无意义的东西
 */

import { DataLoaderService } from '../DataLoaderService';

describe('DataLoaderService', () => {
  let service: DataLoaderService;

  beforeEach(() => {
    service = new DataLoaderService();
  });

  describe('loadUniversities', () => {
    it('should load universities from JSON file', async () => {
      const universities = await service.loadUniversities();
      
      expect(universities).toBeDefined();
      expect(Array.isArray(universities)).toBe(true);
      expect(universities.length).toBeGreaterThanOrEqual(500);
      
      // 验证包含一些预期的大学
      expect(universities).toContain('北京大学');
      expect(universities).toContain('清华大学');
    });

    it('should validate data integrity', async () => {
      const universities = await service.loadUniversities();
      expect(universities.length).toBeGreaterThanOrEqual(500);
    });
  });

  describe('loadMajors', () => {
    it('should load majors from JSON file', async () => {
      const majors = await service.loadMajors();
      
      expect(majors).toBeDefined();
      expect(Array.isArray(majors)).toBe(true);
      expect(majors.length).toBeGreaterThanOrEqual(500);
      
      // 验证包含一些预期的专业
      expect(majors).toContain('哲学');
      expect(majors).toContain('经济学');
    });

    it('should validate data integrity', async () => {
      const majors = await service.loadMajors();
      expect(majors.length).toBeGreaterThanOrEqual(500);
    });
  });

  describe('loadCountries', () => {
    it('should load countries from hardcoded list', async () => {
      const countries = await service.loadCountries();
      
      expect(countries).toBeDefined();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThanOrEqual(50);
      
      // 验证包含一些预期的国家（使用实际存在的名称）
      expect(countries).toContain('美国');
      expect(countries).toContain('英国');
      expect(countries).toContain('日本');
      expect(countries).toContain('香港'); // 地区
      expect(countries).toContain('台湾'); // 地区
    });
  });

  describe('loadTargetMajors', () => {
    it('should load target majors from JSON file and flatten them', async () => {
      const targetMajors = await service.loadTargetMajors();
      
      expect(targetMajors).toBeDefined();
      expect(Array.isArray(targetMajors)).toBe(true);
      expect(targetMajors.length).toBeGreaterThanOrEqual(50);
      
      // 验证包含一些预期的目标专业
      expect(targetMajors).toContain('金融');
      expect(targetMajors).toContain('计算机');
      expect(targetMajors).toContain('物理');
    });

    it('should validate data integrity', async () => {
      const targetMajors = await service.loadTargetMajors();
      expect(targetMajors.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('validateDataIntegrity', () => {
    it('should return true for valid data', () => {
      const isValid = service.validateDataIntegrity();
      expect(isValid).toBe(true);
    });
  });

  describe('getDataMetrics', () => {
    it('should return correct data metrics', () => {
      const metrics = service.getDataMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.universitiesCount).toBeGreaterThanOrEqual(500);
      expect(metrics.majorsCount).toBeGreaterThanOrEqual(500);
      expect(metrics.targetMajorsCount).toBeGreaterThanOrEqual(50);
      expect(metrics.totalDataSize).toBeGreaterThan(0);
    });
  });

  describe('preloadAll', () => {
    it('should preload all data without errors', async () => {
      await expect(service.preloadAll()).resolves.not.toThrow();
    });
  });
});
