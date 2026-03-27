// 工具函数测试
const { formatTime, formatTimeAgo, generateId, validateEmail, validatePassword } = require('../utils');

describe('Utils', () => {
  describe('formatTime', () => {
    test('should format date string to time', () => {
      const dateStr = '2023-12-25T14:30:00';
      const result = formatTime(dateStr);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('formatTimeAgo', () => {
    test('should format recent time as "刚刚"', () => {
      const recentDate = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
      const result = formatTimeAgo(recentDate);
      expect(result).toBe('刚刚');
    });

    test('should format minutes ago', () => {
      const minutesAgo = new Date(Date.now() - 360000).toISOString(); // 6 minutes ago
      const result = formatTimeAgo(minutesAgo);
      expect(result).toMatch(/^\d+分钟前$/);
    });
  });

  describe('generateId', () => {
    test('should generate a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateEmail', () => {
    test('should return true for valid email', () => {
      const validEmail = 'test@example.com';
      const result = validateEmail(validEmail);
      expect(result).toBe(true);
    });

    test('should return false for invalid email', () => {
      const invalidEmail = 'test@';
      const result = validateEmail(invalidEmail);
      expect(result).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should return true for valid password', () => {
      const validPassword = '123456';
      const result = validatePassword(validPassword);
      expect(result).toBe(true);
    });

    test('should return false for invalid password', () => {
      const invalidPassword = '12345';
      const result = validatePassword(invalidPassword);
      expect(result).toBe(false);
    });
  });
});