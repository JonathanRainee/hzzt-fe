import { API_BASE_URL } from './env'

describe('API_BASE_URL', () => {
  it('is a non-empty path or URL', () => {
    expect(API_BASE_URL.length).toBeGreaterThan(0)
  })
})
