import { Calculator } from '../calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      const result = calculator.add(2, 3);
      expect(result).toBe(5);
    });

    it('should add negative numbers correctly', () => {
      const result = calculator.add(-2, -3);
      expect(result).toBe(-5);
    });

    it('should add to history', () => {
      calculator.add(2, 3);
      const history = calculator.getHistory();
      expect(history).toContain('2 + 3 = 5');
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers correctly', () => {
      const result = calculator.subtract(5, 3);
      expect(result).toBe(2);
    });

    it('should handle negative results', () => {
      const result = calculator.subtract(3, 5);
      expect(result).toBe(-2);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      const result = calculator.multiply(4, 5);
      expect(result).toBe(20);
    });

    it('should handle multiplication by zero', () => {
      const result = calculator.multiply(5, 0);
      expect(result).toBe(0);
    });
  });

  describe('divide', () => {
    it('should divide two numbers correctly', () => {
      const result = calculator.divide(10, 2);
      expect(result).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Cannot divide by zero');
    });

    it('should handle decimal results', () => {
      const result = calculator.divide(10, 3);
      expect(result).toBeCloseTo(3.333, 3);
    });
  });

  describe('history', () => {
    it('should track all operations', () => {
      calculator.add(1, 2);
      calculator.subtract(5, 3);
      calculator.multiply(2, 4);

      const history = calculator.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0]).toBe('1 + 2 = 3');
      expect(history[1]).toBe('5 - 3 = 2');
      expect(history[2]).toBe('2 * 4 = 8');
    });

    it('should clear history', () => {
      calculator.add(1, 2);
      calculator.clearHistory();

      const history = calculator.getHistory();
      expect(history).toHaveLength(0);
    });
  });
});
