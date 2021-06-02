var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
  clientId: "413809fc6a6a4d4aadff06f7a9176b94",
  clientSecret: "58ac47fad3784cf193becfd7b99bcc9a",
});

spotifyApi.setAccessToken(
  "BQCgqbG-LR7__e_tfEpWLvkJXk1Lcollkn1xKhHhnNMGymEHp7wB2llLKLHqtj6BjmfOBsV4wOY7jHlt0V6Y9EsB3rcfJP6TOT_6bfzlGF425icnpU4urbsLq4U9gkm1zo8TN4Ghgzu4pMsJObOU"
);

window.onload = () => {
  $("#sendbutton").click(() => {
    console.log("you cliked the send button");
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
            console.log("Image uploaded successfully!");
          // alert("hello"); // if it's failing on actual server check your server FIREWALL + SET UP CORS
        //   bytestring = data["status"];
        //   image = bytestring.split("'")[1];
        //   imagebox.attr("ng-src", "data:image/jpeg;base64," + image);
        },
      });
    }
  });
  $("#send-tst").click(() => {
    getEmotion();
  });
};

function getEmotion() {
  $.ajax({
    url: "http://localhost:5000/emotion",
    type: "GET",
    contentType: "application/json",
  }).done(function (data) {
    var vals = Object.values(data);
    console.log(vals[0]);
    recm(vals);
  });
}

function recm(emotion) {
    if (emotion == 'Angry') {
        console.log('agh');
        t_energy = 0.8;
        t_mode = 0;
        t_valence = 0.3;
        t_tempo = 100;
        genres = ['garage', 'heavy-metal', 'metal', 'punk', 'punk-rock'];
    } else if (emotion == 'Disgust') {
        console.log('eww');
        t_energy = 0.8;
        t_mode = Math.round(Math.random());
        if (t_mode == 1) {
            t_valence = 0.65;
        } else {
            t_valence = 0,2;
        }
        t_tempo = 110;
        genres = ['dance', 'electronic', 'pop', 'r-n-b', 'rock'];
    } else if (emotion == 'Fear') {
        console.log('ahh');
        t_energy = 0.65;
        t_mode = 0;
        // target_speechiness = 0.05;
        // target_instrumentalness = 0.9;
        t_valence = 0.65;
        t_tempo = 120;
        genres = ['alternative', 'black-metal', 'classical', 'goth', 'psych-rock'];
    } else if (emotion == 'Happy') {
        console.log('yay');
        // target_danceability = 0.6;
        t_energy = 0.8;
        t_mode = 1;
        t_valence = 1;
        t_tempo = 100;
        genres = ['dance', 'happy', 'party', 'pop', 'rock'];
    } else if (emotion == 'Neutral') {
        console.log('ok');
        t_energy = 0.5;
        t_mode = Math.round(Math.random());
        t_valence = 0.5;
        t_tempo = Math.floor(Math.random() * (200 - 60 + 1) + 60);
        genres = ['acoustic', 'chill', 'classical', 'piano', 'study'];
    } else if (emotion == 'Sad') {
        console.log(':(');
        t_energy = 0.25;
        t_mode = 0;
        // target_acousticness = 0.6;
        t_valence = 0.1;
        t_tempo = 70;
        genres = ['emo', 'piano', 'pop', 'rainy-day', 'sad'];
    } else if (emotion == 'Surprise') {
        console.log('wow');
        t_energy = 0.85;
        t_mode = 1;
        t_valence = 0.65;
        t_tempo = 150;
        genres = ['alternative', 'indie', 'rock'];
    }
  spotifyApi
    .getRecommendations({
      seed_genres: genres,
      limit: 2,
      target_energy: t_energy,
      target_mode: t_mode,
      target_valence: t_valence,
      target_tempo: t_tempo,
    })
    .then(
      function (data) {
        let tracks = data.body.tracks;

        // console.log("Recommended songs", tracks);

        let urls = [];
        let arts = [];
        let arts_name = [];
        let songs = [];
        tracks.forEach((l) => urls.push(l.external_urls.spotify));
        tracks.forEach((a) => arts.push(a.artists));
        arts.forEach((a) => arts_name.push(a[0].name));
        tracks.forEach((s) => songs.push(s.name));
        // console.log("urls", urls);
        // console.log("artists", arts);
        console.log("artists name", arts_name);
        console.log("songs", songs);

        var target = document.getElementById("url");
        urls.forEach(function (u) {
          var p = document.createElement("p");
          var a = document.createElement("a");
          a.setAttribute("href", u);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          a.insertAdjacentText("beforeend", u);
          p.appendChild(a);
          target.appendChild(p);
        });
        //   songs.forEach(function (s) {
        //     var p = document.createElement("p");
        //     var a = document.createElement("a");
        //     arts_name.forEach(function (an) {
        //       p.insertAdjacentText("beforeend", s + " by " + an + ":\n");
        //       urls.forEach(function (u) {
        //         a.setAttribute("href", u);
        //         a.setAttribute("target", "_blank");
        //         a.setAttribute("rel", "noopener noreferrer");
        //         a.insertAdjacentText("beforeend", u);
        //       });
        //       p.appendChild(a);
        //     });
        //     target.appendChild(p);
        //   });
      },
      function (err) {
        console.error(err);
      }
    );
}

module.exports = function (n) {
  return n * 111;
};
