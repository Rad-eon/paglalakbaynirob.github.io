var rows = [
    "############",
    "#..........#",
    "#.M....C...#",
    "#....##....#",
    "#.C..#..M..#",
    "#....#.....#",
    "#..M.....B.#",
    "#..........#",
    "############"
];

var map = rows.map(function (row) {
    return row.split("");
});

var player = {
    x: 1,
    y: 7,
    hp: 30,
    maxHp: 30,
    attack: 6,
    gold: 0,
    potions: 1,
    level: 1
};

var enemy = null;
var enemyX = 0;
var enemyY = 0;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a3d);
scene.fog = new THREE.Fog(0x1a2a3d, 9, 20);

var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(1, 6, 12);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
document.getElementById("view").appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xaac8ff, 0x2a3a2a, 0.7));

var sun = new THREE.DirectionalLight(0xffe2b0, 0.9);
sun.position.set(10, 12, 8);
sun.target.position.set(5.5, 0, 4);
scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -9;
sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9;
sun.shadow.camera.bottom = -9;
scene.add(sun);

var checker = document.createElement("canvas");
checker.width = 12;
checker.height = 9;

var pen = checker.getContext("2d");

for (var cy = 0; cy < 9; cy++) {
    for (var cx = 0; cx < 12; cx++) {
        pen.fillStyle = (cx + cy) % 2 ? "#4f8a4c" : "#5a9a56";
        pen.fillRect(cx, cy, 1, 1);
    }
}

var floorTexture = new THREE.CanvasTexture(checker);
floorTexture.magFilter = THREE.NearestFilter;

var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshLambertMaterial({ map: floorTexture })
);

floor.rotation.x = -Math.PI / 2;
floor.position.set(5.5, 0, 4);
floor.receiveShadow = true;
scene.add(floor);

var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshLambertMaterial({ color: 0x16301f })
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(5.5, -0.02, 4);
scene.add(ground);

function shape(geometry, color, x, y, z) {
    var mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ color: color })
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    return mesh;
}

function makeObject(symbol) {
    var g = new THREE.Group();

    if (symbol === "#") {
        g.add(shape(new THREE.CylinderGeometry(0.1, 0.12, 0.5), 0x6b4423, 0, 0.25, 0));
        g.add(shape(new THREE.ConeGeometry(0.46, 0.8, 8), 0x2f6b3a, 0, 0.8, 0));
        g.add(shape(new THREE.ConeGeometry(0.32, 0.7, 8), 0x3b8447, 0, 1.25, 0));
        g.scale.setScalar(0.85 + Math.random() * 0.35);

    } else if (symbol === "M") {
        g.add(shape(new THREE.SphereGeometry(0.35, 16, 12), 0x6fd04a, 0, 0.4, 0));
        g.add(shape(new THREE.SphereGeometry(0.06, 8, 8), 0x000000, -0.12, 0.5, 0.3));
        g.add(shape(new THREE.SphereGeometry(0.06, 8, 8), 0x000000, 0.12, 0.5, 0.3));
        g.userData.bounce = true;

    } else if (symbol === "B") {
        g.add(shape(new THREE.BoxGeometry(0.9, 0.7, 1.2), 0xc0392b, 0, 0.5, 0));
        g.add(shape(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xe74c3c, 0, 1, 0.6));
        g.add(shape(new THREE.ConeGeometry(0.15, 0.4, 6), 0xf1c40f, -0.2, 1.4, 0.6));
        g.add(shape(new THREE.ConeGeometry(0.15, 0.4, 6), 0xf1c40f, 0.2, 1.4, 0.6));
        g.userData.bounce = true;

    } else if (symbol === "C") {
        g.add(shape(new THREE.BoxGeometry(0.6, 0.4, 0.45), 0x8b5a2b, 0, 0.2, 0));
        g.add(shape(new THREE.BoxGeometry(0.62, 0.08, 0.47), 0xf1c40f, 0, 0.42, 0));
    }

    return g;
}

var objects = {};

for (var y = 0; y < map.length; y++) {
    for (var x = 0; x < map[y].length; x++) {
        if (map[y][x] !== ".") {
            var obj = makeObject(map[y][x]);
            obj.position.set(x, 0, y);
            scene.add(obj);
            objects[x + "," + y] = obj;
        }
    }
}

var playerMesh = new THREE.Group();

playerMesh.add(shape(new THREE.CylinderGeometry(0.2, 0.25, 0.6), 0x3b78d8, 0, 0.3, 0));
playerMesh.add(shape(new THREE.SphereGeometry(0.2, 16, 12), 0xf0cfa8, 0, 0.8, 0));
playerMesh.add(shape(new THREE.ConeGeometry(0.24, 0.35, 12), 0xc0392b, 0, 1.1, 0));

var lantern = new THREE.PointLight(0xffc87a, 0.9, 6);
lantern.position.set(0, 1.4, 0);
playerMesh.add(lantern);

playerMesh.position.set(player.x, 0, player.y);
scene.add(playerMesh);

function removeObject(x, y) {
    var key = x + "," + y;
    scene.remove(objects[key]);
    delete objects[key];
}

function resize() {
    var w = document.getElementById("view").clientWidth;
    var h = Math.round(w * 0.65);

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

function animate(time) {
    requestAnimationFrame(animate);

    playerMesh.position.x += (player.x - playerMesh.position.x) * 0.2;
    playerMesh.position.z += (player.y - playerMesh.position.z) * 0.2;

    camera.position.x += (playerMesh.position.x - camera.position.x) * 0.1;
    camera.position.z += (playerMesh.position.z + 5 - camera.position.z) * 0.1;
    camera.position.y = 6;
    camera.lookAt(playerMesh.position);

    for (var key in objects) {
        if (objects[key].userData.bounce) {
            objects[key].position.y = Math.abs(Math.sin(time / 300)) * 0.15;
        }
    }

    renderer.render(scene, camera);
}

requestAnimationFrame(animate);

function draw() {
    document.getElementById("hpFill").style.width =
        Math.max(0, player.hp / player.maxHp * 100) + "%";

    document.getElementById("hpText").textContent =
        Math.max(0, player.hp) + "/" + player.maxHp;

    document.getElementById("lvChip").textContent = "Lv " + player.level;
    document.getElementById("goldChip").textContent = "🪙 " + player.gold;
    document.getElementById("potChip").textContent = "🧪 " + player.potions;

    document.getElementById("enemyBar").hidden = !enemy;

    if (enemy) {
        document.getElementById("enemyName").textContent = enemy.name;
        document.getElementById("enemyFill").style.width =
            Math.max(0, enemy.hp / enemy.maxHp * 100) + "%";
    }
}

function say(text) {
    document.getElementById("message").textContent = text;
}

function move(dx, dy) {
    if (enemy) return;

    var x = player.x + dx;
    var y = player.y + dy;
    var tile = map[y][x];

    if (tile === "#") return;

    if (tile === "C") {
        map[y][x] = ".";
        removeObject(x, y);
        player.gold += 10;
        player.potions += 1;
        say("You found 10 gold and a potion!");

    } else if (tile === "M") {
        startFight(x, y, { name: "Goblin", hp: 15, attack: 4 });
        return;

    } else if (tile === "B") {
        startFight(x, y, { name: "Dragon", hp: 50, attack: 9 });
        return;

    } else {
        say("");
    }

    player.x = x;
    player.y = y;

    draw();
}

function startFight(x, y, newEnemy) {
    enemy = newEnemy;
    enemy.maxHp = enemy.hp;
    enemyX = x;
    enemyY = y;

    document.getElementById("moveButtons").hidden = true;
    document.getElementById("battleButtons").hidden = false;

    say("A " + enemy.name + " appears!");
    draw();
}

function attack() {
    var damage = player.attack + Math.floor(Math.random() * 4);
    enemy.hp -= damage;

    var text = "You hit the " + enemy.name + " for " + damage + ". ";

    if (enemy.hp <= 0) {
        winFight(text);
        return;
    }

    var hit = enemy.attack + Math.floor(Math.random() * 3);
    player.hp -= hit;

    text += "It hits you for " + hit + ". (Enemy HP " + enemy.hp + ")";

    if (player.hp <= 0) {
        loseFight();
        return;
    }

    say(text);
    draw();
}

function usePotion() {
    if (player.potions === 0) {
        say("No potions left!");
        return;
    }

    player.potions -= 1;
    player.hp = Math.min(player.maxHp, player.hp + 20);

    var hit = enemy.attack;
    player.hp -= hit;

    say("You heal, but the " + enemy.name + " hits you for " + hit + ".");

    if (player.hp <= 0) loseFight();

    draw();
}

function flee() {
    if (enemy.name === "Dragon") {
        say("You can't flee from the dragon!");
        return;
    }

    endFight();
    say("You ran away.");
}

function winFight(text) {
    var wasDragon = (enemy.name === "Dragon");

    map[enemyY][enemyX] = ".";
    removeObject(enemyX, enemyY);

    player.gold += 5;
    player.level += 1;
    player.attack += 2;
    player.maxHp += 5;
    player.hp = player.maxHp;

    endFight();

    say(wasDragon ? "You beat the dragon. You win!" : text + "You win and level up!");
}

function loseFight() {
    player.hp = player.maxHp;
    player.x = 1;
    player.y = 7;

    endFight();

    say("You were defeated and woke up at the start.");
}

function endFight() {
    enemy = null;

    document.getElementById("moveButtons").hidden = false;
    document.getElementById("battleButtons").hidden = true;

    draw();
}

document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
        e.preventDefault();
        move(0, -1);
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        move(0, 1);
    }

    if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1, 0);
    }

    if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1, 0);
    }
});

draw();