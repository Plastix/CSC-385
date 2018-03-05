const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshBasicMaterial({color: 0xaaaaaa})
);
plane.rotateX(-Math.PI / 2);
scene.add(plane);

let system = new ParticleSystem();
let system_obj = system.get_object3D();
scene.add(system_obj);
system_obj.position.y = 1;

camera.position.z = 5;
camera.position.y = 3;

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);

const animate = function () {
    renderer.render(scene, camera);
    stats.update();
    controls.update();
    system.render();
    requestAnimationFrame(animate);
};

requestAnimationFrame(animate);

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(0, 0);

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        let col = intersects[i];
        if (col.object === system_obj) {
            continue;
        }
        let pos = col.point;
        system.add_emitter(new Emitter(system, pos, 0, 0.5));
        break;

    }

}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);


