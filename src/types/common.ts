export interface StandardError {
  statusCode?: number
  error?: string | { code?: number; message?: string }
  message?: string
  timestamp?: string
}

export interface PageableQuery {
  page?: number
  size?: number
  sort?: string[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Envelope<T> {
  data: T
  timestamp: string
}
