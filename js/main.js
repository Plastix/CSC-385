let scene, camera, renderer, texture_loader;
let controls, stats, params;
let raycaster, mouse, system, plane;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    texture_loader = new THREE.TextureLoader();
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0);

    setup_stats();
    setup_gui();
    setup_scene();
    setup_listeners();

    requestAnimationFrame(animate);
}

function setup_stats() {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
}

function setup_gui() {
    params = new Params();
    const gui = new dat.GUI();
    gui.add(params, "gravity").min(-1).max(0).step(0.01);
}


function setup_scene() {
    camera.position.z = 5;
    camera.position.y = 3;

    plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10, 10, 10),
        new THREE.MeshBasicMaterial({
                color: 0xaaaaaa,
                wireframe: true
            }
        )
    );

    // Rotate plane flat
    plane.rotateX(-Math.PI / 2);
    scene.add(plane);

    system = new ParticleSystem(camera);
    let system_obj = system.get_object3D();
    scene.add(system_obj);
    system_obj.position.y = 1;

    setup_skybox()
}


function setup_skybox() {
    let imagePrefix = "textures/skybox4/";
    let directions = ["px", "nx", "py", "ny", "pz", "nz"];
    let imageSuffix = ".jpg";
    let skyGeometry = new THREE.CubeGeometry(500, 500, 500);

    let materialArray = [];
    for (let i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map: texture_loader.load(imagePrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    let skyBox = new THREE.Mesh(skyGeometry, materialArray);
    scene.add(skyBox);
}

function setup_listeners() {
    window.addEventListener("resize", onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onMouseClick, false);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


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
        if (col.object === plane) {
            create_firework_shell(col.point);
            break;
        }
    }
}

function create_firework_shell(position) {
    let smoke = () => new THREE.Vector3(
        getRandomArbitrary(0, 0.2),
        getRandomArbitrary(0, 0.2),
        getRandomArbitrary(0, 0.2));

    let velocity_gen = () => new THREE.Vector3(
        getRandomArbitrary(-0.01, 0.01),
        0,
        getRandomArbitrary(-0.01, 0.01));
    let age_gen = () => getRandomArbitrary(0.5, 0.5);
    let velocity = new THREE.Vector3(0, 0.2, 0);
    let m = 1;
    let gravity = gravity_vector().multiplyScalar(m);
    let body = new Body(position, m, velocity, gravity, 0);
    let shell = new Shell(system, body, 10, 0.85, velocity_gen, smoke, age_gen);
    system.add_emitter(shell);
}

// Main function loop
function animate() {
    renderer.render(scene, camera);
    stats.update();
    controls.update();
    system.render();
    requestAnimationFrame(animate);
}

window.onload = init;


