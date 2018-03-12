const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const MAX_PARTICLES = 100000;

function FireworkParams() {
    this.velocity = 2;
    this.particle_num = 200;
    this.age_min = 1;
    this.age_max = 2.5;
    this.particle_radius = 0.5;
}

function ShellParams() {
    this.particle_num = 10;
    this.velocity = 0.2;
    this.lifespan = 0.85;
}

function SceneParams() {
    this.gravity = -0.5;
}
