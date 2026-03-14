import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DebouncedSearchInput from '../../components/DebouncedSearchInput'

describe('DebouncedSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('calls onChange with debounce delay', () => {
    const onChange = vi.fn()
    render(<DebouncedSearchInput delay={300} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'group-1' } })

    vi.advanceTimersByTime(299)
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onChange).toHaveBeenCalledWith('group-1')
  })

  it('uses custom placeholder', () => {
    render(<DebouncedSearchInput placeholder="Search groups" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search groups')).toBeInTheDocument()
  })
})
