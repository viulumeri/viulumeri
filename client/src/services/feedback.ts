import axios from 'axios'
import type { SubmitFeedbackBody, SubmitFeedbackResponse } from '../../../shared/types'

const baseUrl = '/api/feedback'

export const feedbackService = {
  submit: async (body: SubmitFeedbackBody): Promise<SubmitFeedbackResponse> => {
    try {
      const response = await axios.post(baseUrl, body, {
        withCredentials: true
      })
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const serverError = (error.response?.data as any)?.error
        if (status === 400) {
          if (serverError === 'Invalid title') {
            throw new Error('Otsikon pitää olla 1–200 merkkiä.')
          }
          if (serverError === 'Invalid message') {
            throw new Error('Palautteen pitää olla 5–4000 merkkiä.')
          }
          if (serverError === 'Invalid category') {
            throw new Error('Valitse kelvollinen kategoria.')
          }
          if (serverError === 'Invalid submission') {
            throw new Error('Lähetys hylättiin (spam-suoja).')
          }
          if (typeof serverError === 'string' && serverError.trim()) {
            throw new Error(serverError)
          }
          throw new Error('Virheellinen palaute. Tarkista kentät ja yritä uudelleen.')
        }
        if (status === 429) {
          throw new Error(
            'Olet lähettänyt liikaa palautetta. Odota hetki ja yritä myöhemmin uudelleen.'
          )
        }
        if (status === 401) {
          throw new Error('Kirjaudu sisään lähettääksesi palautetta.')
        }
        if (status === 403) {
          throw new Error('Sinulla ei ole oikeuksia lähettää palautetta.')
        }
      }

      throw error instanceof Error ? error : new Error('Palautteen lähetys epäonnistui')
    }
  }
}
