import ky from 'ky'

export const apiClient = ky.create({
  prefix: '/api/',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})
