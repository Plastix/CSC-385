X_AXIS = new THREE.Vector3(1, 0, 0);
Y_AXIS = new THREE.Vector3(0, 1, 0);
Z_AXIS = new THREE.Vector3(0, 0, 1);

function lerp(a, b, f) {
    return a + f * (b - a);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}