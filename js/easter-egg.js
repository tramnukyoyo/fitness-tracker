// ============================
// Patrick Star Easter Egg
// ============================

let keySequence = '';
let lastKeyTime = 0;
const TARGET_WORD = 'patrick';
const MAX_DELAY = 500;

export function initEasterEgg() {
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    const currentTime = Date.now();

    if (currentTime - lastKeyTime > MAX_DELAY && keySequence.length > 0) {
        keySequence = '';
    }

    lastKeyTime = currentTime;
    keySequence += e.key.toLowerCase();

    if (keySequence.endsWith(TARGET_WORD)) {
        keySequence = '';
        showPatrick();
    }

    if (keySequence.length > 20) {
        keySequence = keySequence.slice(-10);
    }
}

async function showPatrick() {
    if (!window.THREE) {
        await loadThreeJS();
    }
    createPatrickScene();
}

function loadThreeJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function createPatrickScene() {
    const THREE = window.THREE;

    const overlay = document.createElement('div');
    overlay.id = 'patrick-overlay';
    overlay.innerHTML = `
        <div class="patrick-container">
            <canvas id="patrick-canvas"></canvas>
            <h2 class="patrick-title">PATRICK STAR!</h2>
            <p class="patrick-subtitle">"Is mayonnaise an instrument?"</p>
            <button class="patrick-close">Close</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
        #patrick-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            animation: patrickFadeIn 0.3s ease;
        }
        @keyframes patrickFadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }
        .patrick-container { text-align: center; }
        #patrick-canvas {
            width: 320px;
            height: 420px;
            border-radius: 20px;
        }
        .patrick-title {
            color: #FF69B4;
            font-size: 2rem;
            margin: 20px 0 10px;
            text-shadow: 0 0 20px #FF69B4, 0 0 40px #FF69B4;
            animation: patrickBounce 0.5s ease infinite alternate;
        }
        @keyframes patrickBounce {
            from { transform: scale(1) rotate(-2deg); }
            to { transform: scale(1.1) rotate(2deg); }
        }
        .patrick-subtitle {
            color: #aaa;
            font-size: 1.1rem;
            margin-bottom: 20px;
            font-style: italic;
        }
        .patrick-close {
            background: linear-gradient(135deg, #FF69B4, #FF1493);
            color: white;
            border: none;
            padding: 14px 40px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(255, 105, 180, 0.4);
        }
        .patrick-close:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(255, 105, 180, 0.6);
        }
    `;
    document.head.appendChild(style);

    const canvas = document.getElementById('patrick-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x006994);

    const camera = new THREE.PerspectiveCamera(60, 320 / 420, 0.1, 1000);
    camera.position.set(0, 0.5, 5.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(320, 420);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Patrick Group
    const patrickGroup = new THREE.Group();

    // ============================================
    // ACCURATE PATRICK STAR COLORS (from SpongeBob Wiki)
    // ============================================
    const salmonPink = 0xFFA07A;      // Coral/salmon pink body
    const darkSalmon = 0xE9967A;      // Darker shade for depth
    const dotColor = 0xFF6347;        // Tomato red dots
    const eyelidColor = 0xDDA0DD;     // Lavender/plum eyelids
    const eyebrowColor = 0x000000;    // BLACK eyebrows
    const shortsGreen = 0x7CFC00;     // Lawn green shorts
    const flowerPurple = 0x9932CC;    // Purple flowers

    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: salmonPink,
        shininess: 20
    });

    // ============================================
    // BODY - Chubby rounded starfish (NOT geometric)
    // ============================================

    // Main belly - big chubby sphere
    const bellyGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    const belly = new THREE.Mesh(bellyGeometry, bodyMaterial);
    belly.scale.set(1, 0.9, 0.7);
    belly.position.set(0, 0, 0);
    patrickGroup.add(belly);

    // HEAD - Pointy cone head (Patrick's iconic shape)
    const headGeometry = new THREE.ConeGeometry(0.6, 1.8, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 1.6, 0);
    patrickGroup.add(head);

    // Head base (round part connecting to body)
    const headBaseGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const headBase = new THREE.Mesh(headBaseGeometry, bodyMaterial);
    headBase.position.set(0, 0.9, 0);
    headBase.scale.set(1, 0.8, 0.8);
    patrickGroup.add(headBase);

    // ============================================
    // ARMS - Stubby rounded star points
    // ============================================
    const armGeometry = new THREE.CapsuleGeometry(0.35, 0.8, 8, 16);

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-1.3, 0.3, 0);
    leftArm.rotation.z = Math.PI / 4;
    patrickGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(1.3, 0.3, 0);
    rightArm.rotation.z = -Math.PI / 4;
    patrickGroup.add(rightArm);

    // ============================================
    // LEGS - Stubby rounded star points
    // ============================================
    const legGeometry = new THREE.CapsuleGeometry(0.4, 0.7, 8, 16);

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.7, -1.2, 0);
    leftLeg.rotation.z = Math.PI / 6;
    patrickGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.7, -1.2, 0);
    rightLeg.rotation.z = -Math.PI / 6;
    patrickGroup.add(rightLeg);

    // ============================================
    // FACE - Simple BLACK DOT eyes (accurate to show)
    // ============================================

    // Eyes are JUST BLACK DOTS - no white!
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.18, 1.1, 0.55);
    patrickGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.18, 1.1, 0.55);
    patrickGroup.add(rightEye);

    // Lavender droopy eyelids
    const eyelidGeometry = new THREE.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelidMaterial = new THREE.MeshPhongMaterial({ color: eyelidColor });

    const leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    leftEyelid.position.set(-0.18, 1.18, 0.52);
    leftEyelid.rotation.x = Math.PI;
    leftEyelid.scale.set(1.1, 0.6, 1);
    patrickGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    rightEyelid.position.set(0.18, 1.18, 0.52);
    rightEyelid.rotation.x = Math.PI;
    rightEyelid.scale.set(1.1, 0.6, 1);
    patrickGroup.add(rightEyelid);

    // BLACK thick eyebrows (correct color!)
    const eyebrowMaterial = new THREE.MeshPhongMaterial({ color: eyebrowColor });

    const leftEyebrow = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.08),
        eyebrowMaterial
    );
    leftEyebrow.position.set(-0.2, 1.32, 0.55);
    leftEyebrow.rotation.z = 0.3;
    patrickGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.08),
        eyebrowMaterial
    );
    rightEyebrow.position.set(0.2, 1.32, 0.55);
    rightEyebrow.rotation.z = -0.3;
    patrickGroup.add(rightEyebrow);

    // Big dumb smile
    const smileShape = new THREE.Shape();
    smileShape.moveTo(-0.3, 0);
    smileShape.quadraticCurveTo(0, -0.25, 0.3, 0);
    smileShape.quadraticCurveTo(0, 0.05, -0.3, 0);

    const smileGeometry = new THREE.ShapeGeometry(smileShape);
    const smileMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B0000,
        side: THREE.DoubleSide
    });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 0.75, 0.6);
    patrickGroup.add(smile);

    // ============================================
    // RED/ORANGE DOTS on body
    // ============================================
    const dotGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const dotMaterial = new THREE.MeshPhongMaterial({ color: dotColor });

    const dotPositions = [
        [-0.4, 0.5, 0.55], [0.5, 0.3, 0.5], [-0.3, -0.1, 0.6],
        [0.35, 0.6, 0.5], [-0.5, 0.1, 0.45], [0.2, -0.2, 0.6],
        [-0.15, 0.8, 0.5], [0.55, -0.1, 0.4], [-0.6, 0.4, 0.35],
        [0.1, 0.4, 0.65], [-0.25, 0.2, 0.6], [0.4, 0.1, 0.55]
    ];

    dotPositions.forEach(pos => {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(...pos);
        patrickGroup.add(dot);
    });

    // ============================================
    // SHORTS - Lime green with purple flowers
    // ============================================
    const shortsGeometry = new THREE.CylinderGeometry(0.85, 0.95, 0.6, 16);
    const shortsMaterial = new THREE.MeshPhongMaterial({ color: shortsGreen });
    const shorts = new THREE.Mesh(shortsGeometry, shortsMaterial);
    shorts.position.set(0, -0.5, 0);
    patrickGroup.add(shorts);

    // Purple flowers on shorts
    const flowerMaterial = new THREE.MeshPhongMaterial({ color: flowerPurple });

    function createFlower(x, y, z) {
        const flowerGroup = new THREE.Group();

        // Yellow center
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0xFFFF00 })
        );
        flowerGroup.add(center);

        // Purple petals
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                flowerMaterial
            );
            const angle = (i / 5) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.06, Math.sin(angle) * 0.06, 0);
            petal.scale.set(0.8, 1.2, 0.5);
            flowerGroup.add(petal);
        }

        flowerGroup.position.set(x, y, z);
        flowerGroup.lookAt(0, y, 2);
        return flowerGroup;
    }

    patrickGroup.add(createFlower(0.75, -0.45, 0.55));
    patrickGroup.add(createFlower(-0.7, -0.5, 0.6));
    patrickGroup.add(createFlower(0.4, -0.6, 0.8));
    patrickGroup.add(createFlower(-0.35, -0.4, 0.8));
    patrickGroup.add(createFlower(0, -0.55, 0.9));
    patrickGroup.add(createFlower(0.6, -0.35, 0.7));

    // Belly button
    const bellyButton = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshPhongMaterial({ color: darkSalmon })
    );
    bellyButton.position.set(0, -0.1, 0.65);
    bellyButton.scale.set(1, 0.5, 0.3);
    patrickGroup.add(bellyButton);

    // ============================================
    // ENVIRONMENT
    // ============================================

    // Sandy floor
    const sandGeometry = new THREE.PlaneGeometry(15, 15);
    const sandMaterial = new THREE.MeshPhongMaterial({ color: 0xF4D03F });
    const sand = new THREE.Mesh(sandGeometry, sandMaterial);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -2;
    scene.add(sand);

    // Bubbles
    const bubbles = [];
    const bubbleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const bubbleMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3
    });

    for (let i = 0; i < 15; i++) {
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.set(
            (Math.random() - 0.5) * 6,
            Math.random() * 5 - 2,
            (Math.random() - 0.5) * 3
        );
        bubble.userData.speed = 0.008 + Math.random() * 0.015;
        bubbles.push(bubble);
        scene.add(bubble);
    }

    // Add Patrick to scene
    scene.add(patrickGroup);
    patrickGroup.position.y = 0.2;

    // ============================================
    // ANIMATION
    // ============================================
    let time = 0;
    let animationId;

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.016;

        // Gentle swaying
        patrickGroup.rotation.y = Math.sin(time * 0.5) * 0.4;

        // Breathing/bobbing
        patrickGroup.position.y = 0.2 + Math.sin(time * 1.5) * 0.08;
        patrickGroup.scale.x = 1 + Math.sin(time * 2) * 0.02;
        patrickGroup.scale.y = 1 - Math.sin(time * 2) * 0.02;

        // Arm wiggle
        leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 2) * 0.15;
        rightArm.rotation.z = -Math.PI / 4 - Math.sin(time * 2 + 1) * 0.15;

        // Blink
        const blinkCycle = time % 5;
        if (blinkCycle > 4.7) {
            leftEyelid.scale.y = 1.2;
            rightEyelid.scale.y = 1.2;
        } else {
            leftEyelid.scale.y = 0.6;
            rightEyelid.scale.y = 0.6;
        }

        // Bubbles
        bubbles.forEach(bubble => {
            bubble.position.y += bubble.userData.speed;
            bubble.position.x += Math.sin(time + bubble.position.y) * 0.003;
            if (bubble.position.y > 4) bubble.position.y = -2;
        });

        renderer.render(scene, camera);
    }
    animate();

    // Close handlers
    const closeHandler = () => {
        cancelAnimationFrame(animationId);
        overlay.remove();
        style.remove();
    };

    overlay.querySelector('.patrick-close').addEventListener('click', closeHandler);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escHandler);
        }
    });
}
