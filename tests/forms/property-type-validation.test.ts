import { getPropertyTypeOptions } from '@/lib/forms/form-config'

describe('Property Type Validation', () => {
  it('resale category only allows HDB, Private, Landed', () => {
    const options = getPropertyTypeOptions('new_purchase', 'resale')
    const values = options.map(opt => opt.value)

    expect(values).toEqual(['HDB', 'Private', 'Landed'])
    expect(values).not.toContain('EC')
  })

  it('new_launch category only allows EC, Private, Landed', () => {
    const options = getPropertyTypeOptions('new_purchase', 'new_launch')
    const values = options.map(opt => opt.value)

    expect(values).toEqual(['EC', 'Private', 'Landed'])
    expect(values).not.toContain('HDB')
  })

  it('labels are clean without category suffixes', () => {
    const resaleOptions = getPropertyTypeOptions('new_purchase', 'resale')
    const newLaunchOptions = getPropertyTypeOptions('new_purchase', 'new_launch')
    const btoOptions = getPropertyTypeOptions('new_purchase', 'bto')

    // Check resale labels
    resaleOptions.forEach(opt => {
      expect(opt.label).not.toContain('(Resale)')
      expect(opt.label).not.toContain('(New Launch)')
      expect(opt.label).not.toContain('(BTO)')
    })

    // Check new launch labels
    newLaunchOptions.forEach(opt => {
      expect(opt.label).not.toContain('(Resale)')
      expect(opt.label).not.toContain('(New Launch)')
      expect(opt.label).not.toContain('(BTO)')
    })

    // Check BTO labels
    btoOptions.forEach(opt => {
      expect(opt.label).not.toContain('(Resale)')
      expect(opt.label).not.toContain('(New Launch)')
      expect(opt.label).not.toContain('(BTO)')
    })
  })
})
