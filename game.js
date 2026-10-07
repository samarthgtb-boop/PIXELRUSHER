import * as THREE from "three";


/* =========================================================
   PIXEL RUSH — PIXEL RACER
   ========================================================= */


/* =========================================================
   HTML ELEMENTS
   ========================================================= */

const canvas =
    document.getElementById("game-canvas");

const shell =
    document.getElementById("game-shell");


const loader =
    document.getElementById("loader");

const loaderBar =
    document.getElementById("loader-bar");

const loaderPercent =
    document.getElementById("loader-percent");

const loaderStatus =
    document.getElementById("loader-status");


const startOverlay =
    document.getElementById("start-overlay");

const playBtn =
    document.getElementById("play-btn");

const navPlay =
    document.getElementById("nav-play");


const settingsBtn =
    document.getElementById("settings-btn");

const settingsClose =
    document.getElementById("settings-close");

const settingsPanel =
    document.getElementById("settings-panel");


const pauseBtn =
    document.getElementById("pause-btn");

const pauseOverlay =
    document.getElementById("pause-overlay");

const resumeBtn =
    document.getElementById("resume-btn");

const restartBtn =
    document.getElementById("restart-btn");

const fullscreenBtn =
    document.getElementById("fullscreen-btn");


const speedText =
    document.getElementById("speed");

const speedFill =
    document.getElementById("speed-fill");

const compassText =
    document.getElementById("compass");


const mapButton =
    document.getElementById("map-button");

const mapOverlay =
    document.getElementById("map-overlay");

const mapClose =
    document.getElementById("map-close");

const fullMap =
    document.getElementById("full-map");

const miniMap =
    document.getElementById("mini-map");


const touchControls =
    document.getElementById("touch-controls");

const touchToggle =
    document.getElementById("touch-toggle");

const trafficToggle =
    document.getElementById("traffic-toggle");

const shadowToggle =
    document.getElementById("shadow-toggle");


/* =========================================================
   LOADING
   ========================================================= */

function loadingProgress(
    percent,
    status
) {

    if (loaderBar) {

        loaderBar.style.width =
            percent + "%";

    }


    if (loaderPercent) {

        loaderPercent.textContent =
            percent + "%";

    }


    if (
        loaderStatus &&
        status
    ) {

        loaderStatus.textContent =
            status;

    }

}


loadingProgress(
    5,
    "STARTING PIXEL ENGINE..."
);


/* =========================================================
   THREE.JS
   ========================================================= */

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x8ca9b7
    );


scene.fog =
    new THREE.Fog(
        0x8ca9b7,
        180,
        760
    );


const camera =
    new THREE.PerspectiveCamera(
        60,
        1,
        0.1,
        1300
    );


const renderer =
    new THREE.WebGLRenderer({

        canvas,

        antialias: false,

        powerPreference:
            "high-performance"

    });


renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio || 1,
        1.35
    )
);


renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


/* =========================================================
   LIGHTING
   ========================================================= */

const ambient =
    new THREE.HemisphereLight(
        0xeaf5ff,
        0x506050,
        2
    );


scene.add(ambient);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2.8
    );


sun.position.set(
    100,
    220,
    80
);


sun.castShadow = true;


sun.shadow.mapSize.width =
    1024;

sun.shadow.mapSize.height =
    1024;


sun.shadow.camera.left =
    -350;

sun.shadow.camera.right =
    350;

sun.shadow.camera.top =
    350;

sun.shadow.camera.bottom =
    -350;


scene.add(sun);


/* =========================================================
   WORLD
   ========================================================= */

const WORLD_SIZE = 1000;

const ROAD_WIDTH = 22;

const ROAD_POSITIONS = [
    -360,
    -180,
    0,
    180,
    360
];


const colliders = [];

const trafficCars = [];


/* =========================================================
   MATERIAL
   ========================================================= */

function makeMaterial(
    color,
    roughness = 0.8
) {

    return new THREE.MeshStandardMaterial({

        color,

        roughness,

        metalness: 0.05

    });

}


/* =========================================================
   BOX
   ========================================================= */

function addBox(
    x,
    y,
    z,
    width,
    height,
    depth,
    color,
    collision = false
) {

    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            makeMaterial(
                color
            )

        );


    mesh.position.set(
        x,
        y,
        z
    );


    mesh.castShadow = true;

    mesh.receiveShadow = true;


    scene.add(mesh);


    if (collision) {

        colliders.push({

            mesh,

            width,

            depth

        });

    }


    return mesh;

}


/* =========================================================
   GROUND
   ========================================================= */

const ground =
    new THREE.Mesh(

        new THREE.PlaneGeometry(
            WORLD_SIZE,
            WORLD_SIZE
        ),

        makeMaterial(
            0x71816d
        )

    );


ground.rotation.x =
    -Math.PI / 2;


ground.receiveShadow = true;


scene.add(ground);


/* =========================================================
   ROADS
   ========================================================= */

function createRoads() {

    for (
        const position of ROAD_POSITIONS
    ) {


        /* Vertical */

        addBox(

            position,

            0.02,

            0,

            ROAD_WIDTH,

            0.04,

            WORLD_SIZE,

            0x292b2d

        );


        /* Horizontal */

        addBox(

            0,

            0.025,

            position,

            WORLD_SIZE,

            0.04,

            ROAD_WIDTH,

            0x292b2d

        );


        /* Lane markings */

        for (
            let i = -480;
            i <= 480;
            i += 30
        ) {


            addBox(

                position,

                0.055,

                i,

                0.3,

                0.025,

                12,

                0xe9d45b

            );


            addBox(

                i,

                0.055,

                position,

                12,

                0.025,

                0.3,

                0xe9d45b

            );

        }

    }

}


createRoads();


loadingProgress(
    20,
    "BUILDING ROAD NETWORK..."
);


/* =========================================================
   SIDEWALKS
   ========================================================= */

function createSidewalks() {

    for (
        const position of ROAD_POSITIONS
    ) {


        addBox(

            position -
            ROAD_WIDTH / 2 -
            1.5,

            0.12,

            0,

            2.5,

            0.2,

            WORLD_SIZE,

            0x989892

        );


        addBox(

            position +
            ROAD_WIDTH / 2 +
            1.5,

            0.12,

            0,

            2.5,

            0.2,

            WORLD_SIZE,

            0x989892

        );


        addBox(

            0,

            0.12,

            position -
            ROAD_WIDTH / 2 -
            1.5,

            WORLD_SIZE,

            0.2,

            2.5,

            0x989892

        );


        addBox(

            0,

            0.12,

            position +
            ROAD_WIDTH / 2 +
            1.5,

            WORLD_SIZE,

            0.2,

            2.5,

            0x989892

        );

    }

}


createSidewalks();


/* =========================================================
   BUILDINGS
   ========================================================= */

const buildingColors = [

    0x69747a,
    0x7e8587,
    0x5d666c,
    0x8b8378,
    0x727b80,
    0x4f5b62

];


function createBuilding(
    x,
    z,
    width,
    depth,
    height,
    color
) {

    addBox(

        x,

        height / 2,

        z,

        width,

        height,

        depth,

        color,

        true

    );


    if (
        height > 22
    ) {

        addBox(

            x,

            height + 1,

            z,

            width * 0.2,

            2,

            depth * 0.2,

            0x55585b

        );

    }

}


for (
    let x = -450;
    x <= 450;
    x += 60
) {

    for (
        let z = -450;
        z <= 450;
        z += 60
    ) {


        const nearX =
            ROAD_POSITIONS.some(
                p =>
                    Math.abs(
                        x - p
                    ) < 30
            );


        const nearZ =
            ROAD_POSITIONS.some(
                p =>
                    Math.abs(
                        z - p
                    ) < 30
            );


        if (
            nearX ||
            nearZ
        ) {
            continue;
        }


        const width =
            28 +
            Math.random() * 20;


        const depth =
            28 +
            Math.random() * 20;


        const height =
            10 +
            Math.random() * 35;


        const color =
            buildingColors[
                Math.floor(
                    Math.random() *
                    buildingColors.length
                )
            ];


        createBuilding(

            x +
            (Math.random() - 0.5) * 12,

            z +
            (Math.random() - 0.5) * 12,

            width,
            depth,
            height,
            color

        );

    }

}


loadingProgress(
    38,
    "GENERATING CITY..."
);


/* =========================================================
   TREES
   ========================================================= */

function createTree(
    x,
    z
) {

    const trunk =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.7,
                0.9,
                4,
                8
            ),

            makeMaterial(
                0x65452d
            )

        );


    trunk.position.set(
        x,
        2,
        z
    );


    trunk.castShadow = true;

    scene.add(trunk);


    const leaves =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                3.5,
                10,
                8
            ),

            makeMaterial(
                0x28753c
            )

        );


    leaves.position.set(
        x,
        6,
        z
    );


    leaves.castShadow = true;

    scene.add(leaves);


    colliders.push({

        mesh: leaves,

        width: 6,

        depth: 6

    });

}


const parks = [

    [-270, -270],
    [270, -270],
    [-270, 270],
    [270, 270],
    [90, 270],
    [-90, -270]

];


for (
    const [
        px,
        pz
    ] of parks
) {


    addBox(

        px,

        0.08,

        pz,

        55,

        0.12,

        55,

        0x3d8a4b

    );


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        createTree(

            px -
            20 +
            Math.random() * 40,

            pz -
            20 +
            Math.random() * 40

        );

    }

}


loadingProgress(
    48,
    "ADDING PARKS..."
);


/* =========================================================
   PETROL STATIONS
   ========================================================= */

function createPetrolStation(
    x,
    z
) {

    addBox(

        x,

        5,

        z,

        30,

        1.5,

        22,

        0xe8e8e8,

        true

    );


    for (
        const sx of [-12, 12]
    ) {

        for (
            const sz of [-8, 8]
        ) {

            addBox(

                x + sx,

                2.5,

                z + sz,

                1,

                5,

                1,

                0x555555

            );

        }

    }


    for (
        const px of [-7, 0, 7]
    ) {

        addBox(

            x + px,

            1.2,

            z,

            2,

            2.4,

            2,

            0xc92f2f

        );

    }


    addBox(

        x + 18,

        5,

        z,

        3,

        10,

        3,

        0xffca35

    );

}


createPetrolStation(
    -90,
    -90
);


createPetrolStation(
    270,
    90
);


createPetrolStation(
    -270,
    90
);


loadingProgress(
    55,
    "ADDING CITY SERVICES..."
);


/* =========================================================
   PLAYER CAR
   ========================================================= */

const player =
    new THREE.Group();


scene.add(player);


/* Main body */

const playerBody =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            5.2,
            1.25,
            10
        ),

        makeMaterial(
            0xd62828,
            0.45
        )

    );


playerBody.position.y =
    1.25;


playerBody.castShadow = true;


player.add(
    playerBody
);


/* Lower body */

const lowerBody =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            5.5,
            0.8,
            10.4
        ),

        makeMaterial(
            0x9f1616,
            0.5
        )

    );


lowerBody.position.y =
    0.85;


lowerBody.castShadow = true;


player.add(
    lowerBody
);


/* Hood */

const hood =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            4.7,
            0.35,
            3.1
        ),

        makeMaterial(
            0xe33a3a,
            0.4
        )

    );


hood.position.set(
    0,
    1.9,
    -3.1
);


player.add(
    hood
);


/* Cabin */

const cabin =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            4.1,
            1.5,
            4.5
        ),

        makeMaterial(
            0x20262b,
            0.25
        )

    );


cabin.position.set(
    0,
    2.45,
    0.4
);


player.add(
    cabin
);


/* Roof */

const roof =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            3.8,
            0.25,
            3.7
        ),

        makeMaterial(
            0x17191b,
            0.2
        )

    );


roof.position.set(
    0,
    3.25,
    0.4
);


player.add(
    roof
);


/* =========================================================
   WINDOWS
   ========================================================= */

function addWindow(
    z,
    rotationX,
    color
) {

    const window =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3.5,
                0.9,
                0.12
            ),

            makeMaterial(
                color,
                0.15
            )

        );


    window.position.set(
        0,
        2.55,
        z
    );


    window.rotation.x =
        rotationX;


    player.add(
        window
    );

}


addWindow(
    -1.82,
    THREE.MathUtils.degToRad(-10),
    0x7eb5ca
);


addWindow(
    2.58,
    THREE.MathUtils.degToRad(10),
    0x557f91
);


/* =========================================================
   LIGHTS
   ========================================================= */

function addCarLight(
    x,
    z,
    color
) {

    const light =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.1,
                0.35,
                0.15
            ),

            new THREE.MeshStandardMaterial({

                color,

                emissive: color,

                emissiveIntensity: 1.5

            })

        );


    light.position.set(
        x,
        1.55,
        z
    );


    player.add(
        light
    );

}


addCarLight(
    -1.55,
    -5.05,
    0xffffcc
);


addCarLight(
    1.55,
    -5.05,
    0xffffcc
);


addCarLight(
    -1.6,
    5.05,
    0xff1111
);


addCarLight(
    1.6,
    5.05,
    0xff1111
);


/* =========================================================
   SPOILER
   ========================================================= */

const spoiler =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            4.7,
            0.3,
            0.35
        ),

        makeMaterial(
            0x161616,
            0.3
        )

    );


spoiler.position.set(
    0,
    2.15,
    5
);


player.add(
    spoiler
);


for (
    const x of [-1.7, 1.7]
) {

    const support =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                1.2,
                0.25
            ),

            makeMaterial(
                0x161616
            )

        );


    support.position.set(
        x,
        1.7,
        5
    );


    player.add(
        support
    );

}


/* =========================================================
   WHEELS
   ========================================================= */

const wheels = [];


function createWheel(
    x,
    z
) {

    const wheel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                1.05,
                1.05,
                0.65,
                16
            ),

            makeMaterial(
                0x111111,
                0.9
            )

        );


    wheel.rotation.z =
        Math.PI / 2;


    wheel.position.set(
        x,
        0.85,
        z
    );


    wheel.castShadow = true;


    player.add(
        wheel
    );


    wheels.push(
        wheel
    );

}


createWheel(
    -2.7,
    -3.4
);

createWheel(
    2.7,
    -3.4
);

createWheel(
    -2.7,
    3.4
);

createWheel(
    2.7,
    3.4
);


/* Starting position */

player.position.set(
    0,
    0,
    40
);


/* =========================================================
   PHYSICS
   ========================================================= */

/*
   Front of car = -Z

   W = forward
   S = reverse
*/

let velocity = 0;


const MAX_FORWARD_SPEED =
    2.9;

const MAX_REVERSE_SPEED =
    -1.35;


const ACCELERATION =
    0.115;

const REVERSE_ACCELERATION =
    0.085;

const BRAKE_POWER =
    0.19;

const NATURAL_DRAG =
    0.025;

const STEERING_SPEED =
    0.035;


/* =========================================================
   INPUT
   ========================================================= */

const keys = {

    forward: false,

    backward: false,

    left: false,

    right: false,

    brake: false

};


window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        if (
            key === "w" ||
            key === "arrowup"
        ) {

            keys.forward = true;

        }


        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            keys.backward = true;

        }


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            keys.left = true;

        }


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            keys.right = true;

        }


        if (
            event.code === "Space"
        ) {

            keys.brake = true;

        }


        if (
            key === "r"
        ) {

            resetPlayer();

        }


        if (
            key === "escape" &&
            gameRunning
        ) {

            togglePause();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();


        if (
            key === "w" ||
            key === "arrowup"
        ) {

            keys.forward = false;

        }


        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            keys.backward = false;

        }


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            keys.left = false;

        }


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            keys.right = false;

        }


        if (
            event.code === "Space"
        ) {

            keys.brake = false;

        }

    }
);


/* =========================================================
   TOUCH
   ========================================================= */

document
    .querySelectorAll(
        "[data-control]"
    )
    .forEach(button => {

        const control =
            button.dataset.control;


        function start(event) {

            event.preventDefault();

            keys[control] = true;

        }


        function stop(event) {

            event.preventDefault();

            keys[control] = false;

        }


        button.addEventListener(
            "touchstart",
            start,
            {
                passive: false
            }
        );


        button.addEventListener(
            "touchend",
            stop,
            {
                passive: false
            }
        );


        button.addEventListener(
            "touchcancel",
            stop,
            {
                passive: false
            }
        );


        button.addEventListener(
            "mousedown",
            start
        );


        button.addEventListener(
            "mouseup",
            stop
        );


        button.addEventListener(
            "mouseleave",
            stop
        );

    });


/* =========================================================
   TRAFFIC
   ========================================================= */

function createTrafficCar(
    x,
    z,
    rotation,
    color
) {

    const car =
        new THREE.Group();


    car.position.set(
        x,
        0,
        z
    );


    car.rotation.y =
        rotation;


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                5.2,
                1.25,
                10
            ),

            makeMaterial(
                color,
                0.55
            )

        );


    body.position.y =
        1.25;


    body.castShadow = true;


    car.add(
        body
    );


    const lower =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                5.5,
                0.75,
                10.4
            ),

            makeMaterial(
                0x303030
            )

        );


    lower.position.y =
        0.85;


    car.add(
        lower
    );


    const cabin =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4.1,
                1.5,
                4.5
            ),

            makeMaterial(
                0x22282c,
                0.3
            )

        );


    cabin.position.set(
        0,
        2.4,
        0.4
    );


    car.add(
        cabin
    );


    for (
        const wx of [-2.7, 2.7]
    ) {

        for (
            const wz of [-3.4, 3.4]
        ) {

            const wheel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(
                        1.05,
                        1.05,
                        0.65,
                        12
                    ),

                    makeMaterial(
                        0x111111
                    )

                );


            wheel.rotation.z =
                Math.PI / 2;


            wheel.position.set(
                wx,
                0.85,
                wz
            );


            car.add(
                wheel
            );

        }

    }


    scene.add(
        car
    );


    trafficCars.push({

        mesh: car,

        speed:
            0.9 +
            Math.random() * 0.55,

        baseSpeed:
            0.9 +
            Math.random() * 0.55,

        acceleration:
            0.035 +
            Math.random() * 0.02,

        rotation,

        axis:
            Math.abs(
                Math.sin(rotation)
            ) > 0.5
                ? "x"
                : "z"

    });

}


/* =========================================================
   TRAFFIC SPAWN
   ========================================================= */

function spawnTraffic() {

    for (
        const traffic
        of trafficCars
    ) {

        scene.remove(
            traffic.mesh
        );

    }


    trafficCars.length = 0;


    if (
        trafficToggle &&
        !trafficToggle.checked
    ) {

        return;

    }


    const colours = [

        0x1e88e5,
        0xf5c542,
        0xeeeeee,
        0x31a852,
        0x9b59b6,
        0xf07b35,
        0x222222,
        0xc9c9c9

    ];


    let index = 0;


    /* Vertical traffic */

    for (
        const road
        of ROAD_POSITIONS
    ) {

        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const z =
                -430 +
                i * 300 +
                (index * 31) % 100;


            const lane =
                i % 2 === 0
                    ? -5.5
                    : 5.5;


            const direction =
                i % 2 === 0
                    ? 0
                    : Math.PI;


            createTrafficCar(

                road + lane,

                z,

                direction,

                colours[
                    index %
                    colours.length
                ]

            );


            index++;

        }

    }


    /* Horizontal traffic */

    for (
        const road
        of ROAD_POSITIONS
    ) {

        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const x =
                -430 +
                i * 300 +
                (index * 27) % 100;


            const lane =
                i % 2 === 0
                    ? -5.5
                    : 5.5;


            const direction =
                i % 2 === 0
                    ? Math.PI / 2
                    : -Math.PI / 2;


            createTrafficCar(

                x,

                road + lane,

                direction,

                colours[
                    index %
                    colours.length
                ]

            );


            index++;

        }

    }

}


spawnTraffic();


loadingProgress(
    68,
    "SPAWNING TRAFFIC..."
);


/* =========================================================
   TRAFFIC UPDATE
   ========================================================= */

function updateTraffic(
    delta
) {

    for (
        const traffic
        of trafficCars
    ) {


        if (
            traffic.speed <
            traffic.baseSpeed
        ) {

            traffic.speed +=
                traffic.acceleration *
                delta *
                60;

        }


        traffic.speed =
            Math.min(
                traffic.speed,
                traffic.baseSpeed
            );


        const distance =
            traffic.speed *
            delta *
            60;


        traffic.mesh.position.x +=
            Math.sin(
                traffic.rotation
            ) *
            distance;


        traffic.mesh.position.z +=
            Math.cos(
                traffic.rotation
            ) *
            distance;


        if (
            traffic.mesh.position.x >
            500
        ) {

            traffic.mesh.position.x =
                -500;

        }


        if (
            traffic.mesh.position.x <
            -500
        ) {

            traffic.mesh.position.x =
                500;

        }


        if (
            traffic.mesh.position.z >
            500
        ) {

            traffic.mesh.position.z =
                -500;

        }


        if (
            traffic.mesh.position.z <
            -500
        ) {

            traffic.mesh.position.z =
                500;

        }

    }

}


/* =========================================================
   COLLISION
   ========================================================= */

function circleCollision(
    a,
    b,
    radiusA,
    radiusB
) {

    const dx =
        a.x -
        b.x;

    const dz =
        a.z -
        b.z;


    return (
        dx * dx +
        dz * dz
    ) <
    (
        radiusA +
        radiusB
    ) *
    (
        radiusA +
        radiusB
    );

}


function checkWorldCollision() {

    const px =
        player.position.x;

    const pz =
        player.position.z;


    for (
        const collider
        of colliders
    ) {

        const object =
            collider.mesh;


        const ox =
            object.position.x;

        const oz =
            object.position.z;


        const halfW =
            collider.width / 2;

        const halfD =
            collider.depth / 2;


        const closestX =
            Math.max(

                ox - halfW,

                Math.min(
                    px,
                    ox + halfW
                )

            );


        const closestZ =
            Math.max(

                oz - halfD,

                Math.min(
                    pz,
                    oz + halfD
                )

            );


        const dx =
            px -
            closestX;

        const dz =
            pz -
            closestZ;


        if (
            dx * dx +
            dz * dz <
            9
        ) {

            const length =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                ) || 1;


            player.position.x +=
                dx / length *
                0.8;


            player.position.z +=
                dz / length *
                0.8;


            velocity *=
                0.35;

        }

    }

}


function checkTrafficCollision() {

    for (
        const traffic
        of trafficCars
    ) {

        if (
            circleCollision(

                player.position,

                traffic.mesh.position,

                5.2,

                5.2

            )
        ) {

            const dx =
                player.position.x -
                traffic.mesh.position.x;


            const dz =
                player.position.z -
                traffic.mesh.position.z;


            const length =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                ) || 1;


            player.position.x +=
                dx / length *
                0.8;


            player.position.z +=
                dz / length *
                0.8;


            traffic.mesh.position.x -=
                dx / length *
                0.25;


            traffic.mesh.position.z -=
                dz / length *
                0.25;


            velocity *=
                0.45;


            traffic.speed *=
                0.7;

        }

    }

}


/* =========================================================
   PLAYER PHYSICS
   ========================================================= */

function updatePlayer(
    delta
) {

    if (
        !gameRunning ||
        gamePaused
    ) {

        return;

    }


    /* ACCELERATION */

    if (
        keys.forward
    ) {

        velocity +=
            ACCELERATION *
            delta *
            60;

    }

    else if (
        keys.backward
    ) {

        velocity -=
            REVERSE_ACCELERATION *
            delta *
            60;

    }

    else {

        if (
            velocity > 0
        ) {

            velocity -=
                NATURAL_DRAG *
                delta *
                60;


            if (
                velocity < 0
            ) {

                velocity = 0;

            }

        }


        if (
            velocity < 0
        ) {

            velocity +=
                NATURAL_DRAG *
                delta *
                60;


            if (
                velocity > 0
            ) {

                velocity = 0;

            }

        }

    }


    /* BRAKING */

    if (
        keys.brake
    ) {

        if (
            velocity > 0
        ) {

            velocity -=
                BRAKE_POWER *
                delta *
                60;

        }

        else if (
            velocity < 0
        ) {

            velocity +=
                BRAKE_POWER *
                delta *
                60;

        }

    }


    velocity =
        THREE.MathUtils.clamp(

            velocity,

            MAX_REVERSE_SPEED,

            MAX_FORWARD_SPEED

        );


    /* STEERING */

    const steering =
        STEERING_SPEED *
        delta *
        60 *
        Math.min(
            Math.abs(velocity) /
            1.2,
            1
        );


    if (
        keys.left
    ) {

        player.rotation.y +=
            steering *
            (
                velocity >= 0
                    ? 1
                    : -1
            );

    }


    if (
        keys.right
    ) {

        player.rotation.y -=
            steering *
            (
                velocity >= 0
                    ? 1
                    : -1
            );

    }


    /* MOVEMENT */

    const forwardX =
        -Math.sin(
            player.rotation.y
        );


    const forwardZ =
        -Math.cos(
            player.rotation.y
        );


    player.position.x +=
        forwardX *
        velocity *
        delta *
        60;


    player.position.z +=
        forwardZ *
        velocity *
        delta *
        60;


    /* Map boundary */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -490,
            490
        );


    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -490,
            490
        );


    /* Wheel rotation */

    for (
        const wheel
        of wheels
    ) {

        wheel.rotation.x +=
            velocity *
            delta *
            3;

    }


    checkWorldCollision();

    checkTrafficCollision();

}


/* =========================================================
   CAMERA
   ========================================================= */

let cameraYaw =
    Math.PI;

let cameraDistance =
    22;

let cameraHeight =
    13;


let cameraDragging =
    false;

let lastMouseX =
    0;

let lastMouseY =
    0;


/* Mouse camera */

canvas.addEventListener(
    "mousedown",
    event => {

        cameraDragging =
            true;


        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

    }
);


window.addEventListener(
    "mouseup",
    () => {

        cameraDragging =
            false;

    }
);


window.addEventListener(
    "mousemove",
    event => {

        if (
            !cameraDragging
        ) {

            return;

        }


        const dx =
            event.clientX -
            lastMouseX;


        const dy =
            event.clientY -
            lastMouseY;


        cameraYaw -=
            dx * 0.006;


        cameraHeight =
            THREE.MathUtils.clamp(

                cameraHeight +
                dy * 0.05,

                6,

                28

            );


        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

    }
);


/* Zoom */

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        cameraDistance +=
            event.deltaY *
            0.025;


        cameraDistance =
            THREE.MathUtils.clamp(

                cameraDistance,

                10,

                38

            );

    },
    {
        passive: false
    }
);


function updateCamera() {

    const target =
        player.position.clone();


    target.y += 1.5;


    const cameraX =
        target.x +
        Math.sin(
            cameraYaw
        ) *
        cameraDistance;


    const cameraZ =
        target.z +
        Math.cos(
            cameraYaw
        ) *
        cameraDistance;


    camera.position.lerp(

        new THREE.Vector3(

            cameraX,

            target.y +
            cameraHeight,

            cameraZ

        ),

        0.1

    );


    camera.lookAt(
        target
    );

}


/* =========================================================
   COMPASS
   ========================================================= */

function updateCompass() {

    let degrees =
        THREE.MathUtils.radToDeg(
            player.rotation.y
        );


    degrees =
        (
            degrees %
            360 +
            360
        ) % 360;


    let direction;


    if (
        degrees >= 315 ||
        degrees < 45
    ) {

        direction = "N";

    }

    else if (
        degrees < 135
    ) {

        direction = "E";

    }

    else if (
        degrees < 225
    ) {

        direction = "S";

    }

    else {

        direction = "W";

    }


    if (
        compassText
    ) {

        compassText.textContent =
            direction;

    }

}


/* =========================================================
   SPEED
   ========================================================= */

function updateSpeedometer() {

    const kmh =
        Math.abs(
            velocity
        ) * 32;


    if (
        speedText
    ) {

        speedText.textContent =
            Math.round(kmh);

    }


    if (
        speedFill
    ) {

        speedFill.style.width =
            Math.min(
                kmh / 120 * 100,
                100
            ) + "%";

    }

}


/* =========================================================
   MAP
   ========================================================= */

function drawMap(
    targetCanvas
) {

    if (
        !targetCanvas
    ) {

        return;

    }


    const width =
        targetCanvas.clientWidth;


    const height =
        targetCanvas.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }


    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    targetCanvas.width =
        width * dpr;

    targetCanvas.height =
        height * dpr;


    const ctx =
        targetCanvas.getContext(
            "2d"
        );


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    /* Background */

    ctx.fillStyle =
        "#26352b";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    const scale =
        Math.min(
            width,
            height
        ) /
        WORLD_SIZE;


    const centerX =
        width / 2;

    const centerY =
        height / 2;


    /* Roads */

    ctx.fillStyle =
        "#46494c";


    for (
        const road
        of ROAD_POSITIONS
    ) {


        const x =
            centerX +
            road *
            scale;


        ctx.fillRect(

            x -
            ROAD_WIDTH *
            scale /
            2,

            0,

            ROAD_WIDTH *
            scale,

            height

        );


        const y =
            centerY +
            road *
            scale;


        ctx.fillRect(

            0,

            y -
            ROAD_WIDTH *
            scale /
            2,

            width,

            ROAD_WIDTH *
            scale

        );

    }


    /* Buildings */

    ctx.fillStyle =
        "#727a7d";


    for (
        const collider
        of colliders
    ) {

        const object =
            collider.mesh;


        const x =
            centerX +
            object.position.x *
            scale;


        const y =
            centerY +
            object.position.z *
            scale;


        ctx.fillRect(

            x -
            collider.width *
            scale /
            2,

            y -
            collider.depth *
            scale /
            2,

            collider.width *
            scale,

            collider.depth *
            scale

        );

    }


    /* Traffic */

    ctx.fillStyle =
        "#ff4d4d";


    for (
        const traffic
        of trafficCars
    ) {

        const x =
            centerX +
            traffic.mesh.position.x *
            scale;


        const y =
            centerY +
            traffic.mesh.position.z *
            scale;


        ctx.fillRect(
            x - 2,
            y - 2,
            4,
            4
        );

    }


    /* Player */

    const playerX =
        centerX +
        player.position.x *
        scale;


    const playerY =
        centerY +
        player.position.z *
        scale;


    ctx.save();


    ctx.translate(
        playerX,
        playerY
    );


    ctx.rotate(
        player.rotation.y
    );


    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();


    ctx.moveTo(
        0,
        -7
    );


    ctx.lineTo(
        5,
        6
    );


    ctx.lineTo(
        0,
        3
    );


    ctx.lineTo(
        -5,
        6
    );


    ctx.closePath();


    ctx.fill();


    ctx.restore();


    /* North */

    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        "bold 11px Inter, Arial";


    ctx.textAlign =
        "center";


    ctx.fillText(
        "N",
        width / 2,
        14
    );

}


/* Mini map click */

if (
    miniMap
) {

    miniMap.addEventListener(
        "click",
        () => {

            mapOverlay.classList.remove(
                "hidden"
            );

            drawMap(
                fullMap
            );

        }
    );

}


/* Full map button */

if (
    mapButton
) {

    mapButton.addEventListener(
        "click",
        () => {

            mapOverlay.classList.remove(
                "hidden"
            );

            drawMap(
                fullMap
            );

        }
    );

}


/* Close map */

if (
    mapClose
) {

    mapClose.addEventListener(
        "click",
        () => {

            mapOverlay.classList.add(
                "hidden"
            );

        }
    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

if (
    settingsBtn
) {

    settingsBtn.addEventListener(
        "click",
        () => {

            settingsPanel.classList.remove(
                "hidden"
            );

        }
    );

}


if (
    settingsClose
) {

    settingsClose.addEventListener(
        "click",
        () => {

            settingsPanel.classList.add(
                "hidden"
            );

        }
    );

}


/* Touch */

if (
    touchToggle
) {

    touchToggle.addEventListener(
        "change",
        () => {

            if (
                touchToggle.checked
            ) {

                touchControls.classList.add(
                    "active"
                );

            }

            else {

                touchControls.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* Traffic */

if (
    trafficToggle
) {

    trafficToggle.addEventListener(
        "change",
        () => {

            spawnTraffic();

        }
    );

}


/* Shadows */

if (
    shadowToggle
) {

    shadowToggle.addEventListener(
        "change",
        () => {

            renderer.shadowMap.enabled =
                shadowToggle.checked;

        }
    );

}


/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning =
    false;

let gamePaused =
    false;


/* =========================================================
   START
   ========================================================= */

function startGame() {

    gameRunning =
        true;

    gamePaused =
        false;


    startOverlay.classList.add(
        "hidden"
    );


    pauseOverlay.classList.add(
        "hidden"
    );


    canvas.focus();

}


if (
    playBtn
) {

    playBtn.addEventListener(
        "click",
        startGame
    );

}


/*
   Navigation PLAY scrolls to the game
   but does NOT start it automatically.
*/

if (
    navPlay
) {

    navPlay.addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "racer"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });

        }
    );

}


/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (
        !gameRunning
    ) {

        return;

    }


    gamePaused =
        !gamePaused;


    if (
        gamePaused
    ) {

        pauseOverlay.classList.remove(
            "hidden"
        );

    }

    else {

        pauseOverlay.classList.add(
            "hidden"
        );

    }

}


if (
    pauseBtn
) {

    pauseBtn.addEventListener(
        "click",
        togglePause
    );

}


if (
    resumeBtn
) {

    resumeBtn.addEventListener(
        "click",
        () => {

            gamePaused =
                false;


            pauseOverlay.classList.add(
                "hidden"
            );

        }
    );

}


/* =========================================================
   RESET
   ========================================================= */

function resetPlayer() {

    player.position.set(
        0,
        0,
        40
    );


    player.rotation.y =
        0;


    velocity =
        0;

}


if (
    restartBtn
) {

    restartBtn.addEventListener(
        "click",
        () => {

            resetPlayer();

            gamePaused =
                false;


            pauseOverlay.classList.add(
                "hidden"
            );

        }
    );

}


/* =========================================================
   FULLSCREEN
   ========================================================= */

if (
    fullscreenBtn
) {

    fullscreenBtn.addEventListener(
        "click",
        async () => {

            try {

                if (
                    !document.fullscreenElement
                ) {

                    await shell.requestFullscreen();

                }

                else {

                    await document.exitFullscreen();

                }

            }

            catch (
                error
            ) {

                console.log(
                    "Fullscreen unavailable",
                    error
                );

            }

        }
    );

}


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
   GAME LOOP
   ========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (
        gameRunning &&
        !gamePaused
    ) {

        updatePlayer(
            delta
        );


        updateTraffic(
            delta
        );

    }


    updateCamera();

    updateCompass();

    updateSpeedometer();

    drawMap(
        miniMap
    );


    renderer.render(
        scene,
        camera
    );

}


animate();


/* =========================================================
   LOADING FINISH
   ========================================================= */

loadingProgress(
    78,
    "FINALIZING GAME WORLD..."
);


setTimeout(
    () => {

        loadingProgress(
            90,
            "LOADING PIXEL RACER..."
        );

    },
    250
);


setTimeout(
    () => {

        loadingProgress(
            100,
            "READY"
        );


        setTimeout(
            () => {

                loader.classList.add(
                    "hidden"
                );

            },
            400
        );

    },
    650
);


/* =========================================================
   DEBUG
   ========================================================= */

console.log(
    "PIXEL RUSH — PIXEL RACER READY"
);

console.log(
    "W / UP = FORWARD"
);

console.log(
    "S / DOWN = REVERSE"
);

console.log(
    "A / D = STEER"
);

console.log(
    "SPACE = BRAKE"
);

console.log(
    "MOUSE = FREE CAMERA"
);
