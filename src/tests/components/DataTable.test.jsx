import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataTable from '../../components/DataTable'

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
  ]

  it('renders loading state', () => {
    render(<DataTable columns={columns} data={[]} loading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders empty state message', () => {
    render(<DataTable columns={columns} data={[]} loading={false} emptyMessage="No rows" />)
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })

  it('renders rows and supports custom key field', () => {
    const data = [{ userId: 7, name: 'Alice', status: 'ACTIVE' }]
    render(<DataTable columns={columns} data={data} loading={false} keyField="userId" />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })
})
