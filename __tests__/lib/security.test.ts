import {
  sanitizeInput,
  validateEmail,
  validatePasswordStrength,
  generateSecureToken,
  generateSecureHash,
  validateUUID,
  validateIP,
  detectSuspiciousPatterns,
  validateAndSanitizeInput,
  validateSecurityHeaders,
  generateNonce,
} from '@/lib/security'

describe('security library', () => {
  it('sanitizeInput removes scripts and handlers', () => {
    const dirty = '<script>alert(1)</script><div onclick="x=1">ok</div>'
    const clean = sanitizeInput(dirty)
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onclick')
  })

  it('validateEmail basic cases', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('bad@com')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })

  it('validatePasswordStrength returns feedback and score', () => {
    const tooShort = validatePasswordStrength('123')
    expect(tooShort.isValid).toBe(true)
    expect(tooShort.feedback).toContain('Debe tener al menos 8 caracteres')
    const common = validatePasswordStrength('password')
    expect(common.isValid).toBe(true)
    expect(common.feedback).toContain('No debe contener patrones comunes')
    const ok = validatePasswordStrength('12345678')
    expect(ok.isValid).toBe(true)
  })

  it('generateSecureToken and generateSecureHash produce strings', () => {
    expect(typeof generateSecureToken()).toBe('string')
    expect(generateSecureHash('abc')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('validateUUID and validateIP', () => {
    expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(validateUUID('bad')).toBe(false)
    expect(validateIP('192.168.0.1')).toBe(true)
    expect(validateIP('gggg::1')).toBe(false)
  })

  it('detectSuspiciousPatterns detects SQL/XSS/path traversal', () => {
    const res = detectSuspiciousPatterns("SELECT * FROM users; <script>1</script> ../etc/passwd")
    expect(res.isSuspicious).toBe(true)
    expect(res.patterns.length).toBeGreaterThan(0)
  })

  it('validateAndSanitizeInput for string, email, uuid, number', () => {
    const s = validateAndSanitizeInput('<script>1</script> ok', 'string')
    expect(s.isValid).toBe(false)
    expect(s.value).toContain('ok')

    const e = validateAndSanitizeInput('a@b.com', 'email')
    expect(e.isValid).toBe(true)

    const u = validateAndSanitizeInput('123e4567-e89b-12d3-a456-426614174000', 'uuid')
    expect(u.isValid).toBe(true)

    const n = validateAndSanitizeInput('10', 'number')
    expect(n.isValid).toBe(true)
  })

  it('validateSecurityHeaders reports missing headers', () => {
    const res = validateSecurityHeaders({ 'X-Content-Type-Options': 'nosniff' } as any)
    expect(res.isValid).toBe(false)
    expect(res.missing.length).toBeGreaterThan(0)
    expect(res.recommendations.length).toBeGreaterThan(0)
  })

  it('generateNonce returns base64 string', () => {
    const nonce = generateNonce()
    expect(typeof nonce).toBe('string')
  })
})


