import { useDrawing } from '@buerli.io/react'
import { DrawingID } from '@buerli.io/core'
import { useThree } from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'
import { Color } from 'three'
import { LineGeometry as LG } from 'three/examples/jsm/lines/LineGeometry'

interface EntityProps {
  drawingId: DrawingID
  entityId: number
  color: Color
  lineWidth: number
}

/**
 * Get the geometry of the given entity and render all curve segements.
 *
 * The _geometry_ area in the buerli drawing state contains three geometry objects
 * for each graphic object in the CAD model.
 *
 * The raw graphic sent from the ClassCAD server for the given entity can be
 * found in the _graphic.containers_ area of the buerli drawing state.
 *
 * @param drawingId The buerli drawing id
 * @param view2dId The id of the 2D view object
 */
export default function Entity({
  drawingId,
  entityId,
  color = new THREE.Color('black'),
  lineWidth = 3.0,
}: EntityProps) {
  const entity = useDrawing(drawingId, d => d.geometry.cache[entityId])

  const items = React.useMemo(() => {
    if (!entity || entity.meshes.length > 0) return [] // Ignore meshes entities, because we are only interested in curve segments here.
    return [...entity.lines, ...entity.edges, ...entity.arcs]
  }, [entity])

  return (
    <>
      {items.map(item => (
        <Item key={item.graphicId} line={item} color={color} lineWidth={lineWidth} />
      ))}
    </>
  )
}

interface ItemProps {
  line: any
  color: Color
  lineWidth: number
}

function Item({ line, color, lineWidth }: ItemProps) {
  const { size } = useThree()
  const primitive = line.geometry
  const lg = React.useMemo(() => {
    return new LG().setPositions(primitive.attributes.position.array)
  }, [primitive])
  const resolution = React.useMemo(() => new THREE.Vector2(size.width, size.height), [size])
  console.info('Generated line')
  return (
    <line2 geometry={lg} userData={line} renderOrder={600}>
      <lineMaterial
        attach="material"
        color={color}
        opacity={1.0}
        linewidth={lineWidth}
        dashed={false}
        resolution={resolution}
        transparent
        depthTest={true}
        depthWrite={false}
        polygonOffset
        polygonOffsetUnits={-1000}
      />
    </line2>
  )
}
