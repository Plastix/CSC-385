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
    this.size_max = 300;
    this.size_min = 150;
    this.alpha_max = 1;
    this.alpha_min = 0;
}

function ShellParams() {
    this.particle_num = 10;
    this.velocity = 0.2;
    this.lifespan = 0.85;
    this.age_min = 0.1;
    this.age_max = 0.7;
    this.size_max = 200;
    this.size_min = 100;
    this.alpha_max = 1;
    this.alpha_min = 0;
    this.smoke_velocity = 0.15;
}

function SceneParams() {
    this.gravity = -0.5;
}
