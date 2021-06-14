const video = document.getElementById("video");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("../static/models/"),
  faceapi.nets.faceLandmark68Net.loadFromUri("../static/models/"),
  faceapi.nets.faceRecognitionNet.loadFromUri("../static/models/"),
  faceapi.nets.faceExpressionNet.loadFromUri("../static/models/"),
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: {} })
    .then(function (mediaStream) {
      video.srcObject = mediaStream;
    })
    .catch(function (err) {
      console.log(err.name + ": " + err.message);
    });
}

var vidB = $(".vidLoad");
var vidL = document.getElementById("vidL");
var vidReady = 0;
var emB = $(".emLoad");
var emL = document.getElementById("emL");
var emReady = 0;

var expM = document.getElementById("exp");

var em;

video.addEventListener("playing", () => {
  console.log("video started");
  vidB.css("backgroundColor", "green");
  vidL.innerHTML = "Video loaded!";
  vidReady = 1;
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
    expM.innerHTML = em;
    emB.css("backgroundColor", "green");
    emL.innerHTML = "Emotion loaded!";
    emReady = 1;
  }, 500);
});

var sent = 0;

function sendEmotion() {
  if (emReady == 1 && vidReady == 1) {
    video.pause();
    console.log("clicked successfully");
    $.ajax({
      url: "/detections",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(em),
      success: function (resp) {
        console.log("sent emotion", resp);
      },
    });
    sent = 1;
  } else {
    alert("Wait for video and emotion to load");
  }
}

function reset() {
  if (vidReady == 1) {
    video.play();
    sent = 0;
  }
}

var spB = $(".spLoad");
var spL = document.getElementById("spL");
var s = 0;

function spotLo() {
  $.ajax({
    url: "/spotLo",
    type: "GET",
    contentType: "application/json",
    error: function (data) {
      console.log("upload error", data);
      console.log(data.getAllResponseHeaders());
    },
    success: function (data) {
      console.log("spot got clicked");
    },
  }).done(function (data) {
    s = Object.values(data);
    if (s == 1) {
      spB.css("backgroundColor", "green");
      spL.innerHTML = "Spotify Loaded!";
    }
  });
}

function getSongs() {
  if (s == 0) {
    alert("Load Spotify");
  } else {
    if (sent == 0) {
      alert("Save an expression first");
    } else {
      $.ajax({
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
  }
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
}
