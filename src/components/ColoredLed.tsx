import React from 'react'

export interface LEDProps {
    color: string
    on: boolean
}

export const LED: React.FC<LEDProps> = ({ color, on }) => {
    return <div
    style={{
      width: '1em',
      height: '1em',
      borderRadius: '50%',
      backgroundColor: color,
      position: 'relative',
    }}>
    <div style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: '50%',
      backgroundColor: 'black',
      opacity: on ? '0%' : '70%'
    }} />
  </div>
}