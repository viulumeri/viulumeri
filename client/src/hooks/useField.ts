import { useState } from 'react'

export const useField = (type: string) => {
  const [value, setValue] = useState('')

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  const reset = () => {
    setValue('')
  }

  return {
    props: {
      type,
      value,
      onChange
    },
    reset,
    value
  }
}
