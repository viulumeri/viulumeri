import React from 'react'

type HeaderProps = {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
  paddingClass?: string
}

export const Header = ({
  left,
  center,
  right,
  sticky = true,
  paddingClass = 'px-4'
}: HeaderProps) => {
  return (
    <header className={`${sticky ? 'sticky top-0' : ''} z-10 bg-neutral-900 ${paddingClass} pt-4 flex items-center`}>
      <div className="w-10 flex justify-start">{left}</div>
      <div className="flex-grow pl-2">{center}</div>
      <div className="w-10 flex justify-end">{right}</div>
    </header>
  )
}
