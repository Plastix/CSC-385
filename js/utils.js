const lerp = (a, b, f) => a + f * (b - a);

const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;

const gravity_vector = () => new THREE.Vector3(0, scene_params.gravity, 0);

const zero_vector = () => new THREE.Vector3(0, 0, 0);

const rainbow = () => new THREE.Vector3(
    getRandomArbitrary(0, 1),
    getRandomArbitrary(0, 1),
    getRandomArbitrary(0, 1),
);
