import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x7CB342 );
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const canvas = document.getElementById("experience-canvas")
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

let character = {
    instance: null,
    moveDistance: 5,
    jumpHeight: 1,
    isMoving: false,
    moveDuration: 0.2,
}

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 2.7

const modalContent = {
    'Project_1': {
        title: "Robot Pong Competition - 1st Place",
        content: "Built and programmed a LEGO Mindstorms robot using motors, ultrasonic and infrared sensors, with control logic developed in LabVIEW. Won by continuously refining mechanical setup and tuning control parameters to maximize scoring efficiency and ball transfer rate.",
        link: "https://www.youtube.com/watch?v=x8Aio5qC4fA"
    },
    'Project_2': {
        title: "Fire Escape Mixed Reality Experience",
        content: "Developed an immersive mixed reality game designed to simulate fire emergency scenarios and train users in proper evacuation and fire response procedures.",
        link: "https://www.youtube.com/watch?v=sfbiXcwaMRk"
    },
    'Project_3': {
        title: "Human–Robot Tic-Tac-Toe",
        content: "Built a human–robot interaction system where a TM5-900 collaborative robot plays tic-tac-toe against a person using real-time vision and autonomous decision-making. ",
        link: "https://www.youtube.com/watch?v=XGwxpwdxdEI"
    },
}

const modal = document.querySelector(".modal")
const modalTitle = document.querySelector(".modal-title")
const modalProjectDescription = document.querySelector(".modal-project-description")
const modalExitButton = document.querySelector(".modal-exit-button")
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button")

function showModal(id) {
    const content = modalContent[id]
    if (content) {
        modalTitle.textContent = content.title
        modalProjectDescription.textContent = content.content
        if(content.link) {
            modalVisitProjectButton.href = content.link
            modalVisitProjectButton.classList.remove("hidden")
        } else {
            modalVisitProjectButton.classList.add("hidden")
        }
        modal.classList.toggle("hidden") 
    }
}

function hideModal(){
    modal.classList.toggle("hidden")
}

let intersectedObject = ""
const intersectObjects = []
const intersectObjectsNames = ['Project_1', 'Project_2', 'Project_3', 'Name', 'Portal']

const loader = new GLTFLoader();
loader.load( 
    './portfolio_5.0.glb', 
    function ( glb ) {
        glb.scene.traverse((child) => {
            if (intersectObjectsNames.includes(child.name)) {
                intersectObjects.push(child)
            }
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
            if(child.name === "Character"){
                character.instance = child
                console.log(child)
            }
        })
        scene.add( glb.scene );
}, undefined, 
    function ( error ) {
        console.error( error );

} );

const sun = new THREE.DirectionalLight( 0xFFE5B4, 0.8 );
sun.castShadow = true
sun.position.set(-160,150,150)
// sun.target.position.set(75,,0)
sun.shadow.mapSize.width = 4096
sun.shadow.mapSize.height = 4096
sun.shadow.camera.left = -100
sun.shadow.camera.right = 100
sun.shadow.camera.top = 100
sun.shadow.camera.bottom = -100
sun.shadow.normalBias = 0.6
sun.shadow.radius = 4
scene.add( sun );

const shadowHelper = new THREE.CameraHelper( sun.shadow.camera );
// scene.add( shadowHelper );
const helper = new THREE.DirectionalLightHelper( sun, 5 );
// scene.add( helper );

const light = new THREE.AmbientLight( 0xCCCCCC, 1 ); // soft white light
scene.add( light );

const aspect = sizes.width / sizes.height

const camera = new THREE.OrthographicCamera( 
    -aspect * 50, 
    aspect * 50, 
    50, 
    -50, 1, 1000 );
scene.add( camera );

camera.position.x = -105
camera.position.y = 72
camera.position.z = 93

const controls = new OrbitControls( camera, canvas );
controls.update()





function onResize() {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    const aspect = sizes.width / sizes.height
    camera.left = -aspect * 50
    camera.right = aspect * 50
    camera.top = 50
    camera.bottom = -50
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function onClick(){
    console.log(intersectedObject)
    if (intersectedObject) {
        showModal(intersectedObject)
    }
}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 -1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function moveCharacter(targetPosition, targetRotation){
    character.isMoving = true

    const t1 = gsap.timeline({
        onComplete: ()=>{
            character.isMoving = false
        }
    })

    t1.to(character.instance.position,{
        x: targetPosition.x,
        z: targetPosition.z,
        duration: character.moveDuration,
    })

    t1.to(character.instance.rotation, {
        y: targetRotation,
        duration: character.moveDuration,
    },
    0
    )

    t1.to(character.instance.position, {
        y: character.instance.position.y + character.jumpHeight,
        duration: character.moveDuration/2,
        yoyo: true,
        repeat: 1,
    },
    0
    )

}

function onKeyDown(event) {
    if (character.isMoving) return

    console.log(event)
    const targetPosition = new THREE.Vector3().copy(character.instance.position)
    let targetRotation = 0
    
    switch(event.key.toLowerCase()){
        case "w":
        case "arrowup":
            targetPosition.x += character.moveDistance
            targetRotation = Math.PI / 2
            break
        case "s":
        case "arrowdown":
            targetPosition.x -= character.moveDistance
            targetRotation = - Math.PI / 2
            break
        case "a":
        case "arrowleft":
            targetPosition.z -= character.moveDistance
            targetRotation = Math.PI
            break
        case "d":
        case "arrowright":
            targetPosition.z += character.moveDistance
            targetRotation = 0
            break
        default:
            returns
 
    }
    moveCharacter(targetPosition, targetRotation)
}

modalExitButton.addEventListener("click", hideModal)
window.addEventListener("resize", onResize)
window.addEventListener("click", onClick)
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("keydown", onKeyDown)

function animate(){
    // console.log(camera.position)

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(intersectObjects)

    if (intersects.length > 0){
        document.body.style.cursor = "pointer"
    } else {
        document.body.style.cursor = "default"
        intersectedObject = ""
    }
    for (let i=0; i<intersects.length; i++) {
        intersectedObject = intersects[0].object.parent.name
    }
    
    renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)