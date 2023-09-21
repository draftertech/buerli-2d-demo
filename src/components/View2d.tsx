import React from 'react'
import * as THREE from 'three'
import { useDrawing } from '@buerli.io/react'
import { DrawingID } from '@buerli.io/core'
import 'antd/dist/antd.css'
import Entity from './Entity'

interface View2dProps {
  drawingId: DrawingID
  view2dId: number
}

/**
 * Get the entities of the 2D view object and render them.
 *
 * The object lives in the structure area of the buerli drawing state
 * and points to the corresponding entities in the graphic/geometry areas.
 *
 * @param drawingId The buerli drawing id
 * @param view2dId The id of the 2D view object
 */
export default function View2d({ drawingId, view2dId }: View2dProps) {
  const entityIds = useDrawing(drawingId, d => d.structure.tree[view2dId]?.geometryIdList)
  return entityIds ? (
    <>
      {entityIds.map(id => (
        <Entity key={id} drawingId={drawingId} entityId={id} color={new THREE.Color('black')} lineWidth={3.0} />
      ))}
    </>
  ) : null
}
