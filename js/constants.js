const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const MAX_PARTICLES = 100000;

function Params() {
    this.gravity = -0.5;
    this.explosion_vel = 2;
    this.explosion_num = 200;
    this.explosion_age_min = 1;
    this.explosion_age_max = 2.5;
    this.particle_radius = 0.5;

    this.shell_num = 10;
    this.shell_vel = 0.2;
    this.shell_age = 0.85;
}


