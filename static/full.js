var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
  clientId: "413809fc6a6a4d4aadff06f7a9176b94",
  clientSecret: "58ac47fad3784cf193becfd7b99bcc9a",
});

// spotifyApi.setAccessToken(
//   "BQCsyXTRLxfc1EXsQiuZcJaoYgmCYXdZNQaqQBPDpEBjVuqglSgg57-BHzN8v1B2D1EuzPWMkPQfj5iGFRbmMnE_ltqEjqiHgkSknZP1mctVdi7EVED5xYM7hRiSPflpfU0Eo3rMB27QXL_019eU"
// );

window.onload = () => {
  $("#sendbutton").click(() => {
    var sMsg = document.getElementById("s-msg");
    sMsg.innerHTML = "Loading image...";
    imagebox = $("#imagebox");
    input = $("#imageinput")[0];
    if (input.files && input.files[0]) {
      let formData = new FormData();
      formData.append("image", input.files[0]);
      $.ajax({
        url: "http://localhost:5000/test", // fix this to your liking
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        error: function (data) {
          console.log("upload error", data);
          console.log(data.getAllResponseHeaders());
        },
        success: function (data) {
          sMsg.innerHTML =
            "Image uploaded successfully! Click below to get songs.";
          //   bytestring = data["status"];
          //   image = bytestring.split("'")[1];
          //   imagebox.attr("ng-src", "data:image/jpeg;base64," + image);
          
          getEmotion(); // call backend and detect emotion from image
        },
      });
    }
  });
  const limit = 5;
  // make maximum 5 selectable checkboxes, need to uncheck to keep checking
  $("input.gnre").on("change", function (evt) {
    if ($(this).siblings(":checked").length >= limit) {
      this.checked = false;
    }
  });
  $("#send-tst").click(() => {
    // check token input if given: set access token and continue, if not: alert
    var tk = document.getElementById("token").value;
    if (tk == null || tk == "") {
      alert("Give an access token");
    } else {
      spotifyApi.setAccessToken(tk);

      // get marked genres and put them inside array
      var genres = [];
      var markedCheckbox = document.getElementsByClassName("gnre");
      for (var checkbox of markedCheckbox) {
        if (checkbox.checked) {
          genres.push(checkbox.name);
        }
      }
      // check marked genres, if none marked: alert, else check number of songs selected and continue
      if (!genres.length) {
        alert("Select at least one genre");
      } else {
        var numSongs = document.getElementById("num").value;
        // getEmotion(numSongs);
        recm(numSongs, genres);
      }
    }
  });
};

function getEmotion() {
  $.ajax({
    url: "http://localhost:5000/emotion",
    type: "GET",
    contentType: "application/json",
  }).done(function (data) {
    var pred = Object.values(data);
    console.log(pred[0]);
    // recm(numSongs, pred);
    var emPred = document.getElementById("em-pred");
    emPred.innerHTML = pred;
  });
}

function recm(numSongs, genres) {
  var emotion = document.getElementById("em-pred").innerHTML;
  if (emotion == "Angry") {
    t_energy = 0.8;
    t_mode = 0;
    t_valence = 0.3;
    t_tempo = 100;
    // genres = ["garage", "heavy-metal", "metal", "punk", "punk-rock"];
  } else if (emotion == "Disgust") {
    t_energy = 0.8;
    t_mode = Math.round(Math.random());
    if (t_mode == 1) {
      t_valence = 0.65;
    } else {
      (t_valence = 0), 2;
    }
    t_tempo = 110;
    // genres = ["dance", "electronic", "pop", "r-n-b", "rock"];
  } else if (emotion == "Fear") {
    t_energy = 0.65;
    t_mode = 0;
    // target_speechiness = 0.05;
    // target_instrumentalness = 0.9;
    t_valence = 0.65;
    t_tempo = 120;
    // genres = ["alternative", "black-metal", "classical", "goth", "psych-rock"];
  } else if (emotion == "Happy") {
    // target_danceability = 0.6;
    t_energy = 0.8;
    t_mode = 1;
    t_valence = 1;
    t_tempo = 100;
    // genres = ["dance", "happy", "party", "pop", "rock"];
  } else if (emotion == "Neutral") {
    t_energy = 0.5;
    t_mode = Math.round(Math.random());
    t_valence = 0.5;
    t_tempo = Math.floor(Math.random() * (200 - 60 + 1) + 60);
    // genres = ["acoustic", "chill", "classical", "piano", "study"];
  } else if (emotion == "Sad") {
    t_energy = 0.25;
    t_mode = 0;
    // target_acousticness = 0.6;
    t_valence = 0.1;
    t_tempo = 70;
    // genres = ["emo", "piano", "pop", "rainy-day", "sad"];
  } else if (emotion == "Surprise") {
    t_energy = 0.85;
    t_mode = 1;
    t_valence = 0.65;
    t_tempo = 150;
    // genres = ["alternative", "indie", "rock"];
  }
  spotifyApi
    .getRecommendations({
      seed_genres: genres,
      limit: numSongs,
      target_energy: t_energy,
      target_mode: t_mode,
      target_valence: t_valence,
      target_tempo: t_tempo,
    })
    .then(
      function (data) {
        let tracks = data.body.tracks;

        let urls = [];
        let arts = [];
        let arts_name = [];
        let songs = [];
        tracks.forEach((l) => urls.push(l.external_urls.spotify));
        tracks.forEach((a) => arts.push(a.artists));
        arts.forEach((a) => arts_name.push(a[0].name));
        tracks.forEach((s) => songs.push(s.name));

        var target = document.getElementById("url");
        while (target.firstChild) {
          target.removeChild(target.lastChild);
        }
        for (var i = 0; i < Object.keys(urls).length; i++) {
          // var d = document.createElement("div");
          var p = document.createElement("p");
          var b = document.createElement("br");
          var a = document.createElement("a");
          // p.insertAdjacentText("beforeend", songs[i] + " by " + arts_name[i] + ":\n");
          p.innerHTML = songs[i] + " by " + arts_name[i] + ":\n";
          a.setAttribute("href", urls[i]);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          // a.insertAdjacentText("beforeend", urls[i]);
          a.innerHTML = urls[i];
          p.appendChild(b);
          p.appendChild(a);
          target.appendChild(p);
        }
      },
      function (err) {
        console.error(err);
      }
    );
}

module.exports = function (n) {
  return n * 111;
};
