var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
  clientId: "413809fc6a6a4d4aadff06f7a9176b94",
  clientSecret: "58ac47fad3784cf193becfd7b99bcc9a",
});


window.onload = () => {
  $("#sendbutton").click(() => {
    var tk = document.getElementById("token").value;
    if (tk == null || tk == "") {
      alert("Give an access token");
    } else {
      spotifyApi.setAccessToken(tk);
      var ima = document.getElementById('imagebox');
      if(ima.getAttribute('src') == "") {
        alert("Upload an image");
      } else {
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

              getEmotion(); // call backend and detect emotion from image
            },
          });
        }
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
    console.log(pred);
    
    recm(pred);
  });
}

function recm(emotion) {
  if (emotion == "Angry") {
    t_energy = 0.8;
    t_mode = 0;
    t_valence = 0.3;
    t_tempo = 100;
    genres = [
      'black-metal', 'death-metal', 'deep-house', 'dubstep', 'electronic',
      'emo', 'garage', 'goth', 'hard-rock', 'hard-core', 'heavy-metal',
      'metal', 'pop', 'psych-rock', 'punk', 'punk-rock', 'rock'
    ];
  } else if (emotion == "Disgust") {
    t_energy = 0.8;
    t_mode = Math.round(Math.random());
    if (t_mode == 1) {
      t_valence = 0.65;
    } else {
      (t_valence = 0), 2;
    }
    t_tempo = 110;
    genres = [
      'dance', 'electronic', 'psych-rock', 'r-n-b', 'rock', 'soul'
    ];
  } else if (emotion == "Fear") {
    t_energy = 0.65;
    t_mode = 0;
    // target_speechiness = 0.05;
    // target_instrumentalness = 0.9;
    t_valence = 0.65;
    t_tempo = 120;
    genres = [
      'alternative', 'black-metal', 'classical', 'death-metal',
      'goth', 'hip-hop', 'psych-rock', 'rock'
    ];
  } else if (emotion == "Happy") {
    // target_danceability = 0.6;
    t_energy = 0.8;
    t_mode = 1;
    t_valence = 1;
    t_tempo = 100;
    genres = [
      'bossanova', 'country', 'dance', 'disco', 'edm',
      'gospel', 'groove', 'happy', 'hip-hop', 'indie',
      'j-pop', 'k-pop', 'reggae', 'reggaeton', 'road-trip',
      'party', 'pop', 'rock', 'rock-n-roll', 'summer'
    ];
  } else if (emotion == "Neutral") {
    t_energy = 0.5;
    t_mode = Math.round(Math.random());
    t_valence = 0.5;
    t_tempo = Math.floor(Math.random() * (200 - 60 + 1) + 60);
    genres = [
      'acoustic', 'alternative', 'chill', 'classical',
      'indie', 'jazz', 'piano', 'study'
    ];
  } else if (emotion == "Sad") {
    t_energy = 0.25;
    t_mode = 0;
    // target_acousticness = 0.6;
    t_valence = 0.1;
    t_tempo = 70;
    genres = [
      'blues', 'emo', 'jazz', 'piano', 'pop', 'rainy-day', 'sad'
    ];
  } else if (emotion == "Surprise") {
    t_energy = 0.85;
    t_mode = 1;
    t_valence = 0.65;
    t_tempo = 150;
    genres = [
      'alternative', 'classical', 'electronic', 'indie', 'rock', 'pop'
    ];
  }

  selGenre = [];
  for (var i=0; i<5; i++){
    selGenre[i] = genres[Math.floor(Math.random() * genres.length)];
  }
  console.log(selGenre);
  
  spotifyApi
    .getRecommendations({
      seed_genres: selGenre,
      limit: 5,
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
          var p = document.createElement("p");
          var b = document.createElement("br");
          var a = document.createElement("a");
          p.innerHTML = songs[i] + " by " + arts_name[i] + ":\n";
          a.setAttribute("href", urls[i]);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          a.innerHTML = urls[i];
          p.appendChild(b);
          p.appendChild(a);
          target.appendChild(p);
        }

        $("body,html").animate({ scrollTop: $(document).height() }, 1200);

        window.open(urls[0]);
      },
      function (err) {
        console.error(err);
      }
    );
}

module.exports = function (n) {
  return n * 111;
};
