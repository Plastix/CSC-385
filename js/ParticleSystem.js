let vertex_shader = `
    varying vec3 vColor;
    
    void main() {
        vColor = vec3(1.0, 1.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 50.0;
    }
`;

let fragment_shader = `
    uniform sampler2D texture;
    
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }
`;

const PARTICLE_GRAVITY = -0.5;

class Particle {
    constructor(pos, m, v, a, lifespan) {
        this.p = pos;
        this.m = m;
        this.v = v;
        this.a = a;
        this.age = 0;
        this.lifespan = lifespan;
    }

    is_dead() {
        return this.age > this.lifespan;
    }
}

class ParticleSystem {

    constructor() {
        this.MAX_PARTICLES = 10000;
        this.clock = new THREE.Clock();

        let uniforms = {
            texture: {value: new THREE.TextureLoader().load("textures/sprites/spark1.png")}
        };

        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
        this.object3D = new THREE.Points(this.geo, this.mat);
        this.init_buffers();
        this.particles = [];
        this.emitters = [];
    }

    spawn_particle(particle) {
        if (this.particles.length < this.MAX_PARTICLES) {
            this.particles.push(particle);
        }
    }

    add_emitter(emitter) {
        this.emitters.push(emitter);
    }

    init_buffers() {
        this.pos_buffer = new THREE.BufferAttribute(new Float32Array(this.MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("position", this.pos_buffer);
    }

    render() {
        this.update();
        this.updateBuffers();
        this.geo.setDrawRange(0, this.particles.length);
    }

    update() {
        let dt = this.clock.getDelta();
        this.update_emitters(dt);
        this.update_particles(dt);
    }

    update_particles(dt) {
        let particles = [];
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            let v = particle.v.clone();
            let p = particle.p.clone();
            let a = particle.a.clone();
            particle.age += dt;
            particle.p = p.add(v.multiplyScalar(particle.age))
                .add(a.multiplyScalar(1 / 2 * Math.pow(particle.age, 2)));

            if (!particle.is_dead()) {
                particles.push(particle);
            }
        }
        this.particles = particles;
    }

    update_emitters(dt) {
        let emitters = [];
        for (let i = 0; i < this.emitters.length; i++) {
            let emitter = this.emitters[i];
            emitter.update(dt);

            if (!emitter.is_dead()) {
                emitters.push(emitter);
            }
        }
        this.emitters = emitters;
    }

    updateBuffers() {
        let j = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            this.pos_buffer.array[j++] = particle.p.x;
            this.pos_buffer.array[j++] = particle.p.y;
            this.pos_buffer.array[j++] = particle.p.z;

        }

        this.pos_buffer.needsUpdate = true;
    }

    get_object3D() {
        return this.object3D;
    }
}


class Emitter {

    constructor(system, location, spawn_rate, lifespan) {
        // Emitter params
        this.system = system;
        this.location = location;
        this.spawn_rate = spawn_rate;
        this.lifespan = lifespan;
        this.age = 0;

    }

    update(dt) {
        this.age += dt;

        // TODO Actually spawn at spawn rate
        this.system.spawn_particle(new Particle(
            this.location.clone(),
            0,
            new THREE.Vector3(getRandomArbitrary(-0.2, 0.2), getRandomArbitrary(0, 0.3), getRandomArbitrary(-0.2, 0.2)),
            new THREE.Vector3(0, PARTICLE_GRAVITY, 0),
            1));
    }

    is_dead() {
        return this.age > this.lifespan;
    }

}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}