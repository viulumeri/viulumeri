
import axios from 'axios'

export interface FAQ {
  _id?: string
  question: string
  answer: string
  order: number
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export const faqService = {
  getFaqs: async (): Promise<FAQ[]> => {
    const response = await axios.get('/api/faq', {
      withCredentials: true
    })

    return response.data
  },

  createFaq: async (formData: FormData) => {
  const response = await axios.post(
    '/api/admin/faq',
    formData,
    {
      withCredentials: true
    }
  )

  return response.data
},

 updateFaq: async (
  id: string,
  body: Partial<FAQ> | FormData
): Promise<FAQ> => {
  const response = await axios.put(
    `/api/admin/faq/${id}`,
    body,
    {
      withCredentials: true
    }
  )

  return response.data
},

  deleteFaq: async (id: string): Promise<void> => {
    await axios.delete(
      `/api/admin/faq/${id}`,
      {
        withCredentials: true
      }
    )
  }
}