export const ADMIN_REGULAR_USER_VIEW_KEY = 'adminRegularUserView'

export const isAdminRegularUserViewEnabled = (): boolean => {
  return localStorage.getItem(ADMIN_REGULAR_USER_VIEW_KEY) === 'true'
}

export const enableAdminRegularUserView = () => {
  localStorage.setItem(ADMIN_REGULAR_USER_VIEW_KEY, 'true')
}

export const disableAdminRegularUserView = () => {
  localStorage.removeItem(ADMIN_REGULAR_USER_VIEW_KEY)
}
