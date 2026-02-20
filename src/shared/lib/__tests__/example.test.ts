import { describe, it, expect } from 'vitest'

describe('Example Unit Test', () => {
  it('should add numbers correctly', () => {
    const result = 2 + 2
    expect(result).toBe(4)
  })

  it('should handle strings properly', () => {
    const str = 'hello'
    expect(str).toBe('hello')
    expect(str.length).toBe(5)
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr[0]).toBe(1)
  })
})