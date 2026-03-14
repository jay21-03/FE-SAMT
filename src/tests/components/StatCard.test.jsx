import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import StatCard from '../../components/StatCard'

describe('StatCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders title and value', () => {
    render(<StatCard title="Total Users" value={42} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
