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

const MAX_PARTICLES = 100000;
const PARTICLE_GRAVITY = -0.5;
const GRAVITY_VECTOR = new THREE.Vector3(0, PARTICLE_GRAVITY, 0);


class Body {
    constructor(p, m, v, F, time) {
        this.p = p;
        this.m = m;
        this.v = v;
        this.F = F;
        this.time = time;
    }


    update_position(dt) {
        this.time += dt;
        let v = this.v.clone();
        let p = this.p.clone();
        let F = this.F.clone();
        let a = F.multiplyScalar(1 / this.m);
        this.p = p.add(v.multiplyScalar(this.time))
            .add(a.multiplyScalar(1 / 2 * Math.pow(this.time, 2)));

    }


}

class Particle {
    constructor(body, lifespan, color, size_bounds, alpha_bounds) {
        this.body = body;
        this.age = 0;
        this.lifespan = lifespan;
        this.color = color;
        this.size_bounds = size_bounds;
        this.alpha_bounds = alpha_bounds;
    }

    update(dt) {
        this.body.update_position(dt);
        this.age += dt;
    }

    get position() {
        return this.body.p
    }

    is_dead() {
        return this.age > this.lifespan;
    }
}

class ParticleSystem {

    constructor() {
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
        if (this.particles.length < MAX_PARTICLES) {
            this.particles.push(particle);
        }
    }

    add_emitter(emitter) {
        this.emitters.push(emitter);
    }

    init_buffers() {
        this.pos_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("position", this.pos_buffer);
        this.color_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("color", this.color_buffer);
        this.size_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1).setDynamic(true);
        this.geo.addAttribute("size", this.size_buffer);
        this.alpha_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1).setDynamic(true);
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
            particle.update(dt);

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
            this.pos_buffer.array[j] = particle.position.x;
            this.color_buffer.array[j] = particle.color.x;
            j++;
            this.pos_buffer.array[j] = particle.position.y;
            this.color_buffer.array[j] = particle.color.y;
            j++;
            this.pos_buffer.array[j] = particle.position.z;
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

    constructor(system, body, spawn_rate, lifespan, velocity_generator, color_generator, age_generator) {
        // Emitter params
        this.system = system;
        this.body = body;

        this.spawn_rate = spawn_rate;
        this.lifespan = lifespan;
        this.age = 0;
        this.velocity_generator = velocity_generator;
        this.color_generator = color_generator;
        this.age_generator = age_generator;
    }


    update(dt) {
        this.age += dt;
        this.body.update_position(dt);

        for (let i = 0; i < this.spawn_rate; i++) {
            let m = 1;
            let gravity = GRAVITY_VECTOR.clone().multiplyScalar(m);
            this.system.spawn_particle(new Particle(
                new Body(this.body.p, m, this.velocity_generator(), gravity, 0),
                this.age_generator(),
                this.color_generator(),
                new THREE.Vector2(50, 20),
                new THREE.Vector2(1, 0)
            ));
        }
    }

    is_dead() {
        return this.age > this.lifespan;
    }

}

class Shell extends Emitter {


    constructor(system, body, spawn_rate, lifespan, velocity_generator, color_generator, age_generator) {
        super(system, body, spawn_rate, lifespan, velocity_generator, color_generator, age_generator);
    }

    is_dead() {
        let dead = super.is_dead();

        if (dead) {
            let rainbow = () => new THREE.Vector3(
                getRandomArbitrary(0, 1),
                getRandomArbitrary(0, 1),
                getRandomArbitrary(0, 1),
            );
            let vel_func = () => new THREE.Vector3(
                getRandomArbitrary(-0.2, 0.2),
                getRandomArbitrary(0, 0.3),
                getRandomArbitrary(-0.2, 0.2)
            );

            let age_func = () => getRandomArbitrary(1, 2.5);
            let velocity = new THREE.Vector3(0, 0, 0);
            let g = GRAVITY_VECTOR.clone();
            let m = 1; // hard coded mass for now
            let gravity = g.multiplyScalar(m);
            this.system.add_emitter(new Emitter(system, new Body(this.body.p, m, velocity, gravity, 0) , 200, 0, vel_func, rainbow, age_func))
        }

        return dead
    }
}