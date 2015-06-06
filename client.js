var socket = io();

if(window.location.pathname=='/') {
  var btnFwd = document.getElementById('fwd');
  var btnBck = document.getElementById('bck');
  var carFwd = document.getElementById('carFwd');
  var carBck = document.getElementById('carBck');
  var addBtn = document.getElementById('addBtn');

  window.addEventListener('deviceorientation', function(event) {
    socket.emit('deviceorientation', {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    });
  });

  var fwdPressed, bckPressed, shootPressed;

  btnFwd.addEventListener('touchstart', function(ev) {
    ev.preventDefault();
    fwdPressed = setInterval(function() {
      socket.emit('btnFwd', {});
    }, 50);
  });
  btnFwd.addEventListener('touchend', function(ev) {
    ev.preventDefault();
    clearInterval(fwdPressed);
  });

  btnBck.addEventListener('touchstart', function(ev) {
    ev.preventDefault();
    bckPressed = setInterval(function() {
      socket.emit('btnBck', {});
    }, 50);
  });
  btnBck.addEventListener('touchend', function(ev) {
    ev.preventDefault();
    clearInterval(bckPressed);
  });

  shootBtn.addEventListener('touchstart', function(ev) {
    ev.preventDefault();
    socket.emit('shoot', {});
    shootPressed = setInterval(function() {
      socket.emit('shoot', {});
    }, 200);
  });
  shootBtn.addEventListener('touchend', function(ev) {
    ev.preventDefault();
    clearInterval(shootPressed);
  });

  addBtn.addEventListener('click', function(ev) {
    socket.emit('addBtn', {});
  });
}
//   window.addEventListener('devicemotion', function(event) {
//     socket.emit('devicemotion', event.accelerationIncludingGravity);
//   });
// };

if(window.location.pathname=='/view') {


  var controlType = 'object';
  var carPos = {x: 5, y: 0, z: 0};

  document.getElementById('moveobj').addEventListener('click', function(ev) {
    controlType = 'object'
  });
  document.getElementById('movecam').addEventListener('click', function(ev) {
    controlType = 'camera'
  });

  var createQuaternion = function () {
    var finalQuaternion = new THREE.Quaternion();
    var deviceEuler = new THREE.Euler();
    var screenTransform = new THREE.Quaternion();
    var worldTransform = new THREE.Quaternion( - Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) ); // - PI/2 around the x-axis
    var minusHalfAngle = 0;

    return function ( alpha, beta, gamma, screenOrientation ) {
      deviceEuler.set( beta, alpha, - gamma, 'YXZ' );
      finalQuaternion.setFromEuler( deviceEuler );
      minusHalfAngle = - screenOrientation / 2;
      screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );
      finalQuaternion.multiply( screenTransform );
      finalQuaternion.multiply( worldTransform );

      return finalQuaternion;
    }
  }();

  // collections
  var buildingBodys = [], buildingMeshes = [], bulletMeshes = [], bulletBodys = [];
  var controls;

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 0, 70 );
  var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 );
  // camera.position.z = 500;
  camera.position.set(-20,10,0);

  //controls
  // controls = new THREE.TrackballControls( camera );
  // controls.rotateSpeed = 1.0;
  // controls.zoomSpeed = 1.2;
	// controls.panSpeed = 0.8;
  //
	// controls.noZoom = false;
	// controls.noPan = false;
  //
	// controls.staticMoving = true;
	// controls.dynamicDampingFactor = 0.3;
  //
	// controls.keys = [ 65, 83, 68 ];
  //
	// controls.addEventListener( 'change', render );

  // physics
  var world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setClearColor( scene.fog.color, 1 );
  renderer.shadowMapType = THREE.PCFSoftShadowMap;
  document.body.appendChild( renderer.domElement );

  // FLOOR
  var geometry = new THREE.PlaneGeometry( 70, 70, 70, 70 );
  geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, -1));
  var texture = THREE.ImageUtils.loadTexture( "/grass.jpg" );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 10, 10 );
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ));
  var material = new THREE.MeshLambertMaterial({
    color: 0x666666,
    // wireframe: true,
    map: texture
  });
  var plane = new THREE.Mesh( geometry, material );
  plane.receiveShadow = true;
  scene.add(plane);

  // geometry = new THREE.TetrahedronGeometry(0.5);
  // // geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ));
  // // geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 4, 0));
  // geometry.
  // var playerMaterial = new THREE.MeshLambertMaterial({color: 'white', wireframe: true});
  // var player = new THREE.Mesh(geometry, playerMaterial);
  // // player.castShadow = true;
  // // player.receiveShadow = true;
  // player.rotation.set(0,1,0,1);
  // scene.add(player);

  // physics
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, -1, 0)
  });
  groundBody.addShape(groundShape);
  // groundBody.rotation.set();
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.add(groundBody);

  // OBJECTS
  // window.xwing={};

  // var cargeometry = new THREE.BoxGeometry( 1, 0.2, 2 );
  // // cargeometry.applyMatrix( new THREE.Matrix4().makeTranslation(carPos.x, carPos.y, carPos.z));
  // material = new THREE.MeshLambertMaterial({ color: 'gray' });
  // var car = new THREE.Mesh( cargeometry, material );
  // scene.add( car );

  var textures = [];

  for(var t=1; t<=6; t++) {
    var texture = THREE.ImageUtils.loadTexture( "/containers/container"+t+".png" );
    textures.push(texture);
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set( 2, 2 );
  }

  var woodTexture = THREE.ImageUtils.loadTexture('/wood.png');

  function addBox(posx, posy, posz) {
    var boxWidth = 3, boxHeight = 1, boxDepth = 1;
    var rndTex = Math.floor(Math.random() * 5) + 1;

    var boxGeometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );
    // boxGeometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 1, 0));
    var boxMaterial = new THREE.MeshLambertMaterial({ color: 'white', map: textures[rndTex] });
    var cube = new THREE.Mesh( boxGeometry, boxMaterial );
    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add( cube );
    buildingMeshes.push(cube);

    var boxShape = new CANNON.Box(new CANNON.Vec3( boxWidth/2, boxHeight/2, boxDepth/2 ));
    var boxBody = new CANNON.Body({ mass: 15 });
    boxBody.addShape(boxShape);
    boxBody.position.set(posx, posy, posz);

    world.add(boxBody);
    buildingBodys.push(boxBody);
  }

  function addSmallBox(posx, posy, posz) {
    var boxWidth = 1, boxHeight = 1, boxDepth = 1;
    var rndTex = Math.floor(Math.random() * 5) + 1;

    var boxGeometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );
    // boxGeometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 1, 0));
    var boxMaterial = new THREE.MeshLambertMaterial({ color: 'white', map: woodTexture });
    var cube = new THREE.Mesh( boxGeometry, boxMaterial );
    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add( cube );
    buildingMeshes.push(cube);

    var boxShape = new CANNON.Box(new CANNON.Vec3( boxWidth/2, boxHeight/2, boxDepth/2 ));
    var boxBody = new CANNON.Body({ mass: 5 });
    boxBody.addShape(boxShape);
    boxBody.position.set(posx, posy, posz);

    world.add(boxBody);
    buildingBodys.push(boxBody);
  }


  for(var i=0; i<5; i++) {
    // var floors = Math.floor(Math.random() * 10) + 2;
    addBox(0, i, 0);
  }

  // LIGHT
  var light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

  var directionalLight = new THREE.SpotLight(0xffffff);
  directionalLight.position.set(-100, 700, 100);
  directionalLight.castShadow = true;
  directionalLight.shadowDarkness = 0.4;
  directionalLight.shadowCameraNear = 10;
  directionalLight.shadowCameraFar = 1000;
  directionalLight.shadowCameraFov = 20;
  directionalLight.shadowMapWidth = 1024; // default is 512
  directionalLight.shadowMapHeight = 1024; // default is 512
  // light.shadowCameraVisible = true;
  scene.add(directionalLight);

  var dt = 1/60;

  function render() {
    renderer.render( scene, camera );
  }

  var t=0;

  // var loader = new THREE.OBJMTLLoader();
  // loader.load('/mig/Mig-25_Foxbat.obj', '/mig/Mig-25_Foxbat.mtl', function (obj) {
    // xwing = obj;
    // obj.rotation.set(-1,-1,-1);
    // xwing.position.applyQuaternion(new THREE.Quaternion(1, 0, 0, Math.PI / 2))


	// 	obj.position.y = - 80;
  //   scene.add(obj);
  //   // console.log(xwing);
  //   animate();
  // });


  var animate = function () {
    requestAnimationFrame( animate );

    // controls.update();

    world.step(dt);
    for (var i=0; i<buildingBodys.length; i++) {
      buildingMeshes[i].position.copy(buildingBodys[i].position);
      buildingMeshes[i].quaternion.copy(buildingBodys[i].quaternion);
    }
    // console.log(carPos);
    t += 0.01;

    // car.rotation.y -= 0.01;
    // car.position.set(12 * Math.cos(t), 0, 12 * Math.sin(t));

    for (var i=0; i<bulletBodys.length; i++) {
      bulletMeshes[i].position.copy(bulletBodys[i].position);
      bulletMeshes[i].quaternion.copy(bulletBodys[i].quaternion);
    }

    // xwing.position.copy(camera.position);
    // xwing.quaternion.copy(camera.quaternion);

    render();
  };
  animate();

  // for(var i=0; i<buildingBodys.length; i++) {
  //   console.log(buildingMeshes[i].position);
  //   console.log(buildingBodys[i].position);
  // }

  socket.on('deviceorientation', function(data) {
    var alpha  = data.gamma ? THREE.Math.degToRad( data.alpha ) : 0; // Z
		var beta   = data.beta  ? THREE.Math.degToRad( data.beta  ) : 0; // X'
		var gamma  = data.gamma ? THREE.Math.degToRad( data.gamma ) : 0; // Y''

    var q = createQuaternion(alpha, beta, gamma, THREE.Math.degToRad(90));

    // var rotEuler = new THREE.Euler( 0, THREE.Math.degToRad(90), 0, 'XYZ' );
    // var rotQuat = new THREE.Quaternion();
    // rotQuat.setFromEuler(rotEuler);
    // q.multiply(rotQuat);

    // if(controlType == 'object') {
      // cube.quaternion.copy(q);
    // } else {
      // q.inverse();
      var qm = new THREE.Quaternion();
      THREE.Quaternion.slerp(camera.quaternion, q, qm, 0.2);
      camera.quaternion.copy(qm);
    // }
  });

  socket.on('btnFwd', function(data) {
    camera.translateZ( - 0.2 );
  });
  socket.on('btnBck', function(data) {
    camera.translateZ( 0.2 );
  });

  var bulletShape = new CANNON.Sphere(0.1);
  var bulletGeometry = new THREE.SphereGeometry(bulletShape.radius, 32, 32);
  var shootDirection = new THREE.Vector3();
  var shootVelo = 40;
  var projector = new THREE.Projector();

  function getShootDir(targetVec){
    var vector = targetVec;
    targetVec.set(0,0,1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Ray(camera.position, vector.sub(camera.position).normalize() );
    targetVec.copy(ray.direction);
  }

  socket.on('shoot', function() {
    var x = camera.position.x;
    var y = camera.position.y;
    var z = camera.position.z;

    var bulletBody = new CANNON.Body({ mass: 5 });
    bulletBody.addShape(bulletShape);

    var bulletMaterial = new THREE.MeshPhongMaterial({
      color: 0xdddddd,
      specular: 0x009900,
      shininess: 30,
      shading: THREE.FlatShading
    });
    var bulletMesh = new THREE.Mesh( bulletGeometry, bulletMaterial );
    world.add(bulletBody);
    scene.add(bulletMesh);
    bulletMesh.castShadow = true;
    bulletMesh.receiveShadow = true;

    if(bulletBodys.length > 25) {
      world.remove(bulletBodys[0]);
      scene.remove(bulletMeshes[0]);
      bulletBodys.splice(0,1);
      bulletMeshes.splice(0,1);
    }

    bulletBodys.push(bulletBody);
    bulletMeshes.push(bulletMesh);
    getShootDir(shootDirection);
    bulletBody.velocity.set( shootDirection.x * shootVelo,
      shootDirection.y * shootVelo,
      shootDirection.z * shootVelo);

    // Move the bullet outside the player sphere
    x += shootDirection.x * (bulletShape.radius*1.02 + bulletShape.radius);
    y += shootDirection.y * (bulletShape.radius*1.02 + bulletShape.radius);
    z += shootDirection.z * (bulletShape.radius*1.02 + bulletShape.radius);
    bulletBody.position.set(x,y,z);
    bulletMesh.position.set(x,y,z);

  });

  socket.on('addBtn', function() {
    var posx = Math.random() * 30 - 15;
    var posy = Math.random() + 10;
    var posz = Math.random() * 30 - 15;
    // console.log('adding', posx, posy, posz);
    if(Math.random() > 0.5)
      addBox(posx, posy, posz);
    else
      addSmallBox(posx, posy, posz);
  });

  window.addEventListener( 'resize', onWindowResize, false );

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  // var box = document.getElementById('box');
  // socket.on('deviceorientation', function(data) {
  //   // console.log(data);
  //   var baseRotationMatrix = getBaseRotationMatrix(data.alpha, data.beta, data.gamma);
  //   // console.log(baseRotationMatrix);
  //   var quadMatrix = [
  //     [baseRotationMatrix[0], baseRotationMatrix[1], baseRotationMatrix[2], 0],
  //     [baseRotationMatrix[3], baseRotationMatrix[4], baseRotationMatrix[5], 0],
  //     [baseRotationMatrix[6], baseRotationMatrix[7], baseRotationMatrix[8], 0],
  //     [0, 0, 0, 1]
  //   ];
  //   // console.log(quadMatrix);
  //   //
  //   var midArr = [quadMatrix[0].join(', '), quadMatrix[1].join(', '), quadMatrix[2].join(', '), quadMatrix[3].join(', ')];
  //   var str = midArr.join(', ');
  //   // console.log(str);
  //   // box.style.transform = "rotate("+ data.gamma +"deg) rotate3d(1,0,0, "+ (data.beta*-1 + 90)+"deg)";
  //   window.requestAnimationFrame(function() {
  //     box.style.webkitTransform = "matrix3d("+str+")";
  //   })
  // });
};
