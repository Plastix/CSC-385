const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const MAX_PARTICLES = 100000;

const FIREWORK_SPHERE = 'sphere';
const FIREWORK_CUBE = 'cube';
const FIREWORK_FAN = 'fan';
const SPHERE_NUMERIC = 'numeric_sphere';
const SMILE = 'smiley_face';
const FIREWORK_LIST = [FIREWORK_SPHERE, FIREWORK_CUBE, FIREWORK_FAN, SPHERE_NUMERIC, SMILE];

const PHYSICS_ANALYTIC = 'analytic';
const PHYSICS_NUMERIC = 'numeric';
const PHYSICS_LIST = [PHYSICS_ANALYTIC, PHYSICS_NUMERIC];

function FireworkParams() {
    this.velocity = 2;
    this.init_force = 500;
    this.mass = 250;
    this.particle_num = 200;
    this.age_min = 1;
    this.age_max = 2.5;
    this.particle_radius = 0.5;
    this.size_max = 400;
    this.size_min = 200;
    this.alpha_max = 1;
    this.alpha_min = 0;
    this.firework_type = FIREWORK_SPHERE;
}

function ShellParams() {
    this.particle_num = 10;
    this.velocity = 0.2;

    this.lifespan = 0.85;
    this.age_min = 0.1;
    this.age_max = 0.7;
    this.size_max = 300;
    this.size_min = 150;
    this.alpha_max = 1;
    this.alpha_min = 0;
    this.smoke_velocity = 0.15;
}

function SceneParams() {
    this.gravity = -0.5;
    this.physics = PHYSICS_NUMERIC;
}
