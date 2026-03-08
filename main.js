import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x7CB342 );
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const canvas = document.getElementById("experience-canvas")
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

//physics stuff
const GRAVITY = 30
const CAPSULE_RADIUS = 0.35
const CAPSULE_HEIGHT = 1
const JUMP_HEIGHT = 15
const MOVE_SPEED = 10

let character = {
    instance: null,
    isMoving: false,
    spawnPosition: new THREE.Vector3()
}
let targetRotation = -Math.PI /2
    

const colliderOctree = new Octree()
const playerCollider = new Capsule(
    new THREE.Vector3(0, CAPSULE_RADIUS, 0),
    new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
    CAPSULE_RADIUS
)

let playerVelocity = new THREE.Vector3()
let playerOnFloor = false

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true 
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 2.7

let clickable = true
const modalContent = {
    'Project_1': {
        title: "Robot Pong Competition - 1st Place",
        content: "Built and programmed a LEGO Mindstorms robot using motors, ultrasonic and infrared sensors, with control logic developed in LabVIEW. Won by continuously refining mechanical setup and tuning control parameters to maximize scoring efficiency and ball transfer rate.",
        link: "https://www.youtube.com/watch?v=x8Aio5qC4fA",
        
    },
    'Project_2': {
        title: "Fire Escape Mixed Reality Experience",
        content: "Developed an immersive mixed reality game designed to simulate fire emergency scenarios and train users in proper evacuation and fire response procedures.",
        link: "https://www.youtube.com/watch?v=sfbiXcwaMRk",
        
    },
    'Project_3': {
        title: "Human–Robot Tic-Tac-Toe",
        content: "Built a human–robot interaction system where a TM5-900 collaborative robot plays tic-tac-toe against a person using real-time vision and autonomous decision-making. ",
        link: "https://www.youtube.com/watch?v=XGwxpwdxdEI",
        
    },
    "Portal": {
        title: "My Linkedin",
        content: "",
        link: "https://www.linkedin.com/in/liewqihan/",
        linkname: "Press me!"

    },
    "Name": {
        title: "My Github",
        content: "",
        link: "https://github.com/danliew123",
        linkname: "Press me!"
    }
}

const modal = document.querySelector(".modal")
const modalTitle = document.querySelector(".modal-title")
const modalProjectDescription = document.querySelector(".modal-project-description")
const modalExitButton = document.querySelector(".modal-exit-button")
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button")
const bgMusic = document.querySelector("#bg-music")
const musicToggleButton = document.querySelector(".music-toggle")

let musicEnabled = true
let hasTriedAutoplay = false

function updateMusicButtonLabel() {
    if (!musicToggleButton) return
    musicToggleButton.textContent = musicEnabled ? "Music: On" : "Music: Off"
}

function playMusic() {
    if (!bgMusic) return
    bgMusic.volume = 0.35
    bgMusic.play()
        .then(() => {
            musicEnabled = true
            updateMusicButtonLabel()
        })
        .catch(() => {
            musicEnabled = false
            updateMusicButtonLabel()
        })
}

function pauseMusic() {
    if (!bgMusic) return
    bgMusic.pause()
    musicEnabled = false
    updateMusicButtonLabel()
}

function toggleMusic() {
    if (!bgMusic) return
    if (bgMusic.paused) {
        playMusic()
    } else {
        pauseMusic()
    }
}

function unlockMusicOnFirstInteraction() {
    if (hasTriedAutoplay) return
    hasTriedAutoplay = true
    playMusic()
}

playMusic()

function showModal(id) {
    if (!clickable) return
    clickable = false
    const content = modalContent[id]
    if (content) {
        modalTitle.textContent = content.title
        modalProjectDescription.textContent = content.content
        if (content.linkname) {
            modalVisitProjectButton.textContent = content.linkname
        }
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
    clickable = true
}

function jumpCharacter(meshID) {
    const mesh = scene.getObjectByName(meshID)
    const jumpHeight = 2
    const jumpDuration = 0.5

    const t1 = gsap.timeline()

    t1.to(mesh.scale, {
        x: 1.2,
        y: 0.8,
        z: 1.2,
        duration: jumpDuration * 0.2,
        ease: "power2.out",
    })

    t1.to(mesh.scale, {
        x: 0.8,
        y: 1.3,
        z: 0.8,
        duration: jumpDuration * 0.3,
        ease: "power2.out",
    })

    t1.to(
        mesh.position,
        {
            y: mesh.position.y + jumpHeight,
            duration: jumpDuration * 0.5,
            ease: "power2.out"
        },
        "<"
    )
    t1.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: jumpDuration * 0.3,
        ease: "power1.out",
    })
    t1.to(
        mesh.position,
        {
            y: mesh.position.y,
            duration: jumpDuration * 0.5,
            ease: "bounce.out"
        },
        ">"
    )
    t1.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: jumpDuration * 0.2,
        ease: "elastic.out(1, 0.3)",
    })
}

let intersectedObject = ""
const intersectObjects = []
const intersectObjectsNames = ['Project_1', 'Project_2', 'Project_3', 'Name', 'Portal', 'ditto', 'pochacco', 'duck']

const loader = new GLTFLoader();
loader.load( 
    './portfolio1.1.glb', 
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
                character.spawnPosition.copy(child.position)
                character.instance = child
                playerCollider.start
                .copy(child.position)
                .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
                playerCollider.end
                .copy(child.position)
                .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))
            }
            if(child.name === "Ground_collider") {
                colliderOctree.fromGraphNode(child)
                child.visible = false
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
    if (intersectedObject !== "") {
        if (['ditto', 'pochacco', 'duck'].includes(intersectedObject)){
            jumpCharacter(intersectedObject)
        } else {
            showModal(intersectedObject)
        }
    }
}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 -1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

// function moveCharacter(targetPosition, targetRotation){
//     character.isMoving = true

//     let rotationDiff = 
//         ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
//             3 * Math.PI) %
//             (2 * Math.PI)) - 
//             Math.PI
//     let finalRotation =  character.instance.rotation.y + rotationDiff

//     const t1 = gsap.timeline({
//         onComplete: ()=>{
//             character.isMoving = false
//         }
//     })

//     t1.to(character.instance.position,{
//         x: targetPosition.x,
//         z: targetPosition.z,
//         duration: character.moveDuration,
//     })

//     t1.to(character.instance.rotation, {
//         y: finalRotation,
//         duration: character.moveDuration,
//     },
//     0
//     )

//     t1.to(character.instance.position, {
//         y: character.instance.position.y + character.jumpHeight,
//         duration: character.moveDuration/2,
//         yoyo: true,
//         repeat: 1,
//     },
//     0
//     )

// }

function respawnCharacter() {
    character.instance.position.copy(character.spawnPosition)
    playerCollider.start
        .copy(character.spawnPosition)
        .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
    playerCollider.end
        .copy(character.spawnPosition)
        .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))

    playerVelocity.set(0,0,0)
    character.isMoving = false
}

function playerCollisions() {
    const result = colliderOctree.capsuleIntersect(playerCollider)
    playerOnFloor = false

    if (result) {
        playerOnFloor = result.normal.y > 0
        playerCollider.translate(result.normal.multiplyScalar(result.depth))
    }

    if(playerOnFloor){
        character.isMoving = false
        playerVelocity.x = 0
        playerVelocity.z = 0
    }
}

function updatePlayer() {
    if (!character.instance) return

    if (character.instance.position.y < -20) {
        respawnCharacter()
        return
    }

    if (!playerOnFloor) {
        playerVelocity.y -= GRAVITY * 0.035
    }

    playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035))
    playerCollisions()

    let rotationDiff = 
        ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
            3 * Math.PI) %
            (2 * Math.PI)) - 
            Math.PI
    let finalRotation =  character.instance.rotation.y + rotationDiff

    character.instance.position.copy(playerCollider.start)
    character.instance.position.y -= CAPSULE_RADIUS

    character.instance.rotation.y = THREE.MathUtils.lerp(
        character.instance.rotation.y,
        finalRotation,
        0.4
    )

}

function onKeyDown(event) {
    if(event.key.toLowerCase()==="r"){
        respawnCharacter()
        return
    }

    if (character.isMoving) return

    console.log(event)
    // const targetPosition = new THREE.Vector3().copy(character.instance.position)
    
    switch(event.key.toLowerCase()){
        case "w":
        case "arrowup":
            playerVelocity.x += MOVE_SPEED
            targetRotation = Math.PI / 2
            break
        case "s":
        case "arrowdown":
            playerVelocity.x -= MOVE_SPEED
            targetRotation = - Math.PI / 2
            break
        case "a":
        case "arrowleft":
            playerVelocity.z -= MOVE_SPEED
            targetRotation = Math.PI
            break
        case "d":
        case "arrowright":
            playerVelocity.z += MOVE_SPEED
            targetRotation = 0
            break
        default:
            return
 
    }
    playerVelocity.y = JUMP_HEIGHT
    character.isMoving = true
}

modalExitButton.addEventListener("click", hideModal)
if (musicToggleButton) {
    musicToggleButton.addEventListener("click", toggleMusic)
}
window.addEventListener("pointerdown", unlockMusicOnFirstInteraction, { once: true })
window.addEventListener("keydown", unlockMusicOnFirstInteraction, { once: true })
window.addEventListener("resize", onResize)
window.addEventListener("click", onClick)
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("keydown", onKeyDown)

function animate(){
    // console.log(camera.position)
    updatePlayer()

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