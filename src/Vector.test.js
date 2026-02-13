import Vector from './Vector.js';

describe('Vector', () => {
  it('should create a vector with the correct coordinates', () => {
    const vec = new Vector(3, 4);
    expect(vec.x).toBe(3);
    expect(vec.y).toBe(4);
  });

  it('should calculate the length of the vector', () => {
    const vec = new Vector(3, 4);
    expect(vec.getLength()).toBe(5);
  });

  it('should normalize the vector', () => {
    const vec = new Vector(3, 4);
    const normalized = vec.normalized();
    expect(normalized.getLength()).toBeCloseTo(1);
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
  });

  it('should multiply the vector by a scalar', () => {
    const vec = new Vector(3, 4);
    vec.multipleVectorByScalar(2);
    expect(vec.x).toBe(6);
    expect(vec.y).toBe(8);
  });

  it('should set and get x and y coordinates', () => {
    const vec = new Vector(1, 2);
    vec.x = 5;
    vec.y = 10;
    expect(vec.x).toBe(5);
    expect(vec.y).toBe(10);
    expect(vec.getX()).toBe(5);
    expect(vec.getY()).toBe(10);
  });
});
