export const ADMIN_POPUPS_UPDATED_EVENT = 'admin-popups-updated'

export const notifyAdminPopupsUpdated = () => {
  window.dispatchEvent(new CustomEvent(ADMIN_POPUPS_UPDATED_EVENT))
}