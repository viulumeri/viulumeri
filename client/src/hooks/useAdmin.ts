import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { adminService, type SummaryResponse, type Teacher, type Student } from '../services/admin'

export const useAdminSummary = (
  options?: Omit<UseQueryOptions<SummaryResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminService.getAdminSummary,
    ...options
  })

export const useAdminTeachers = (
  options?: Omit<UseQueryOptions<{ teachers: Teacher[] }, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: adminService.getAdminTeachers,
    ...options
  })

export const useAdminStudents = (
  options?: Omit<UseQueryOptions<{ students: Student[] }, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'students'],
    queryFn: adminService.getAdminStudents,
    ...options
  })
