import {
  useMutation,
  useQuery,
  type UseMutationOptions
} from '@tanstack/react-query'
import { homeworkService } from '../services/homework'
import type {
  CreateHomeworkBody,
  CreateHomeworkResponse,
  HomeworkListResponse,
  PracticeResponse
} from '../../../shared/types'

type homeworkId = string

export const useCreateHomework = () =>
  useMutation<CreateHomeworkResponse, Error, CreateHomeworkBody>({
    mutationFn: homeworkService.create
  })

export const useStudentHomework = () =>
  useQuery<HomeworkListResponse, Error>({
    queryKey: ['student-homework'],
    queryFn: homeworkService.listForStudent
  })

export const useTeacherStudentHomework = (studentId: string) =>
  useQuery<HomeworkListResponse, Error>({
    queryKey: ['teacher-student-homework', studentId],
    queryFn: () => homeworkService.listForTeacherStudent(studentId),
    enabled: !!studentId
  })

export const usePracticeOnce = (
  options?: UseMutationOptions<PracticeResponse, Error, string>
) =>
  useMutation<PracticeResponse, Error, homeworkId>({
    mutationFn: homeworkService.practiceOnce,
    ...options
  })
