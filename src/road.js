import Env from './env'
import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'
import { Vector3 } from 'three'

export default class Road {

  constructor() {
    this.env = new Env()
    this.scene = this.env.scene
    this.camera = this.env.camera
    this.position = new THREE.Vector3()

    this.curveData = {
      x: 0,
      y: 0,
      z: -30,
      distance: 10,
      frequency: 0
    }

    this.segments = 1000 // number of segments
    this.tracks = 3 // number of tracks
    this.loopTime = 10 * 2000

    this.curve = this.createCurve()
    this.createRoad(this.curve)
    this.createFog()
    
    //this.createLights()
    //this.createBox()
  }

  createFog() {
    this.scene.fog = new THREE.Fog(new THREE.Color(0x000000), 5, 20)
  }

  createRoad(curve) {
    this.createGeometry(curve)
    this.createMaterial()
    this.createMesh()
  }

  createBox() {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000
    })
    this.box = new THREE.Mesh(geometry, material)
    this.scene.add(this.box)
  }

  createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    this.scene.add(ambientLight)
    const pointLight = new THREE.DirectionalLight(0xffffff, 0.1, 10)
    pointLight.position.set(0, 10, 0)
    this.scene.add(pointLight)
  }

  createIndices() {
    let idx = 0, indices = []
    const segments = this.segments
    const tracks = this.tracks 
    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < tracks; i++ ) {

        const a =  (tracks + 1) * j + i
        const b1 = (tracks + 1) * (j + 1) + i
        const c1 = (tracks + 1) * (j + 1) + 1 + i
        const b2 = (tracks + 1) * (j + 1) + 1 + i
        const c2 = (tracks + 1) * j + 1 + i
        
        indices[idx] = a
        indices[idx + 1] = c1
        indices[idx + 2] = b1
    
        indices[idx + 3] = a
        indices[idx + 4] = c2
        indices[idx + 5] = b2

        this.geometry.addGroup(idx, 6, i)
        idx += 6
      }
    }
    return indices
  }

  createCurve() {
    // const data = []
    // let x = this.curveData.x
    // let y = this.curveData.y
    // let z = this.curveData.z
    // let distance = this.curveData.distance
    // let frequency = this.curveData.frequency

    // for(let i = 0; i < distance; i++) {
    //   x += Math.sin(frequency * 30) * 20 + 20
    //   y += Math.sin(frequency * 50) * 2
    //   z += Math.sin(frequency * 30 + 10) * 10 + 10
    //   data.push(
    //     new THREE.Vector3(x, y, z)
    //   )
    //   frequency += 0.1
    // }

    // const curve = new THREE.CatmullRomCurve3(data)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3( -25, 0, -25 ),
      new THREE.Vector3( -4, 2, -9 ),
      new THREE.Vector3( 4, 1, -6 ),
      new THREE.Vector3( 6, 0, 0 ),
      new THREE.Vector3( -3, 1, 1 ),
      new THREE.Vector3( -11, 0, 6 ),
      new THREE.Vector3( -12, 1, 1 ),
      new THREE.Vector3( -7, 1, -3 ),
      new THREE.Vector3( 7, 8, -9 ),
      new THREE.Vector3( 13, 2, -12 ),
      new THREE.Vector3( 10, 1, -20 )
    ])
    return curve
  }

  createGeometry(curve) {

    const segments = this.segments
    const tracks = this.tracks 
    const faceCount = segments * tracks * 2
    const vertexCount = (segments + 1) * (tracks + 1)

    this.geometry = new THREE.BufferGeometry()

    const vertices = new Float32Array(vertexCount * 3)
    const normals = new Float32Array(vertexCount * 3)
    const uvs = new Float32Array(vertexCount * 2)


    const indices = this.createIndices()
    const points = curve.getPoints(segments)

    let posIdx = 0, vIdx = 0
    
    const d = [ -0.52, -0.5, 0.5, 0.52 ]
    for (let j = 0; j < segments + 1; j++ ) { 
      for(let i = 0; i < tracks + 1; i++) { 
        
        let normal = new THREE.Vector3(0, 0, 0)
        let binormal = new THREE.Vector3(0, 1, 0)
        let tangent = curve.getTangent(j / segments)
        normal.crossVectors(tangent, binormal)
        binormal.crossVectors(normal, tangent)
        normal.y = 0
        normal.normalize()
        //binormal.normalize()

        const lxz = Math.sqrt(normal.x * normal.x + normal.z * normal.z + normal.y * normal.y)
        const nx = normal.x / lxz
		    const nz = normal.z / lxz
        const ny = normal.y / lxz

        let x = points[ j ].x + d[i] * nx
        let y = points[ j ].y + d[i] * ny
        let z = points[ j ].z + d[i] * nz

        posIdx = vIdx * 3
        
        vertices[posIdx]  = x
        vertices[posIdx + 1]  = y
        vertices[posIdx + 2]  = z


        normals[posIdx] = binormal.x
        normals[posIdx + 1] = binormal.y
        normals[posIdx + 2] = binormal.z
        vIdx++
      }
    }

    const len = curve.getLength()
    const lenList = curve.getLengths(segments)
    let uvIdxCount = 0

    for(let j = 0; j < segments + 1; j ++) {
      for(let i = 0; i < tracks + 1; i ++) {
        uvs[uvIdxCount] = lenList[j] / len
		    uvs[uvIdxCount + 1] = i / tracks
		    uvIdxCount += 2
      }
    }	

    this.geometry.setIndex(indices)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    
    this.normals = normals
  }

  createMaterial() {
    const roadImage = require('./img/road.png')
    const tex = new THREE.TextureLoader().load(roadImage)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(200, 1)

    this.material = [
      new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true  } ),
      new THREE.MeshBasicMaterial( { map:tex, wireframe:  true  } ),
      new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true  } )
    ]
  }

  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    const helper = new VertexNormalsHelper(this.mesh, 0.5, 0xff0000, 1)
    this.scene.add(helper)
  }

  update() {

    const time = Date.now()
    const looptime = this.loopTime
    const t = ( time % looptime ) / looptime
    if(this.curve) {
    
      const normal = new Vector3()
      const binormal = new Vector3(0, 1, 0)
      const direction = this.curve.getTangentAt(t)
      normal.crossVectors(direction, binormal)
      binormal.crossVectors(normal, direction)
      normal.normalize()
      binormal.normalize()

      let position = this.curve.getPointAt(t)
      const next = t + 0.005 > 1 ? 1 : t + 0.005
      let lookAt = this.curve.getPointAt(next)


      let newPoistion = position.clone().add(binormal.multiplyScalar(0.3))
      lookAt.add(binormal.multiplyScalar(0.1))
      
      //position.add(binormal.multiplyScalar(0.5))  
      //lookAt.add(binormal.multiplyScalar(0.3))


      // this.camera.position.copy(newPoistion)
  
      // this.camera.matrix.lookAt(position, lookAt, binormal)
      // this.camera.quaternion.setFromRotationMatrix(this.camera.matrix)
 
    }
  }

}