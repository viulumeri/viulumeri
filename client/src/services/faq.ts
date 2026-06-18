
import axios from 'axios'

export interface FAQBlock {
  type: 'text' | 'image'
  content?: string
  imageUrl?: string
  order: number
}

export interface FAQ {
  _id?: string
  question: string
  blocks: FAQBlock[]
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
}

export type DraftFaqBlock =
  | {
      id: string
      type: 'text'
      content: string
    }
  | {
      id: string
      type: 'image'
      file: File | null
      imageUrl?: string
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
  formData: FormData
): Promise<FAQ> => {
  const response = await axios.put(
  `/api/admin/faq/${id}`,
  formData,
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