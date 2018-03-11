function lerp(a, b, f) {
    return a + f * (b - a);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function gravity_vector() {
    return new THREE.Vector3(0, params.gravity, 0);
}
