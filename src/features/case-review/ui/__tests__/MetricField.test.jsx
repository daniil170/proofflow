import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MetricField } from '../MetricField.jsx'

describe('MetricField', () => {
  it('renders safely when value is a string', () => {
    const handleValueChange = vi.fn()
    const handleLabelChange = vi.fn()

    render(
      <MetricField
        value="+140%"
        label="рост заявок"
        onValueChange={handleValueChange}
        onLabelChange={handleLabelChange}
      />
    )

    expect(screen.getByDisplayValue('+140%')).toBeDefined()
    expect(screen.getByDisplayValue('рост заявок')).toBeDefined()
  })

  it('renders safely when value is a number without throwing TypeError', () => {
    const handleValueChange = vi.fn()
    const handleLabelChange = vi.fn()

    render(
      <MetricField
        value={340}
        label="лидов в недвижимости"
        onValueChange={handleValueChange}
        onLabelChange={handleLabelChange}
      />
    )

    const input = screen.getByDisplayValue('340')
    expect(input).toBeDefined()

    fireEvent.change(input, { target: { value: '350' } })
    expect(handleValueChange).toHaveBeenCalledWith('350')
  })

  it('renders safely when value is undefined or empty string', () => {
    const handleValueChange = vi.fn()
    const handleLabelChange = vi.fn()

    render(
      <MetricField
        value={undefined}
        label=""
        onValueChange={handleValueChange}
        onLabelChange={handleLabelChange}
      />
    )

    expect(screen.getByText(/Какой был результат\? Впишите цифру/i)).toBeDefined()
  })
})
