/**
 * @file Card.tsx
 * @description Обертка над шадсн Card c поддержкой className.
 */
import React from 'react'
import { Card as UICard } from '../ui/card'

/**
 * Card — универсальная карточка-обертка
 */
export default function Card(props: {
  className?: string
  children?: React.ReactNode
}): JSX.Element {
  const { className, children } = props
  return <UICard className={className}>{children}</UICard>
}
