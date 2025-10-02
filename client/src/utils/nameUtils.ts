export const parseFirstLastName = (fullName: string) => {
  const spaceIndex = fullName.indexOf(' ')
  const firstName = spaceIndex !== -1 ? fullName.substring(0, spaceIndex) : fullName
  const lastName = spaceIndex !== -1 ? fullName.substring(spaceIndex + 1) : ''

  return { firstName, lastName }
}