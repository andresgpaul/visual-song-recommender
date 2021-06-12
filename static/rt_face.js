const video = document.getElementById("video");

// var socket = io.connect();
var socket = io.connect(
//   "wss://visual-song-recommender.herokuapp.com/socket.io/?EIO=4&transport=websocket",
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
    // socket.emit("detections", {
    //   data: em,
    // });
  }, 500);
});

function sendEmotion() {
    video.pause();
    console.log("clicked successfully");
    socket.emit("detections", {
      data: em,
    });
}

function reset() {
    video.play();
}

function getSongs() {
    $.ajax({
      // url: "http://localhost:5000/emotion",
      url: "/emotion",
      type: "GET",
      contentType: "application/json",
      error: function (data) {
        console.log("upload error", data);
        console.log(data.getAllResponseHeaders());
      },
      success: function (data) {
        console.log("get clicked");
      },
    }).done(function (data) {
      var pred = Object.values(data);
      console.log(pred);
      var recs = pred[1];
  
      printSongs(recs);
    });
  }
  
  function printSongs(recs) {
    var artists = recs["artist"];
    var songs = recs["song"];
    var urls = recs["url"];
  
    var target = document.getElementById("url");
    while (target.firstChild) {
      target.removeChild(target.lastChild);
    }
    for (var i = 0; i < Object.keys(artists).length; i++) {
      var p = document.createElement("p");
      var b = document.createElement("br");
      var a = document.createElement("a");
      p.innerHTML = songs[i] + " by " + artists[i] + ":\n";
      a.setAttribute("href", urls[i]);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      a.innerHTML = urls[i];
      p.appendChild(b);
      p.appendChild(a);
      target.appendChild(p);
    }
  
    // $("body,html").animate({ scrollTop: $('#exp').offset().top }, 1200);
  
    // window.open(urls[0]);
  }
