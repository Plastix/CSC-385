# CSC 385 Final Project
We made explosions in Three.js.

# Installation
Just clone the repo.

# Running
* If you use Firefox Quantum (`58.x`), just double click `index.html`
* If you use Chrome you'll need to launch a webserver to host the page. This is because Chrome blocks images 
(e.g. textures) from being loaded when reading from `file://`. 
    1. Launch `index.html` from inside of WebStorm. It defaults to using a local webserver
    2. Launch a manual webserver: Navigate to root of project and run `python -m SimpleHTTPServer`
        
# Completed Goals
* Learned basics of Three.js
* Implemented a basic particle system with CPU based computation (Euler's method)
* Implemented interactive fireworks using our particle system
* Implemented different firework explosion shapes (smiley faces!!)
* Implemented extra physics with air resistance and initial forces

# Code Resources
* Three.js for the fancy graphics stuff 
* Three.js Orbit Controls for camera movement
* Stats.js for FPS meter
* dat.gui.js for changing simulation parameters

# Graphical Resources
* Skybox textures from https://93i.de/p/free-skybox-texture-set/

# Physical Resources
* Physics book from Matt