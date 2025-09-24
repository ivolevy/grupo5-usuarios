import { countries } from '@/lib/countries'

describe('Countries Data', () => {
  it('should be an array', () => {
    expect(Array.isArray(countries)).toBe(true)
  })

  it('should contain country objects with required properties', () => {
    countries.forEach(country => {
      expect(country).toHaveProperty('code')
      expect(country).toHaveProperty('name')
      expect(typeof country.code).toBe('string')
      expect(typeof country.name).toBe('string')
    })
  })

  it('should have unique country codes', () => {
    const codes = countries.map(country => country.code)
    const uniqueCodes = [...new Set(codes)]
    expect(codes.length).toBe(uniqueCodes.length)
  })

  it('should have unique country names', () => {
    const names = countries.map(country => country.name)
    const uniqueNames = [...new Set(names)]
    expect(names.length).toBe(uniqueNames.length)
  })

  it('should contain common countries', () => {
    const countryNames = countries.map(country => country.name)
    const countryCodes = countries.map(country => country.code)
    
    // Check for some common countries
    expect(countryNames).toContain('Argentina')
    expect(countryNames).toContain('Brasil')
    expect(countryNames).toContain('Chile')
    expect(countryNames).toContain('Estados Unidos')
    expect(countryNames).toContain('España')
    
    // Check for some common country codes
    expect(countryCodes).toContain('AR')
    expect(countryCodes).toContain('BR')
    expect(countryCodes).toContain('CL')
    expect(countryCodes).toContain('US')
    expect(countryCodes).toContain('ES')
  })

  it('should have country codes in uppercase', () => {
    countries.forEach(country => {
      expect(country.code).toBe(country.code.toUpperCase())
    })
  })

  it('should have non-empty country codes and names', () => {
    countries.forEach(country => {
      expect(country.code.trim()).not.toBe('')
      expect(country.name.trim()).not.toBe('')
    })
  })

  it('should have country codes of appropriate length (typically 2 characters)', () => {
    countries.forEach(country => {
      expect(country.code.length).toBeGreaterThanOrEqual(2)
      expect(country.code.length).toBeLessThanOrEqual(3) // Most are 2, some might be 3
    })
  })

  it('should be sorted alphabetically by name', () => {
    const sortedNames = [...countries].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    const actualNames = countries.map(country => country.name)
    expect(actualNames).toEqual(sortedNames.map(country => country.name))
  })

  it('should contain at least 100 countries', () => {
    expect(countries.length).toBeGreaterThanOrEqual(100)
  })

  describe('Specific country checks', () => {
    it('should have Argentina with correct code', () => {
      const argentina = countries.find(country => country.name === 'Argentina')
      expect(argentina).toBeDefined()
      expect(argentina?.code).toBe('AR')
    })

    it('should have Estados Unidos with correct code', () => {
      const usa = countries.find(country => country.name === 'Estados Unidos')
      expect(usa).toBeDefined()
      expect(usa?.code).toBe('US')
    })

    it('should have España with correct code', () => {
      const spain = countries.find(country => country.name === 'España')
      expect(spain).toBeDefined()
      expect(spain?.code).toBe('ES')
    })

    it('should have Brasil with correct code', () => {
      const brazil = countries.find(country => country.name === 'Brasil')
      expect(brazil).toBeDefined()
      expect(brazil?.code).toBe('BR')
    })
  })

  describe('Search functionality', () => {
    it('should be searchable by name', () => {
      const searchTerm = 'arg'
      const results = countries.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(country => country.name === 'Argentina')).toBe(true)
    })

    it('should be searchable by code', () => {
      const searchCode = 'AR'
      const result = countries.find(country => country.code === searchCode)
      expect(result).toBeDefined()
      expect(result?.name).toBe('Argentina')
    })
  })
})
