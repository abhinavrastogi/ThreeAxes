var socket = io();

if(window.location.pathname=='/') {
  window.addEventListener('deviceorientation', function(event) {
    socket.emit('deviceorientation', {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    });
  });
  window.addEventListener('devicemotion', function(event) {
    socket.emit('devicemotion', event.accelerationIncludingGravity);
  });
};

if(window.location.pathname=='/view') {
  socket.on('deviceorientation', function(data) {
    console.log(data);
  });
};
