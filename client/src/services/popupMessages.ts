import axios from 'axios'
import type { StartupAnnouncement } from '../utils/startupAnnouncements'

export type PopupMessagesResponse = {
  messages: StartupAnnouncement[]
}

export const popupMessagesService = {
  getAll: async (): Promise<PopupMessagesResponse> => {
    const response = await axios.get('/api/popup-messages', {
      withCredentials: true
    })
    return response.data
  }
}
