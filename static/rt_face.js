const video = document.getElementById("video");

// var socket = io.connect();
var socket = io.connect(
  "ws://visual-song-recommender.herokuapp.com:16570/socket.io/?EIO=4&transport=websocket",
  {
    secure: true,
    transports: ["flashsocket", "polling", "websocket"],
  }
);
socket.on("connect", function () {
  console.log("SOCKET CONNECTED");
});

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("../static/models/"),
  faceapi.nets.faceLandmark68Net.loadFromUri("../static/models/"),
  faceapi.nets.faceRecognitionNet.loadFromUri("../static/models/"),
  faceapi.nets.faceExpressionNet.loadFromUri("../static/models/"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

var em;

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    var exps = detections[0].expressions;
    em = Object.keys(exps).reduce((a, b) => (exps[a] > exps[b] ? a : b));
    // console.log(em);
    var expM = document.getElementById("exp");
    expM.innerHTML = em;
    socket.emit("detections", {
      data: em,
    });
  }, 500);
});
