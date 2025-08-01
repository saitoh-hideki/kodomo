import React from 'react'

interface SugorokuBoardProps {
  position: number
  theme: string
}

export default function SugorokuBoard({ position, theme }: SugorokuBoardProps) {
  const totalSquares = 10

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalSquares }, (_, i) => (
          <div
            key={i}
            className={`
              relative w-16 h-16 flex items-center justify-center rounded-lg text-lg font-bold
              ${i === 0 ? 'bg-green-200 text-green-800' : 
                i === totalSquares - 1 ? 'bg-yellow-200 text-yellow-800' : 
                'bg-purple-100 text-purple-800'}
              ${position === i ? 'ring-4 ring-blue-500' : ''}
            `}
          >
            {i === 0 && '🌱'}
            {i === totalSquares - 1 && '🏁'}
            {i > 0 && i < totalSquares - 1 && i}
          </div>
        ))}
      </div>
      
      {position >= 0 && position < totalSquares && (
        <div
          className="absolute w-12 h-12 transition-all duration-500"
          style={{
            top: `${Math.floor(position / 5) * 72}px`,
            left: `${(position % 5) * 72}px`,
          }}
        >
          <div className="text-4xl animate-bounce">😺</div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-black">
          いま {position} マスめ！
        </p>
        <p className="text-sm text-black mt-1">
          あと {totalSquares - position - 1} マスで ゴール！
        </p>
      </div>
    </div>
  )
}