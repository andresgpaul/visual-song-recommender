// window.onload = () => {
//   $("#sendbutton").click(() => {
//     var ima = document.getElementById("imagebox");
//     if (ima.getAttribute("src") == "") {
//       alert("Upload an image");
//     } else {
//       var sMsg = document.getElementById("s-msg");
//       sMsg.innerHTML = "Loading image...";
//       imagebox = $("#imagebox");
//       input = $("#imageinput")[0];
//       if (input.files && input.files[0]) {
//         let formData = new FormData();
//         formData.append("image", input.files[0]);
//         $.ajax({
//           url: "http://localhost:5000/test", // fix this to your liking
//           type: "POST",
//           data: formData,
//           cache: false,
//           processData: false,
//           contentType: false,
//           error: function (data) {
//             console.log("upload error", data);
//             console.log(data.getAllResponseHeaders());
//           },
//           success: function (data) {
//             sMsg.innerHTML =
//               "Image uploaded successfully! Click below to get songs.";

//             getEmotion(); // call backend and detect emotion from image
//           },
//         });
//       }
//     }
//   });
// };

function getEmotion() {
  $.ajax({
    // url: "http://localhost:5000/emotion",
    url: "https://visual-song-recommender.herokuapp.com/emotion",
    type: "GET",
    contentType: "application/json",
    error: function (data) {
      console.log("upload error", data);
      console.log(data.getAllResponseHeaders());
    },
    success: function (data) {
      console.log("clicked successfully");
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

  window.open(urls[0]);
}
