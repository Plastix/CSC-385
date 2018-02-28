const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshPhongMaterial({
//     color: 0x00ff00,
//     emissive: 0x00aa00,
//     specular: 0x111111
// });
//
// const cube = new THREE.Mesh(geometry, material);
// cube.position.y = 0.5;
// scene.add(cube);

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshBasicMaterial({color: 0xaaaaaa})
);
plane.rotateX(-Math.PI / 2);
scene.add(plane);

let emitter = new Emitter();
scene.add(emitter.init_object3d());

// const light = new THREE.PointLight(0xffffff, 10, 100);
// light.position.set(5, 5, 0);
// scene.add(light);

camera.position.z = 5;

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const animate = function () {
    renderer.render(scene, camera);
    stats.update();
    controls.update();
    requestAnimationFrame(animate);
};

requestAnimationFrame(animate);