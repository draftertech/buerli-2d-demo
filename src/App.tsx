import * as THREE from 'three'
import { useEffect, useLayoutEffect, useRef, useState, ChangeEvent } from 'react'
import { ViewType, history, EdgeTypes } from '@buerli.io/headless'
import { headless, BuerliGeometry } from '@buerli.io/react'
import { Canvas } from '@react-three/fiber'
import {
  Resize,
  Center,
  Bounds,
  OrbitControls,
  Environment,
} from '@react-three/drei'
import { message } from 'antd'
import 'antd/dist/antd.css'

const buerli = headless(history, 'ws://localhost:9091')

export default function App() {
  const drawingId = buerli.useDrawingId()
  const [file, setFile] = useState<File | null>(null);
  const [fileLoaded, setFileLoaded] = useState(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
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
          <button onClick={() => document.querySelector('input[type="file"]')?.click()}>Select File</button> 
        </div>
      )}
      <Canvas shadows gl={{ antialias: true }} orthographic camera={{ position: [0, 2.5, 10], zoom: 100 }}>
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight />
        <spotLight position={[-10, 5, -15]} angle={0.2} castShadow />
        <Scene drawingId={drawingId} file={file} setFileLoaded={setFileLoaded} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI} />
        <Environment preset="city" />
      </Canvas>
    </>
  )
}

function isValidExtension(ext) {
  return ['step', 'stp'].includes(ext)
}

function Scene({ drawingId, file, setFileLoaded, width = 50, ...props }) {
  const geometry = useRef()
  useEffect(() => {
    if (!file) return // Don't execute if no file is selected

    buerli.run(async api => {
      // Read the blob content using FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async () => {
          const ext = file.name.split('.').pop().toLowerCase() || ''
          if (!isValidExtension(ext)) {
            message.error('Invalid file format. Please upload a .stp or .step file.')
            throw new Error('Only accepting *.stp or *.step files.')
          }
          setFileLoaded(true)
          const result = reader.result
          const [prod] = await api.load(result, 'stp')

          await api.create2DViews(prod, [ViewType.ISO])
          await api.place2DViews(prod, [{ viewType: ViewType.ISO, vector: { x: 0, y: 0, z: 0 } }])

          const selection = (await api.selectGeometry(EdgeTypes, 2)).map(sel => sel.graphicId)

          resolve(prod)
        }

        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    })
  }, [file])

  useLayoutEffect(() => {
    geometry.current?.traverse(obj => {
      obj.receiveShadow = obj.castShadow = true
      if (obj.type === 'Mesh') {
        obj.material = new THREE.MeshStandardMaterial({ color: 'lightgray', roughness: 1.0 })
        // This reduces z-fighting between this mesh and the line segments
        obj.material.polygonOffset = true
        obj.material.polygonOffsetFactor = 1
        obj.material.polygonOffsetUnits = 1
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
