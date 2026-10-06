import * as THREE from "three";

/* =========================================================
   PIXEL RUSH — PIXEL RACER
   ========================================================= */

const canvas = document.getElementById("game-canvas");
const shell = document.getElementById("game-shell");

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderPercent = document.getElementById("loader-percent");
const loaderStatus = document.getElementById("loader-status");

const startOverlay = document.getElementById("start-overlay");
const playBtn = document.getElementById("play-btn");
const navPlay = document.getElementById("nav-play");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const settingsClose = document.getElementById("settings-close");

const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");

const touchToggle = document.getElementById("touch-toggle");
const trafficToggle = document.getElementById("traffic-toggle");
const shadowToggle = document.getElementById("shadow-toggle");

const speedElement = document.getElementById("speed");
const speedFill = document.getElementById("speed-fill");
const compassElement = document.getElementById("compass");

const mapButton = document.getElementById("map-button");
const mapOverlay = document.getElementById("map-overlay");
const mapClose = document.getElementById("map-close");
const fullMap = document.getElementById("full-map");

const touchControls = document.getElementById("touch-controls");


/* =========================================================
   GAME SETTINGS
   ========================================================= */

const WORLD_SIZE = 520;
const ROAD_WIDTH = 24;
const ROAD_SPACING = 100;

const ROAD_CENTERS = [-200, -100, 0, 100, 200];

const MAX_SPEED = 2.75;
const MAX_REVERSE = 1.05;

const ACCELERATION = 1.45;
const REVERSE_ACCELERATION = 0.95;
const BRAKE_POWER = 2.9;

const DRAG = 0.45;
const STEERING_POWER = 1.65;

const TRAFFIC_COUNT = 30;

let gameStarted = false;
let paused = false;

let trafficEnabled = true;
let shadowsEnabled = true;


/* =========================================================
   THREE.JS
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x10151b);

scene.fog = new THREE.Fog(
    0x10151b,
    170,
    650
);


const camera = new THREE.PerspectiveCamera(
    60,
    1,
    0.1,
    1200
);


const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


/* =========================================================
   LIGHTING
   ========================================================= */

const hemiLight = new THREE.HemisphereLight(
    0x9ab7ff,
    0x222222,
    1.6
);

scene.add(hemiLight);


const sun = new THREE.DirectionalLight(
    0xffe5bd,
    2.2
);

sun.position.set(
    -120,
    220,
    100
);

sun.castShadow = true;

sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;

sun.shadow.camera.left = -300;
sun.shadow.camera.right = 300;
sun.shadow.camera.top = 300;
sun.shadow.camera.bottom = -300;

scene.add(sun);


/* =========================================================
   MATERIALS
   ========================================================= */

const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x25272b,
    roughness: 0.95
});

const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x77777b,
    roughness: 1
});

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x263c29,
    roughness: 1
});

const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9d9d9
});

const yellowLineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffbd45
});

const buildingMaterials = [
    new THREE.MeshStandardMaterial({
        color: 0x555c67,
        roughness: 0.85
    }),
    new THREE.MeshStandardMaterial({
        color: 0x454b55,
        roughness: 0.85
    }),
    new THREE.MeshStandardMaterial({
        color: 0x6a5f58,
        roughness: 0.85
    }),
    new THREE.MeshStandardMaterial({
        color: 0x3e5059,
        roughness: 0.85
    }),
    new THREE.MeshStandardMaterial({
        color: 0x655a69,
        roughness: 0.85
    })
];


/* =========================================================
   WORLD
   ========================================================= */

const world = new THREE.Group();

scene.add(world);

const collisionObjects = [];
const traffic = [];

let player;


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function addBox(
    x,
    y,
    z,
    width,
    height,
    depth,
    material,
    collide = false
) {
    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = shadowsEnabled;
    mesh.receiveShadow = shadowsEnabled;

    world.add(mesh);

    if (collide) {
        collisionObjects.push({
            mesh,
            width,
            height,
            depth
        });
    }

    return mesh;
}


function random(min, max) {
    return min + Math.random() * (max - min);
}


function randomInt(min, max) {
    return Math.floor(
        random(min, max + 1)
    );
}


function isOnRoad(x, z, margin = 0) {
    for (const r of ROAD_CENTERS) {
        if (Math.abs(x - r) < ROAD_WIDTH / 2 + margin) {
            return true;
        }

        if (Math.abs(z - r) < ROAD_WIDTH / 2 + margin) {
            return true;
        }
    }

    return false;
}


/* =========================================================
   GROUND
   ========================================================= */

const ground = addBox(
    0,
    -0.35,
    0,
    WORLD_SIZE,
    0.5,
    WORLD_SIZE,
    grassMaterial,
    false
);


/* =========================================================
   ROADS
   ========================================================= */

function createRoads() {

    for (const x of ROAD_CENTERS) {

        addBox(
            x,
            -0.05,
            0,
            ROAD_WIDTH,
            0.12,
            WORLD_SIZE,
            roadMaterial
        );

        // Sidewalks
        addBox(
            x - ROAD_WIDTH / 2 - 2,
            0.02,
            0,
            3,
            0.18,
            WORLD_SIZE,
            sidewalkMaterial
        );

        addBox(
            x + ROAD_WIDTH / 2 + 2,
            0.02,
            0,
            3,
            0.18,
            WORLD_SIZE,
            sidewalkMaterial
        );

        // Center road markings
        for (
            let z = -WORLD_SIZE / 2;
            z < WORLD_SIZE / 2;
            z += 18
        ) {

            addBox(
                x,
                0.025,
                z,
                0.28,
                0.025,
                9,
                lineMaterial
            );
        }
    }


    for (const z of ROAD_CENTERS) {

        addBox(
            0,
            -0.04,
            z,
            WORLD_SIZE,
            0.12,
            ROAD_WIDTH,
            roadMaterial
        );

        addBox(
            0,
            0.02,
            z - ROAD_WIDTH / 2 - 2,
            WORLD_SIZE,
            0.18,
            3,
            sidewalkMaterial
        );

        addBox(
            0,
            0.02,
            z + ROAD_WIDTH / 2 + 2,
            WORLD_SIZE,
            0.18,
            3,
            sidewalkMaterial
        );

        for (
            let x = -WORLD_SIZE / 2;
            x < WORLD_SIZE / 2;
            x += 18
        ) {

            addBox(
                x,
                0.025,
                z,
                9,
                0.025,
                0.28,
                lineMaterial
            );
        }
    }


    // Yellow road edges
    for (const x of ROAD_CENTERS) {

        addBox(
            x - ROAD_WIDTH / 2 + 1,
            0.035,
            0,
            0.15,
            0.025,
            WORLD_SIZE,
            yellowLineMaterial
        );

        addBox(
            x + ROAD_WIDTH / 2 - 1,
            0.035,
            0,
            0.15,
            0.025,
            WORLD_SIZE,
            yellowLineMaterial
        );
    }


    for (const z of ROAD_CENTERS) {

        addBox(
            0,
            0.035,
            z - ROAD_WIDTH / 2 + 1,
            WORLD_SIZE,
            0.025,
            0.15,
            yellowLineMaterial
        );

        addBox(
            0,
            0.035,
            z + ROAD_WIDTH / 2 - 1,
            WORLD_SIZE,
            0.025,
            0.15,
            yellowLineMaterial
        );
    }
}

createRoads();


/* =========================================================
   CROSSWALK STRIPES
   ========================================================= */

function createCrosswalk(x, z, horizontal) {

    for (let i = -4; i <= 4; i++) {

        if (horizontal) {

            addBox(
                x + i * 2.5,
                0.045,
                z,
                1.2,
                0.025,
                ROAD_WIDTH - 3,
                lineMaterial
            );

        } else {

            addBox(
                x,
                0.045,
                z + i * 2.5,
                ROAD_WIDTH - 3,
                0.025,
                1.2,
                lineMaterial
            );
        }
    }
}


for (const x of ROAD_CENTERS) {
    for (const z of ROAD_CENTERS) {

        createCrosswalk(
            x,
            z - ROAD_WIDTH / 2 + 2,
            true
        );

        createCrosswalk(
            x - ROAD_WIDTH / 2 + 2,
            z,
            false
        );
    }
}


/* =========================================================
   BUILDINGS
   ========================================================= */

function createBuilding(x, z, w, h, d) {

    const material =
        buildingMaterials[
            randomInt(
                0,
                buildingMaterials.length - 1
            )
        ];

    const building = addBox(
        x,
        h / 2,
        z,
        w,
        h,
        d,
        material,
        true
    );

    // Windows
    const windowMaterial =
        new THREE.MeshBasicMaterial({
            color:
                Math.random() > 0.5
                    ? 0xffd36b
                    : 0x72a8ff
        });

    const rows = Math.max(
        2,
        Math.floor(h / 4)
    );

    const columns = Math.max(
        2,
        Math.floor(w / 4)
    );

    for (let r = 0; r < rows; r++) {

        for (let c = 0; c < columns; c++) {

            if (Math.random() > 0.55) continue;

            const windowMesh =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.9,
                        0.9,
                        0.04
                    ),
                    windowMaterial
                );

            windowMesh.position.set(
                x - w / 2 +
                    2 +
                    c * ((w - 4) / Math.max(columns - 1, 1)),

                2.5 +
                    r * 3,

                z + d / 2 + 0.025
            );

            world.add(windowMesh);
        }
    }

    return building;
}


/* =========================================================
   CITY BLOCK GENERATION
   ========================================================= */

function generateCity() {

    const blockEdges = [];

    const points = [
        -260,
        -212,
        -88,
        12,
        112,
        212,
        260
    ];

    for (let ix = 0; ix < points.length - 1; ix++) {

        for (let iz = 0; iz < points.length - 1; iz++) {

            const x1 = points[ix];
            const x2 = points[ix + 1];

            const z1 = points[iz];
            const z2 = points[iz + 1];

            const width = x2 - x1;
            const depth = z2 - z1;

            if (width < 35 || depth < 35) {
                continue;
            }

            const centerX = (x1 + x2) / 2;
            const centerZ = (z1 + z2) / 2;

            // Avoid the center spawn block
            if (
                Math.abs(centerX) < 50 &&
                Math.abs(centerZ) < 50
            ) {
                continue;
            }

            const amount =
                Math.random() > 0.55
                    ? 2
                    : 1;

            for (let i = 0; i < amount; i++) {

                const bw = Math.min(
                    random(16, width - 10),
                    34
                );

                const bd = Math.min(
                    random(16, depth - 10),
                    34
                );

                const bx =
                    centerX +
                    random(
                        -width / 4,
                        width / 4
                    );

                const bz =
                    centerZ +
                    random(
                        -depth / 4,
                        depth / 4
                    );

                const bh =
                    random(8, 45);

                createBuilding(
                    bx,
                    bz,
                    bw,
                    bh,
                    bd
                );
            }
        }
    }
}

generateCity();


/* =========================================================
   TREES
   ========================================================= */

function createTree(x, z) {

    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.45,
            0.6,
            3,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x5a3825
        })
    );

    trunk.position.y = 1.5;

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            2.5,
            8,
            8
        ),
        new THREE.MeshStandardMaterial({
            color:
                Math.random() > 0.5
                    ? 0x26703c
                    : 0x315d36
        })
    );

    leaves.position.y = 4;

    group.add(trunk);
    group.add(leaves);

    group.position.set(
        x,
        0,
        z
    );

    world.add(group);

    collisionObjects.push({
        mesh: group,
        width: 4,
        height: 6,
        depth: 4
    });
}


/* =========================================================
   PARKS
   ========================================================= */

function createPark(x, z) {

    addBox(
        x,
        0.02,
        z,
        35,
        0.08,
        35,
        new THREE.MeshStandardMaterial({
            color: 0x326b3a
        })
    );

    for (let i = 0; i < 8; i++) {

        const tx =
            x + random(-14, 14);

        const tz =
            z + random(-14, 14);

        if (!isOnRoad(tx, tz, 3)) {
            createTree(tx, tz);
        }
    }
}


/* =========================================================
   PETROL STATION
   ========================================================= */

function createPetrolStation(x, z) {

    // Main building
    addBox(
        x,
        2.5,
        z,
        18,
        5,
        12,
        new THREE.MeshStandardMaterial({
            color: 0xd5d5d5
        }),
        true
    );

    // Roof
    addBox(
        x,
        5.3,
        z,
        22,
        0.7,
        16,
        new THREE.MeshStandardMaterial({
            color: 0x22252a
        })
    );

    // Petrol columns
    for (let i = -1; i <= 1; i++) {

        addBox(
            x + i * 6,
            3,
            z + 8,
            0.8,
            6,
            0.8,
            new THREE.MeshStandardMaterial({
                color: 0xffbd45
            })
        );
    }

    // Sign
    addBox(
        x,
        8,
        z - 8,
        5,
        5,
        0.7,
        new THREE.MeshStandardMaterial({
            color: 0x101010,
            emissive: 0xffbd45,
            emissiveIntensity: 0.3
        }),
        true
    );
}


/* =========================================================
   SPECIAL STRUCTURES
   ========================================================= */

createPark(-150, -150);
createPark(150, 150);
createPark(-150, 150);
createPark(150, -150);

createPetrolStation(
    -150,
    -50
);

createPetrolStation(
    150,
    50
);

createPetrolStation(
    -50,
    150
);

createPetrolStation(
    50,
    -150
);


/* =========================================================
   EXTRA TREES AROUND CITY
   ========================================================= */

for (let i = 0; i < 100; i++) {

    const x = random(
        -WORLD_SIZE / 2 + 10,
        WORLD_SIZE / 2 - 10
    );

    const z = random(
        -WORLD_SIZE / 2 + 10,
        WORLD_SIZE / 2 - 10
    );

    if (!isOnRoad(x, z, 5)) {
        createTree(x, z);
    }
}


/* =========================================================
   CAR CREATION
   ========================================================= */

function createCar(color = 0xd92727) {

    const car = new THREE.Group();

    /*
       Original sports-coupe silhouette.
       RX-7-inspired proportions, but no Mazda assets/logos.
    */

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color,
            metalness: 0.35,
            roughness: 0.32
        });

    const darkMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111318,
            metalness: 0.15,
            roughness: 0.3
        });

    const glassMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x162b3a,
            metalness: 0.1,
            roughness: 0.15,
            transparent: true,
            opacity: 0.8
        });

    const lightMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xfff2c2
        });

    const tailMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xff2020
        });


    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.65,
            5.2
        ),
        bodyMaterial
    );

    body.position.y = 0.8;

    car.add(body);


    // Hood
    const hood = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.55,
            0.28,
            1.7
        ),
        bodyMaterial
    );

    hood.position.set(
        0,
        1.15,
        -1.55
    );

    car.add(hood);


    // Cabin
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.35,
            0.9,
            2.25
        ),
        darkMaterial
    );

    cabin.position.set(
        0,
        1.45,
        0.35
    );

    car.add(cabin);


    // Windshield
    const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.1,
            0.65,
            0.08
        ),
        glassMaterial
    );

    windshield.position.set(
        0,
        1.52,
        -0.8
    );

    windshield.rotation.x =
        THREE.MathUtils.degToRad(-17);

    car.add(windshield);


    // Rear glass
    const rearGlass = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.1,
            0.65,
            0.08
        ),
        glassMaterial
    );

    rearGlass.position.set(
        0,
        1.52,
        1.45
    );

    rearGlass.rotation.x =
        THREE.MathUtils.degToRad(17);

    car.add(rearGlass);


    // Roof
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.2,
            0.12,
            1.75
        ),
        bodyMaterial
    );

    roof.position.set(
        0,
        1.9,
        0.35
    );

    car.add(roof);


    // Front lights
    for (const x of [-0.85, 0.85]) {

        const light = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.5,
                0.16,
                0.12
            ),
            lightMaterial
        );

        light.position.set(
            x,
            1.0,
            -2.62
        );

        car.add(light);
    }


    // Rear lights
    for (const x of [-0.85, 0.85]) {

        const light = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.55,
                0.18,
                0.12
            ),
            tailMaterial
        );

        light.position.set(
            x,
            1.0,
            2.62
        );

        car.add(light);
    }


    // Rear spoiler
    const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.14,
            0.35
        ),
        bodyMaterial
    );

    spoiler.position.set(
        0,
        1.55,
        2.45
    );

    car.add(spoiler);


    // Spoiler supports
    for (const x of [-0.85, 0.85]) {

        const support = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                0.5,
                0.12
            ),
            darkMaterial
        );

        support.position.set(
            x,
            1.35,
            2.4
        );

        car.add(support);
    }


    // Wheels
    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x090909,
            roughness: 0.8
        });

    const rimMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x8d8d8d,
            metalness: 0.7,
            roughness: 0.25
        });

    const wheelPositions = [
        [-1.42, 0.5, -1.65],
        [1.42, 0.5, -1.65],
        [-1.42, 0.5, 1.65],
        [1.42, 0.5, 1.65]
    ];

    for (const pos of wheelPositions) {

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.52,
                0.52,
                0.38,
                16
            ),
            wheelMaterial
        );

        wheel.rotation.z =
            Math.PI / 2;

        wheel.position.set(
            pos[0],
            pos[1],
            pos[2]
        );

        car.add(wheel);


        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.22,
                0.4,
                12
            ),
            rimMaterial
        );

        rim.rotation.z =
            Math.PI / 2;

        rim.position.copy(
            wheel.position
        );

        car.add(rim);
    }


    car.traverse(object => {

        if (object.isMesh) {

            object.castShadow = shadowsEnabled;
            object.receiveShadow = shadowsEnabled;
        }
    });

    return car;
}


/* =========================================================
   PLAYER
   ========================================================= */

player = createCar(0xe53935);

player.position.set(
    0,
    0,
    -60
);

player.rotation.y = 0;

scene.add(player);


/* =========================================================
   PLAYER PHYSICS
   ========================================================= */

let velocity = 0;

let steering = 0;

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false
};


/* =========================================================
   KEYBOARD
   ========================================================= */

window.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (
        [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " "
        ].includes(key)
    ) {
        event.preventDefault();
    }


    if (key === "w" || key === "arrowup") {
        keys.forward = true;
    }

    if (key === "s" || key === "arrowdown") {
        keys.backward = true;
    }

    if (key === "a" || key === "arrowleft") {
        keys.left = true;
    }

    if (key === "d" || key === "arrowright") {
        keys.right = true;
    }

    if (key === " ") {
        keys.brake = true;
    }


    if (key === "r") {
        resetPlayer();
    }


    if (key === "escape") {

        if (gameStarted) {
            togglePause();
        }
    }
});


window.addEventListener("keyup", event => {

    const key = event.key.toLowerCase();

    if (key === "w" || key === "arrowup") {
        keys.forward = false;
    }

    if (key === "s" || key === "arrowdown") {
        keys.backward = false;
    }

    if (key === "a" || key === "arrowleft") {
        keys.left = false;
    }

    if (key === "d" || key === "arrowright") {
        keys.right = false;
    }

    if (key === " ") {
        keys.brake = false;
    }
});


/* =========================================================
   TOUCH CONTROLS
   ========================================================= */

document.querySelectorAll("[data-control]")
    .forEach(button => {

        const control =
            button.dataset.control;

        const activate = event => {

            event.preventDefault();

            if (control === "forward") {
                keys.forward = true;
            }

            if (control === "brake") {
                keys.backward = true;
            }

            if (control === "left") {
                keys.left = true;
            }

            if (control === "right") {
                keys.right = true;
            }
        };


        const deactivate = event => {

            event.preventDefault();

            if (control === "forward") {
                keys.forward = false;
            }

            if (control === "brake") {
                keys.backward = false;
            }

            if (control === "left") {
                keys.left = false;
            }

            if (control === "right") {
                keys.right = false;
            }
        };


        button.addEventListener(
            "pointerdown",
            activate
        );

        button.addEventListener(
            "pointerup",
            deactivate
        );

        button.addEventListener(
            "pointercancel",
            deactivate
        );

        button.addEventListener(
            "pointerleave",
            deactivate
        );
    });


/* =========================================================
   TRAFFIC
   ========================================================= */

const trafficColors = [
    0xff3030,
    0x3388ff,
    0xffffff,
    0x202020,
    0x27c77a,
    0xffc42f,
    0xa84cff,
    0xff6f3c
];


function createTrafficCar() {

    const car =
        createCar(
            trafficColors[
                randomInt(
                    0,
                    trafficColors.length - 1
                )
            ]
        );

    // EXACT SAME SIZE AS PLAYER
    car.scale.set(
        1,
        1,
        1
    );

    return car;
}


function createTraffic() {

    for (let i = 0; i < TRAFFIC_COUNT; i++) {

        const car =
            createTrafficCar();

        const horizontal =
            Math.random() > 0.5;

        const road =
            ROAD_CENTERS[
                randomInt(
                    0,
                    ROAD_CENTERS.length - 1
                )
            ];

        if (horizontal) {

            car.position.set(
                random(
                    -240,
                    240
                ),
                0,
                road
            );

            car.rotation.y =
                Math.random() > 0.5
                    ? 0
                    : Math.PI;

        } else {

            car.position.set(
                road,
                0,
                random(
                    -240,
                    240
                )
            );

            car.rotation.y =
                Math.random() > 0.5
                    ? Math.PI / 2
                    : -Math.PI / 2;
        }


        car.userData.speed =
            random(
                0.65,
                1.35
            );

        car.userData.horizontal =
            horizontal;

        car.userData.direction =
            car.rotation.y;

        car.userData.startRoad =
            road;

        scene.add(car);

        traffic.push(car);
    }
}

createTraffic();


/* =========================================================
   TRAFFIC UPDATE
   ========================================================= */

function updateTraffic(dt) {

    if (!trafficEnabled) {

        for (const car of traffic) {
            car.visible = false;
        }

        return;
    }


    for (const car of traffic) {

        car.visible = true;

        const speed =
            car.userData.speed *
            dt;

        const direction =
            car.userData.direction;


        if (car.userData.horizontal) {

            car.position.x +=
                Math.sin(direction) * speed;

            car.position.z +=
                Math.cos(direction) * speed;

        } else {

            car.position.x +=
                Math.sin(direction) * speed;

            car.position.z +=
                Math.cos(direction) * speed;
        }


        // Wrap traffic around city
        if (car.position.x > 270) {
            car.position.x = -270;
        }

        if (car.position.x < -270) {
            car.position.x = 270;
        }

        if (car.position.z > 270) {
            car.position.z = -270;
        }

        if (car.position.z < -270) {
            car.position.z = 270;
        }
    }
}


/* =========================================================
   COLLISION
   ========================================================= */

function boxCollision(
    x1,
    z1,
    halfWidth1,
    halfDepth1,
    x2,
    z2,
    halfWidth2,
    halfDepth2
) {
    return (
        Math.abs(x1 - x2) <
            halfWidth1 + halfWidth2 &&
        Math.abs(z1 - z2) <
            halfDepth1 + halfDepth2
    );
}


function checkWorldCollision(
    nextX,
    nextZ
) {

    // World boundary
    const limit =
        WORLD_SIZE / 2 - 7;

    if (
        nextX < -limit ||
        nextX > limit ||
        nextZ < -limit ||
        nextZ > limit
    ) {
        return true;
    }


    // Buildings / trees / structures
    for (const object of collisionObjects) {

        const mesh =
            object.mesh;

        const halfW =
            object.width / 2;

        const halfD =
            object.depth / 2;


        if (
            boxCollision(
                nextX,
                nextZ,
                1.35,
                2.45,
                mesh.position.x,
                mesh.position.z,
                halfW,
                halfD
            )
        ) {
            return true;
        }
    }


    // Traffic collisions
    if (trafficEnabled) {

        for (const car of traffic) {

            if (!car.visible) {
                continue;
            }

            if (
                boxCollision(
                    nextX,
                    nextZ,
                    1.35,
                    2.45,
                    car.position.x,
                    car.position.z,
                    1.4,
                    2.5
                )
            ) {
                return true;
            }
        }
    }

    return false;
}


/* =========================================================
   PLAYER UPDATE
   ========================================================= */

function updatePlayer(dt) {

    if (!gameStarted || paused) {
        return;
    }


    // W = FORWARD
    if (keys.forward) {

        velocity +=
            ACCELERATION * dt;
    }


    // S = REVERSE
    if (keys.backward) {

        velocity -=
            REVERSE_ACCELERATION * dt;
    }


    // Brake
    if (keys.brake) {

        if (velocity > 0) {

            velocity -=
                BRAKE_POWER * dt;

        } else if (velocity < 0) {

            velocity +=
                BRAKE_POWER * dt;
        }
    }


    // Natural drag
    if (
        !keys.forward &&
        !keys.backward
    ) {

        if (velocity > 0) {

            velocity -=
                DRAG * dt;

        } else if (velocity < 0) {

            velocity +=
                DRAG * dt;
        }
    }


    // Stop tiny movement
    if (Math.abs(velocity) < 0.02) {
        velocity = 0;
    }


    velocity = THREE.MathUtils.clamp(
        velocity,
        -MAX_REVERSE,
        MAX_SPEED
    );


    // Steering
    steering = 0;

    if (keys.left) {
        steering = 1;
    }

    if (keys.right) {
        steering = -1;
    }


    // Steering depends on movement direction
    if (Math.abs(velocity) > 0.05) {

        const speedFactor =
            Math.min(
                Math.abs(velocity) / 1.2,
                1
            );

        player.rotation.y +=
            steering *
            STEERING_POWER *
            speedFactor *
            dt *
            (velocity >= 0 ? 1 : -1);
    }


    // Correct forward vector
    const forward =
        new THREE.Vector3(
            Math.sin(
                player.rotation.y
            ),
            0,
            Math.cos(
                player.rotation.y
            )
        );


    const nextX =
        player.position.x +
        forward.x * velocity * dt;

    const nextZ =
        player.position.z +
        forward.z * velocity * dt;


    if (
        !checkWorldCollision(
            nextX,
            nextZ
        )
    ) {

        player.position.x =
            nextX;

        player.position.z =
            nextZ;

    } else {

        // Collision response
        velocity *= -0.15;
    }
}


/* =========================================================
   CAMERA
   ========================================================= */

let cameraYaw = Math.PI;
let cameraPitch = 0.58;
let cameraDistance = 16;

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;


canvas.addEventListener(
    "pointerdown",
    event => {

        mouseDown = true;

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

        canvas.setPointerCapture?.(
            event.pointerId
        );
    }
);


canvas.addEventListener(
    "pointerup",
    event => {

        mouseDown = false;

        canvas.releasePointerCapture?.(
            event.pointerId
        );
    }
);


canvas.addEventListener(
    "pointermove",
    event => {

        if (!mouseDown) {
            return;
        }

        const dx =
            event.clientX -
            lastMouseX;

        const dy =
            event.clientY -
            lastMouseY;

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;


        cameraYaw -=
            dx * 0.006;

        cameraPitch -=
            dy * 0.004;


        cameraPitch =
            THREE.MathUtils.clamp(
                cameraPitch,
                0.25,
                1.15
            );
    }
);


canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        cameraDistance +=
            event.deltaY * 0.015;

        cameraDistance =
            THREE.MathUtils.clamp(
                cameraDistance,
                7,
                32
            );
    },
    { passive: false }
);


function updateCamera() {

    const horizontal =
        Math.cos(cameraPitch) *
        cameraDistance;

    const x =
        player.position.x +
        Math.sin(cameraYaw) *
        horizontal;

    const y =
        player.position.y +
        Math.sin(cameraPitch) *
        cameraDistance;

    const z =
        player.position.z +
        Math.cos(cameraYaw) *
        horizontal;


    camera.position.lerp(
        new THREE.Vector3(
            x,
            y,
            z
        ),
        0.08
    );


    const target =
        new THREE.Vector3(
            player.position.x,
            player.position.y + 1,
            player.position.z
        );

    camera.lookAt(target);
}


/* =========================================================
   COMPASS
   ========================================================= */

function updateCompass() {

    let angle =
        player.rotation.y;

    angle =
        THREE.MathUtils.euclideanModulo(
            angle + Math.PI * 2,
            Math.PI * 2
        );

    const degrees =
        angle * 180 / Math.PI;


    /*
       Car's forward direction:
       0° = South in Three.js world
       90° = East
       180° = North
       270° = West
    */

    let direction;

    if (
        degrees >= 337.5 ||
        degrees < 22.5
    ) {
        direction = "S";
    } else if (
        degrees < 67.5
    ) {
        direction = "SE";
    } else if (
        degrees < 112.5
    ) {
        direction = "E";
    } else if (
        degrees < 157.5
    ) {
        direction = "NE";
    } else if (
        degrees < 202.5
    ) {
        direction = "N";
    } else if (
        degrees < 247.5
    ) {
        direction = "NW";
    } else if (
        degrees < 292.5
    ) {
        direction = "W";
    } else {
        direction = "SW";
    }

    compassElement.textContent =
        direction;
}


/* =========================================================
   SPEEDOMETER
   ========================================================= */

function updateSpeedometer() {

    const kmh =
        Math.round(
            Math.abs(velocity) * 38
        );

    speedElement.textContent =
        kmh;

    const percentage =
        Math.min(
            kmh / 110 * 100,
            100
        );

    speedFill.style.width =
        percentage + "%";
}


/* =========================================================
   MINIMAP
   ========================================================= */

let miniMap;


/*
   Create the minimap dynamically.
   This means the HTML does not need another canvas.
*/

function createMiniMap() {

    miniMap =
        document.createElement("canvas");

    miniMap.width = 180;
    miniMap.height = 180;

    miniMap.id =
        "mini-map";

    miniMap.style.width =
        "180px";

    miniMap.style.height =
        "180px";

    miniMap.style.background =
        "rgba(0,0,0,.72)";

    miniMap.style.border =
        "1px solid rgba(255,189,69,.25)";

    miniMap.style.pointerEvents =
        "auto";

    miniMap.style.cursor =
        "pointer";

    miniMap.title =
        "Click to open full map";

    document.getElementById(
        "hud"
    ).appendChild(miniMap);


    miniMap.addEventListener(
        "click",
        openMap
    );
}

createMiniMap();


function drawMap(targetCanvas) {

    if (!targetCanvas) {
        return;
    }

    const ctx =
        targetCanvas.getContext("2d");

    const width =
        targetCanvas.width;

    const height =
        targetCanvas.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // Background
    ctx.fillStyle =
        "#142019";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    const scale =
        width / WORLD_SIZE;


    // Roads
    ctx.fillStyle =
        "#303236";

    for (const road of ROAD_CENTERS) {

        const px =
            (road +
                WORLD_SIZE / 2) *
            scale;

        const roadSize =
            ROAD_WIDTH * scale;


        ctx.fillRect(
            px - roadSize / 2,
            0,
            roadSize,
            height
        );


        const pz =
            (road +
                WORLD_SIZE / 2) *
            scale;

        ctx.fillRect(
            0,
            pz - roadSize / 2,
            width,
            roadSize
        );
    }


    // Road center lines
    ctx.strokeStyle =
        "#d2d2d2";

    ctx.lineWidth = 1;

    for (const road of ROAD_CENTERS) {

        const px =
            (road +
                WORLD_SIZE / 2) *
            scale;

        ctx.beginPath();

        ctx.moveTo(
            px,
            0
        );

        ctx.lineTo(
            px,
            height
        );

        ctx.stroke();


        const pz =
            (road +
                WORLD_SIZE / 2) *
            scale;

        ctx.beginPath();

        ctx.moveTo(
            0,
            pz
        );

        ctx.lineTo(
            width,
            pz
        );

        ctx.stroke();
    }


    // Buildings
    ctx.fillStyle =
        "rgba(100,110,120,.65)";

    for (const object of collisionObjects) {

        if (!object.mesh) {
            continue;
        }

        const x =
            (object.mesh.position.x +
                WORLD_SIZE / 2) *
            scale;

        const z =
            (object.mesh.position.z +
                WORLD_SIZE / 2) *
            scale;

        const w =
            object.width * scale;

        const d =
            object.depth * scale;


        ctx.fillRect(
            x - w / 2,
            z - d / 2,
            w,
            d
        );
    }


    // Traffic
    if (trafficEnabled) {

        ctx.fillStyle =
            "#4b8cff";

        for (const car of traffic) {

            if (!car.visible) {
                continue;
            }

            const x =
                (car.position.x +
                    WORLD_SIZE / 2) *
                scale;

            const z =
                (car.position.z +
                    WORLD_SIZE / 2) *
                scale;

            ctx.beginPath();

            ctx.arc(
                x,
                z,
                Math.max(
                    2,
                    width / 100
                ),
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }


    // Player
    const playerX =
        (player.position.x +
            WORLD_SIZE / 2) *
        scale;

    const playerZ =
        (player.position.z +
            WORLD_SIZE / 2) *
        scale;


    ctx.save();

    ctx.translate(
        playerX,
        playerZ
    );

    ctx.rotate(
        -player.rotation.y
    );

    ctx.fillStyle =
        "#ffbd45";

    ctx.shadowBlur = 8;
    ctx.shadowColor =
        "#ffbd45";

    ctx.beginPath();

    ctx.moveTo(
        0,
        -7
    );

    ctx.lineTo(
        4,
        6
    );

    ctx.lineTo(
        0,
        3
    );

    ctx.lineTo(
        -4,
        6
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();


    // Border
    ctx.strokeStyle =
        "rgba(255,189,69,.4)";

    ctx.strokeRect(
        0,
        0,
        width,
        height
    );
}


function updateMaps() {

    if (miniMap) {
        drawMap(miniMap);
    }
}


/* =========================================================
   FULL MAP
   ========================================================= */

function openMap() {

    mapOverlay.classList.add(
        "active"
    );

    setTimeout(() => {

        fullMap.width =
            fullMap.clientWidth *
            Math.min(
                window.devicePixelRatio,
                1.5
            );

        fullMap.height =
            fullMap.clientHeight *
            Math.min(
                window.devicePixelRatio,
                1.5
            );

        drawMap(fullMap);

    }, 30);
}


function closeMap() {

    mapOverlay.classList.remove(
        "active"
    );
}


mapButton.addEventListener(
    "click",
    openMap
);

mapClose.addEventListener(
    "click",
    closeMap
);


/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (!gameStarted) {
        return;
    }

    paused = !paused;

    pauseOverlay.classList.toggle(
        "hidden",
        !paused
    );
}


pauseBtn.addEventListener(
    "click",
    togglePause
);


resumeBtn.addEventListener(
    "click",
    () => {
        paused = false;

        pauseOverlay.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   RESET
   ========================================================= */

function resetPlayer() {

    player.position.set(
        0,
        0,
        -60
    );

    player.rotation.y = 0;

    velocity = 0;

    cameraYaw = Math.PI;
    cameraPitch = 0.58;
    cameraDistance = 16;
}


/* =========================================================
   RESTART
   ========================================================= */

restartBtn.addEventListener(
    "click",
    () => {

        resetPlayer();

        paused = false;

        pauseOverlay.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   FULLSCREEN
   ========================================================= */

fullscreenBtn.addEventListener(
    "click",
    async () => {

        try {

            if (!document.fullscreenElement) {

                await shell.requestFullscreen();

            } else {

                await document.exitFullscreen();
            }

        } catch (error) {

            console.warn(
                "Fullscreen unavailable",
                error
            );
        }
    }
);


/* =========================================================
   SETTINGS
   ========================================================= */

settingsBtn.addEventListener(
    "click",
    () => {

        settingsPanel.classList.remove(
            "hidden"
        );
    }
);


settingsClose.addEventListener(
    "click",
    () => {

        settingsPanel.classList.add(
            "hidden"
        );
    }
);


touchToggle.addEventListener(
    "change",
    () => {

        if (touchToggle.checked) {

            touchControls.classList.add(
                "active"
            );

        } else {

            touchControls.classList.remove(
                "active"
            );
        }
    }
);


trafficToggle.addEventListener(
    "change",
    () => {

        trafficEnabled =
            trafficToggle.checked;
    }
);


shadowToggle.addEventListener(
    "change",
    () => {

        shadowsEnabled =
            shadowToggle.checked;

        renderer.shadowMap.enabled =
            shadowsEnabled;

        scene.traverse(
            object => {

                if (object.isMesh) {

                    object.castShadow =
                        shadowsEnabled;

                    object.receiveShadow =
                        shadowsEnabled;
                }
            }
        );
    }
);


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    gameStarted = true;
    paused = false;

    startOverlay.classList.add(
        "hidden"
    );

    canvas.focus?.();
}


playBtn.addEventListener(
    "click",
    startGame
);


navPlay.addEventListener(
    "click",
    () => {

        document
            .getElementById("racer")
            .scrollIntoView({
                behavior: "smooth"
            });

        setTimeout(
            startGame,
            500
        );
    }
);


/* =========================================================
   RESIZE
   ========================================================= */

function resize() {

    const width =
        shell.clientWidth;

    const height =
        shell.clientHeight;

    if (
        width <= 0 ||
        height <= 0
    ) {
        return;
    }

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
        false
    );
}


window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
   LOADING SCREEN
   ========================================================= */

let loadingProgress = 0;

const loadingMessages = [
    "INITIALIZING PIXEL ENGINE...",
    "BUILDING CITY...",
    "GENERATING ROADS...",
    "SPAWNING TRAFFIC...",
    "CALIBRATING VEHICLE...",
    "LOADING PIXEL RACER..."
];


let loadingIndex = 0;


const loadingTimer =
    setInterval(() => {

        loadingProgress +=
            randomInt(2, 6);

        if (loadingProgress >= 100) {

            loadingProgress = 100;

            clearInterval(
                loadingTimer
            );

            loaderStatus.textContent =
                "READY";

            loaderBar.style.width =
                "100%";

            loaderPercent.textContent =
                "100%";

            setTimeout(() => {

                loader.classList.add(
                    "hidden"
                );

            }, 500);

        } else {

            loaderBar.style.width =
                loadingProgress + "%";

            loaderPercent.textContent =
                loadingProgress + "%";

            if (
                loadingProgress >
                loadingIndex * 16
            ) {

                loadingIndex =
                    Math.min(
                        loadingIndex + 1,
                        loadingMessages.length - 1
                    );

                loaderStatus.textContent =
                    loadingMessages[
                        loadingIndex
                    ];
            }
        }

    }, 80);


/* =========================================================
   ANIMATION
   ========================================================= */

const clock =
    new THREE.Clock();

let mapTimer = 0;


function animate() {

    requestAnimationFrame(
        animate
    );

    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (gameStarted && !paused) {

        updatePlayer(dt);

        updateTraffic(dt);
    }


    updateCamera();

    updateSpeedometer();

    updateCompass();


    mapTimer += dt;

    if (mapTimer > 0.15) {

        updateMaps();

        mapTimer = 0;
    }


    renderer.render(
        scene,
        camera
    );
}


animate();


/* =========================================================
   INITIAL CAMERA
   ========================================================= */

camera.position.set(
    0,
    9,
    15
);

camera.lookAt(
    player.position
);


/* =========================================================
   CONSOLE INFO
   ========================================================= */

console.log(
    "%cPIXEL RUSH",
    "color:#ffbd45;font-size:24px;font-weight:bold"
);

console.log(
    "Pixel Racer initialized."
);

console.log(
    "W = Forward | S = Reverse | A/D = Steering"
);
