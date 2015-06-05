var socket = io();

if(window.location.pathname=='/') {
  var btnFwd = document.getElementById('fwd');
  var btnBck = document.getElementById('bck');

  window.addEventListener('deviceorientation', function(event) {
    socket.emit('deviceorientation', {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    });
  });

  var fwdPressed, bckPressed;

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
}
//   window.addEventListener('devicemotion', function(event) {
//     socket.emit('devicemotion', event.accelerationIncludingGravity);
//   });
// };

if(window.location.pathname=='/view') {
  var controlType = 'object';

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
  var buildingBodys = [], buildingMeshes = [];

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 0, 1000 );
  var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 );
  // camera.position.z = 500;
  camera.position.set(-12,4,0);

  // physics
  var world = new CANNON.World();
  world.gravity.set(0, 0, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setClearColor( scene.fog.color, 1 );
  document.body.appendChild( renderer.domElement );

  // FLOOR
  var geometry = new THREE.PlaneBufferGeometry( 30, 30, 20, 20 );
  geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, -0.1));
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ));
  var material = new THREE.MeshLambertMaterial({
    color: 0x666666,
    // wireframe: true,
    map: THREE.ImageUtils.loadTexture('/grass.jpg')
  });
  var plane = new THREE.Mesh( geometry, material );
  plane.receiveShadow = true;
  scene.add(plane);

  // physics
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, -0.1)
  });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI / 2);
  world.add(groundBody);

  // OBJECTS
  // geometry = new THREE.BoxGeometry( 2, 1, 0.2 );
  // material = new THREE.MeshLambertMaterial({ color: 'gray' });
  // var cube = new THREE.Mesh( geometry, material );
  // scene.add( cube );

  for(var i=0; i<5; i++) {
    var floors = Math.floor(Math.random() * 10) + 2;
    // var posRnd = Math.random()*3;
    for(var j=0; j<floors; j++) {
      geometry = new THREE.BoxGeometry( 1, 0.2, 1 );
      geometry.applyMatrix( new THREE.Matrix4().makeTranslation(i*2, j*0.2, i*2));
      material = new THREE.MeshLambertMaterial({ color: 'white' });
      // geometry.position.set( i*posRnd, j*0.2, i*posRnd );
      var cube = new THREE.Mesh( geometry, material );
      cube.castShadow = true;
      cube.receiveShadow = true;
      scene.add( cube );
      buildingMeshes.push(cube);

      var halfExtents = new CANNON.Vec3( 1, 0.2, 1 );
      var boxShape = new CANNON.Box(halfExtents);
      var boxBody = new CANNON.Body({mass: 5});
      boxBody.addShape(boxShape);
      boxBody.position.set(i*2, j*0.2, i*2);

      world.add(boxBody);
      buildingBodys.push(boxBody);

    }
  }

  // LIGHT
  var light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

  var directionalLight = new THREE.SpotLight(0xffffff);
  directionalLight.position.set(15, 100, 15);
  directionalLight.castShadow = true;
  directionalLight.shadowDarkness = 0.5;
  directionalLight.shadowMapWidth = 1024;
  directionalLight.shadowMapHeight = 1024;
  // light.shadowCameraVisible = true;
  scene.add(directionalLight);

  var dt = 1/60;
  var render = function () {
    requestAnimationFrame( render );

    world.step(dt);
    for (var i=0; i<buildingBodys.length; i++) {
      buildingMeshes[i].position.copy(buildingBodys[i].position);
      buildingMeshes[i].quaternion.copy(buildingBodys[i].quaternion);
    }

    renderer.render(scene, camera);
  };

  render();

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
  })

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
