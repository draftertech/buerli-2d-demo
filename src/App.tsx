import * as THREE from 'three'
import { Group } from 'three'
import React, { useEffect, useLayoutEffect, useRef, useState, ChangeEvent } from 'react'
import { ViewType, history } from '@buerli.io/headless' // EdgeTypes
import { headless, BuerliGeometry } from '@buerli.io/react'
import { Canvas } from '@react-three/fiber'
import { Resize, Center, Bounds, OrbitControls, Environment } from '@react-three/drei'
import { message, Tabs } from 'antd'
import 'antd/dist/antd.css'
import { DrawingID } from '@buerli.io/core'

import View2d from './components/View2d'

const buerli = headless(history, 'ws://localhost:9091')

interface SceneProps {
  drawingId: DrawingID
  width?: number
  [key: string]: any
}

interface scene2DProps {
  drawingId: DrawingID
  prod: number | null
  width?: number
  [key: string]: any
}

export default function App() {
  const drawingId = buerli.useDrawingId()
  const [fileLoaded, setFileLoaded] = useState<boolean | null>(null)
  const [prod, setProd] = useState<number | null>(null)

  const handleFileLoad = async (selectedFile: File) => {
    try {
      const loadedProd = await loadPartFromFile(selectedFile)
      console.info('Loaded', selectedFile)
      setProd(loadedProd)
    } catch (error) {
      console.error('Failed to load part:', error)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0]
    if (selectedFile) {
      setFileLoaded(true)
      handleFileLoad(selectedFile)
    }
  }

  return (
    <>
      {!fileLoaded && (
        <div
          style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
          className={fileLoaded ? 'fade-out' : ''}>
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={input => input && input.click()}
          />
          <button onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
            Select File
          </button>
        </div>
      )}
      <Tabs
        defaultActiveKey="3D"
        onChange={key => console.info('Tab changed to:', key)}
        items={[
          {
            label: '3D',
            key: '3D',
            children: (
              <Canvas shadows gl={{ antialias: true }} orthographic camera={{ position: [0, 2.5, 10], zoom: 100 }}>
                <color attach="background" args={['#f0f0f0']} />
                <ambientLight />
                <spotLight position={[-10, 5, -15]} angle={0.2} castShadow />
                <Scene drawingId={drawingId} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI} />
                <Environment preset="city" />
              </Canvas>
            ),
          },
          {
            label: '2D',
            key: '2D',
            children: (
              <Canvas shadows gl={{ antialias: true }} orthographic camera={{ position: [0, 2.5, 10], zoom: 100 }}>
                <color attach="background" args={['#f0f0f0']} />
                <ambientLight />
                <Scene2D drawingId={drawingId} prod={prod} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI} />
                <Environment preset="city" />
              </Canvas>
            ),
          },
        ]}
      />
    </>
  )
}

function isValidExtension(ext: string) {
  return ['step', 'stp'].includes(ext)
}

async function loadPartFromFile(file: File): Promise<number | null> {
  return new Promise(async (resolve, reject) => {
    if (!file) {
      message.error('No file selected.')
      reject(new Error('No file selected.'))
      return
    }

    const ext = file?.name.split('.').pop()?.toLowerCase() || ''
    if (!isValidExtension(ext)) {
      message.error('Invalid file format. Please upload a .stp or .step file.')
      reject(new Error('Only *.stp or *.step files are allowed.'))
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      const result = reader.result
      if (result instanceof ArrayBuffer) {
        try {
          const prodArray = await buerli.run(api => api.load(result, 'stp'))
          if (!prodArray || prodArray.length === 0) {
            reject(new Error('Unable to load ArrayBuffer from file.'))
          } else {
            resolve(prodArray[0])
          }
        } catch (error) {
          reject(error)
        }
      } else {
        reject(new Error('Unexpected file content.'))
      }
    }

    reader.onerror = err => reject(err)
    reader.readAsArrayBuffer(file)
  })
}

function Scene({ drawingId, width = 50, ...props }: SceneProps) {
  const geometry = useRef<Group>(null)

  useLayoutEffect(() => {
    geometry.current?.traverse(obj => {
      obj.receiveShadow = obj.castShadow = true
      if (obj.type === 'Mesh') {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({ color: 'lightgray', roughness: 1.0 })
        // This reduces z-fighting between this mesh and the line segments
        mesh.material.polygonOffset = true
        mesh.material.polygonOffsetFactor = 1
        mesh.material.polygonOffsetUnits = 1
      }
    })
  })

  return (
    <group {...props}>
      <Bounds fit observe margin={1.75}>
        <Resize scale={2}>
          <Center top ref={geometry} rotation={[0, -Math.PI / 4, 0]}>
            <BuerliGeometry drawingId={drawingId} suspend selection />
          </Center>
        </Resize>
      </Bounds>
    </group>
  )
}

function Scene2D({ drawingId, prod, width = 50, ...props }: scene2DProps) {
  const geometry = useRef<Group>(null)
  const [view2dId, setview2dId] = useState<number | null>(null)

  useEffect(() => {
    const fetch2DView = async () => {
      if (!prod) return // exit early if prod unavailable
      try {
        const viewIdArray = await buerli.run(api => api.create2DViews(prod, [ViewType.TOP]))
        if (viewIdArray) {
          const [viewId] = viewIdArray
          console.info(viewId)
          setview2dId(viewId)
        }
      } catch (error) {
        console.error('Failed to create 2D views:', error)
      }
    }

    fetch2DView()
  }, [prod])

  return (
    <group {...props}>
      <Bounds fit observe margin={1.75}>
        <Resize scale={2}>
          <Center top ref={geometry} rotation={[0, -Math.PI / 4, 0]}>
            {view2dId !== null && <View2d drawingId={drawingId} view2dId={view2dId} />}
          </Center>
        </Resize>
      </Bounds>
    </group>
  )
}
