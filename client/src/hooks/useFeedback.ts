import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { feedbackService } from '../services/feedback'
import type { SubmitFeedbackBody, SubmitFeedbackResponse } from '../../../shared/types'

export const useSubmitFeedback = (
  options?: UseMutationOptions<SubmitFeedbackResponse, Error, SubmitFeedbackBody>
) => useMutation({ mutationFn: feedbackService.submit, ...options })
