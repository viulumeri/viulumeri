// client/src/components/BananaButton.tsx
import { useState } from 'react'
import { Banana as BananaIcon } from 'lucide-react'

type Banana = {
  id: number
  left: number
  rotation: number
}

export const BananaButton = () => {
  const [bananas, setBananas] = useState<Banana[]>([])

  const dropBanana = () => {
    const id = Date.now()

    setBananas((current) => [
      ...current,
      {
        id,
        left: Math.random() * 85 + 5,
        rotation: Math.random() * 120 - 60
      }
    ])

    window.setTimeout(() => {
      setBananas((current) => current.filter((banana) => banana.id !== id))
    }, 1800)
  }

  return (
    <>
      <button
        type="button"
        onClick={dropBanana}
        className="bg-transparent p-0 text-yellow-300 hover:text-yellow-200"
        aria-label="Drop banana"
      >
        <BananaIcon className="w-8 h-8" />
      </button>

      <div className="banana-layer" aria-hidden="true">
        {bananas.map((banana) => (
          <div
            key={banana.id}
            className="falling-banana"
            style={{
              left: `${banana.left}%`,
              '--banana-rotation': `${banana.rotation}deg`
            } as React.CSSProperties}
          >
            <BananaIcon className="w-10 h-10 text-yellow-300" />
          </div>
        ))}
      </div>
    </>
  )
}