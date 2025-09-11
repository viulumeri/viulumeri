import React from 'react'

type HeaderProps = {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
}

export const Header = ({ left, center, right }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-neutral-900 px-4 pt-4 flex items-center">
      <div className="w-10 flex justify-start">{left}</div>
      <div className="flex-grow pl-2">{center}</div>
      <div className="w-10 flex justify-end">{right}</div>
    </header>
  )
}
