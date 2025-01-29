import React from 'react'

export interface LEDProps {
  color: string
  on: boolean
  sizeEm?: number
}

export const LED: React.FC<LEDProps> = ({ color, on, sizeEm = 1 }) => {
  const glow_size = sizeEm * 1.5
  return <div
    style={{
      width: `${sizeEm}em`,
      height: `${sizeEm}em`,
      borderRadius: '50%',
      backgroundColor: color,
      position: 'relative',
    }}>
    <div
      style={{
        position: 'absolute',
        top: `${-glow_size}em`,
        bottom: `${-glow_size}em`,
        left: `${-glow_size}em`,
        right: `${-glow_size}em`,
        borderRadius: '50%',
        backgroundColor: 'white',
        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 4%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0) 70%)',
        opacity: on ? '100%' : '0',
        mixBlendMode: 'plus-lighter',
      }} />
    <div
      style={{
        position: 'absolute',
        top: `${-glow_size}em`,
        bottom: `${-glow_size}em`,
        left: `${-glow_size}em`,
        right: `${-glow_size}em`,
        borderRadius: '50%',
        backgroundColor: 'white',
        background: `radial-gradient(circle, ${color} 0%, ${color} 10%, rgba(0,0,0,0) 70%)`,
        opacity: on ? '20%' : '0',
        mixBlendMode: 'plus-lighter',
      }} />
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