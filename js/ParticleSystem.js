let vertex_shader = `
    attribute float size;
    attribute float alpha;
    varying vec4 vColor;
    
    void main() {
        vColor = vec4(color, alpha);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size;
    }
`;

let fragment_shader = `
    uniform sampler2D texture;
    
    varying vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
        gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
    }
`;

const PARTICLE_GRAVITY = -0.5;

class Particle {
    constructor(pos, m, v, a, lifespan, color, size_bounds, alpha_bounds) {
        this.p = pos;
        this.m = m;
        this.v = v;
        this.a = a;
        this.age = 0;
        this.lifespan = lifespan;
        this.color = color;
        this.size_bounds = size_bounds;
        this.alpha_bounds = alpha_bounds;
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
        this.color_buffer = new THREE.BufferAttribute(new Float32Array(this.MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("color", this.color_buffer);
        this.size_buffer = new THREE.BufferAttribute(new Float32Array(this.MAX_PARTICLES), 1).setDynamic(true);
        this.geo.addAttribute("size", this.size_buffer);
        this.alpha_buffer = new THREE.BufferAttribute(new Float32Array(this.MAX_PARTICLES), 1).setDynamic(true);
        this.geo.addAttribute("alpha", this.alpha_buffer);
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
            this.pos_buffer.array[j] = particle.p.x;
            this.color_buffer.array[j] = particle.color.x;
            j++;
            this.pos_buffer.array[j] = particle.p.y;
            this.color_buffer.array[j] = particle.color.y;
            j++;
            this.pos_buffer.array[j] = particle.p.z;
            this.color_buffer.array[j] = particle.color.z;
            j++;

            this.size_buffer.array[i] = lerp(particle.size_bounds.x, particle.size_bounds.y, particle.age / particle.lifespan);
            this.alpha_buffer.array[i] = lerp(particle.alpha_bounds.x, particle.alpha_bounds.y, particle.age / particle.lifespan);
        }

        this.pos_buffer.needsUpdate = true;
        this.size_buffer.needsUpdate = true;
        this.alpha_buffer.needsUpdate = true;
        this.color_buffer.needsUpdate = true;
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

        for (let i = 0; i < this.spawn_rate; i++) {
            this.system.spawn_particle(new Particle(
                this.location.clone(),
                0,
                new THREE.Vector3(getRandomArbitrary(-0.2, 0.2), getRandomArbitrary(0, 0.3), getRandomArbitrary(-0.2, 0.2)),
                new THREE.Vector3(0, PARTICLE_GRAVITY, 0),
                1.5,
                new THREE.Vector3(getRandomArbitrary(0, 1), getRandomArbitrary(0, 1), getRandomArbitrary(0, 1)),
                new THREE.Vector2(50, 20),
                new THREE.Vector2(1, 0)));
        }
    }

    is_dead() {
        return this.age > this.lifespan;
    }

}

function lerp(a, b, f) {
    return a + f * (b - a);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}