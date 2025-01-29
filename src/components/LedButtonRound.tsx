import React from 'react'
import { LED } from './ColoredLed'

export interface LEDButtonRound {
    on: boolean
    onClick: () => void
    ledColor: string
    shape?: 'oval' | 'round' | 'rectangle'
    semiTransparent?: boolean
    buttonColor?: string
}


export const LEDButtonRound: React.FC<LEDButtonRound> = ({ on, onClick, ledColor, shape = 'oval', semiTransparent = true, buttonColor = 'grey' }) => {
    const borderRadius = shape === 'oval' || shape === 'round' ? '50%' : '0.2rem'
    return (
        <button style={{
            width: shape === 'round' ? '3rem' : '4rem',
            height: shape === 'round' ? '3rem' : '2rem',
            background: (on && semiTransparent) ? ledColor : buttonColor,
            borderRadius: borderRadius,
            cursor: 'pointer',
            borderStyle: 'outset',
            borderWidth: '0.2rem',
            borderColor: (on && semiTransparent) ? ledColor : buttonColor,
            position: 'relative',
        }}
            onClick={onClick}
        >
            <div style={{
                background: on && semiTransparent ? buttonColor : buttonColor,
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: borderRadius,
                opacity: 0.5,
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'absolute',
                width: '0.5rem',
                height: '0.5rem',
                left: 'calc(50% - 0.25rem)',
                top: '0.25rem',
                zIndex: 1,
            }}>
                <LED color={ledColor} on={on} sizeEm={0.5} />
            </div>

        </button>
    )
}