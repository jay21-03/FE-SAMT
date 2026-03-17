import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('renders pagination and handles next/previous actions', () => {
    const onPageChange = vi.fn()
    const data = [{ id: 1, name: 'Alice', status: 'ACTIVE' }]

    render(
      <DataTable
        columns={columns}
        data={data}
        loading={false}
        pagination={{ page: 1, totalPages: 3, onPageChange }}
      />
    )

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2)
  })
})
