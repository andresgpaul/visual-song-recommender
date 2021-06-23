const video = document.getElementById("video");

// Loading models for the different face-api networks.
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("../static/models/"),
  faceapi.nets.faceLandmark68Net.loadFromUri("../static/models/"),
  faceapi.nets.faceRecognitionNet.loadFromUri("../static/models/"),
  faceapi.nets.faceExpressionNet.loadFromUri("../static/models/"),
]).then(startVideo);

// Function to start video streaming from user's device
// (called when face-api models are loaded).
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

// Global variables initialized, used to change html elements.
var vidB = $(".vidLoad");
var vidL = document.getElementById("vidL");
var vidReady = 0;
var emB = $(".emLoad");
var emL = document.getElementById("emL");
var emReady = 0;

var expM = document.getElementById("exp");

var em;

// Video event listener with functions to do when playing.
// Flag "vidReady" used to know if video is running.
// The interval uses the faceapi models to detect emotions
// from the video stream.
// We save the emotion with highest probability into "em" and print it in HTML.
// Flag "emReady" used to know if emotion detection is working.
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

// This function sends a POST request to the backend function "detections"
// and provides the emotion detected. 
// Flag "sent" used to know if emotion has been sent to backend.
// Function called when pressed "Save Expression" button.
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

// This function starts playing again the video, since it is paused when
// "Save expression" is clicked.
// Resets flag "sent" to be able to give a new one.
// Function called when "Reset Video" button is pressed.
function reset() {
  if (vidReady == 1) {
    video.play();
    sent = 0;
  }
}

// Initialization of global variables.
var spB = $(".spLoad");
var spL = document.getElementById("spL");
var s = 0;

// This function calls the backend function "spotLo" with a GET request.
// If response is equal to 1, it updates some HTML content.
// Function called when "Load Spotify" button is pressed.
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

// This function calls the backend function "emotion" if previous flags are on.
// The response is the recommended songs with song name, artist name and url.
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

// With the received song parameters in the previous function,
// this function creates HTML elements to show a list of the obtained songs.
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
