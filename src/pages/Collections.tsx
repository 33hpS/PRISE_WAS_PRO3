/**
 * Collections page wrapper
 * Purpose: prevent unresolved imports by using the existing CollectionsManager component.
 * Visual: simple container with consistent spacing.
 */

import React from 'react'
import CollectionsManager from '../components/CollectionsManager'

/**
 * Collections page component
 * Renders the full collections CRUD via CollectionsManager.
 */
export default function Collections(): JSX.Element {
  return (
    <div className='max-w-6xl mx-auto p-6'>
      <CollectionsManager />
    </div>
  )
}
