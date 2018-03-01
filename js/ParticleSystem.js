// class ParticleSystem {
//
//
// }

let vertex_shader = [
    'varying vec3 vColor;',
    'void main() {',
    'vColor = vec3(1.0,1.0,1.0);',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    'gl_PointSize = 10.0;',
    '}'
].join('\n');

let fragment_shader = [
    'varying vec3 vColor;',
    'void main() {',
    'gl_FragColor = vec4(vColor, 1.0);',
    '}'
].join('\n');

class Particle {
    constructor(pos, m, v, a) {
        this.p = pos;
        this.m = m;
        this.v = v;
        this.a = a;
    }
}

class Emitter {

    constructor() {
        // Emitter params
        // TODO (Aidan/Jerry) Don't hardcode these
        this.MAX_PARTICLES = 1000;
        this.PARTICLE_LIFESPAN = 2;
        this.PARTICLE_GRAVITY = -0.5;
        this.clock = new THREE.Clock();
        this.time = 0;

        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader
        });
        this.object3D = new THREE.Points(this.geo, this.mat);
        this.init_particles();
        this.init_buffers();
    }

    init_particles() {
        this.particles = [];
        for (let i = 0; i < this.MAX_PARTICLES; i++) {
            this.particles.push(new Particle(
                this.object3D.position.clone(),
                0,
                new THREE.Vector3(getRandomArbitrary(-1, 1), getRandomArbitrary(0, 1), getRandomArbitrary(-1, 1)),
                new THREE.Vector3(0, this.PARTICLE_GRAVITY, 0)));
        }
    }

    init_buffers() {
        this.positions = new Float32Array(this.MAX_PARTICLES * 3);
        this.pos_buffer = new THREE.BufferAttribute(this.positions, 3).setDynamic(true);
        this.geo.addAttribute("position", this.pos_buffer);
    }

    update() {
        this.time += this.clock.getDelta();

        let i = 0;
        for (let particle of this.particles) {
            let v = particle.v.clone();
            let p = particle.p.clone();
            let a = particle.a.clone();
            particle.p = p.add(v.multiplyScalar(this.time))
                .add(a.multiplyScalar(1 / 2 * Math.pow(this.time, 2)));

            this.positions[i++] = particle.p.x;
            this.positions[i++] = particle.p.y;
            this.positions[i++] = particle.p.z;
        }

        this.pos_buffer.needsUpdate = true;
    }

    get_object3D() {
        return this.object3D;
    }
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}