from flask import Flask, json, render_template, request, jsonify
import os
from dotenv import load_dotenv
import numpy as np
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


app = Flask(__name__)

load_dotenv()
app.secret_key = os.getenv('SECRET_KEY')

emDetected = "def"

# This funcition is called from the frontend function "getSongs".
# It returns a JSON response with the recommended songs with song name, artist
# name and url, also the emotion used for the recommendations.
@app.route('/emotion', methods=['GET', 'POST'])
def emotion():
    global emDetected
    emotion = emDetected
    out = spotifyRec()
    return jsonify({'response': out, 'emotion': emotion})


# This functions separates the JSON obtained from the Spotify's API into
# artist name, song name and song url.
# Function called inside "spotifyRec".
def get_recommended_songs(recm):
    tracks = recm.get('tracks')
    size = len(tracks)

    artists = []
    artist_names = []
    song_names = []
    links = []
    urls = []
    for i in range(size):
        artists.append(tracks[i].get('artists'))
        artist_names.append(artists[i][0].get('name'))
        song_names.append(tracks[i].get('name'))
        links.append(tracks[i].get('external_urls'))
        urls.append(links[i].get('spotify'))

    return artist_names, song_names, urls


# This function maps the emotion received from the fronted into music features
# used for the Spotify API "recommendations" which is called here.
# Returns a dictionary with separated artist, song and url.
# Function called inside "emotion".
def spotifyRec():
    global sp
    global emDetected
    emotion = emDetected

    if (emotion == "Angry" or emotion == "angry"):
        t_danceability = 0.3
        t_energy = 0.8
        t_mode = 0
        t_valence = 0.3
        t_tempo = 100
        genres = ["black-metal", "death-metal", "dubstep", "electronic", "emo", "garage", "goth",
                  "hard-rock", "hard-core", "heavy-metal", "metal", "pop", "psych-rock", "punk", "punk-rock"]
    elif (emotion == "Disgust" or emotion == "disgusted"):
        t_energy = 0.8
        t_mode = np.random.choice([0, 1])
        if (t_mode == 1):
            t_valence = 0.65
        else:
            t_valence = 0.2
        t_tempo = 110
        genres = ["dance", "electronic",
                  "psych-rock", "r-n-b", "rock",  "soul"]
    elif (emotion == "Fear" or emotion == "fearful"):
        t_energy = 0.65
        t_mode = 0
        t_speechiness = 0.05
        t_instrumentalness = 0.9
        t_valence = 0.65
        t_tempo = 120
        genres = ["alternative", "black-metal", "classical",
                  "death-metal", "goth", "hip-hop", "psych-rock", "rock"]
    elif (emotion == "Happy" or emotion == "happy"):
        t_danceability = 0.6
        t_energy = 0.8
        t_mode = 1
        t_valence = 1
        t_tempo = 100
        genres = ["bossanova", "country", "dance", "disco", "edm", "gospel", "groove", "happy", "hip-hop", "indie",
                  "j-pop", "k-pop", "reggae", "reggaeton", "road-trip", "party", "pop", "rock", "rock-n-roll", "summer"]
    elif (emotion == "Neutral" or emotion == "neutral"):
        t_energy = 0.5
        t_mode = np.random.choice([0, 1])
        t_valence = 0.5
        t_tempo = np.random.randint(60, 200, size=None)
        genres = ["acoustic", "alternative", "chill",
                  "classical", "indie", "jazz", "piano", "study"]
    elif (emotion == "Sad" or emotion == "sad"):
        t_energy = 0.25
        t_mode = 0
        t_acousticness = 0.6
        t_valence = 0.1
        t_tempo = 70
        genres = ["blues", "emo", "jazz", "piano", "pop", "rainy-day", "sad"]
    elif (emotion == "Surprise" or emotion == "surprised"):
        t_energy = 0.85
        t_mode = 1
        t_valence = 0.65
        t_tempo = 150
        genres = ["alternative", "classical",
                  "electronic", "indie", "rock", "pop"]

    selGenre = np.random.choice(genres, 5).tolist()

    if (emotion == "Angry" or emotion == "angry"):
        recm = sp.recommendations(seed_genres=selGenre,
                                  limit=5,
                                  target_danceability=t_danceability,
                                  target_energy=t_energy,
                                  target_mode=t_mode,
                                  target_tempo=t_tempo,
                                  target_valence=t_valence
                                  )
    elif (emotion == "Fear" or emotion == "fearful"):
        recm = sp.recommendations(seed_genres=selGenre,
                                  limit=5,
                                  target_energy=t_energy,
                                  target_mode=t_mode,
                                  target_spechiness=t_speechiness,
                                  target_instrumentalness=t_instrumentalness,
                                  target_tempo=t_tempo,
                                  target_valence=t_valence
                                  )
    elif (emotion == "Happy" or emotion == "happy"):
        recm = sp.recommendations(seed_genres=selGenre,
                                  limit=5,
                                  target_danceability=t_danceability,
                                  target_energy=t_energy,
                                  target_mode=t_mode,
                                  target_tempo=t_tempo,
                                  target_valence=t_valence
                                  )
    elif (emotion == "Sad" or emotion == "sad"):
        recm = sp.recommendations(seed_genres=selGenre,
                                  limit=5,
                                  target_energy=t_energy,
                                  target_mode=t_mode,
                                  target_acousticness=t_acousticness,
                                  target_tempo=t_tempo,
                                  target_valence=t_valence
                                  )
    else:
        recm = sp.recommendations(seed_genres=selGenre,
                                  limit=5,
                                  target_energy=t_energy,
                                  target_mode=t_mode,
                                  target_tempo=t_tempo,
                                  target_valence=t_valence
                                  )

    a, s, u = get_recommended_songs(recm)
    out_dict = {"artist": a, "song": s, "url": u}
    return out_dict


resp = 0
sp = ''

# Function used to load Spotify APIs with client id, client secret and
# obtaining an access token in order to use all the APIs given by Spotify.
# Function called in the frontend by the function "spotLo".
@app.route('/spotLo', methods=['GET', 'POST'])
def spotLo():
    print("spotify loading")
    global sp
    global resp
    cid = '413809fc6a6a4d4aadff06f7a9176b94'
    secret = '58ac47fad3784cf193becfd7b99bcc9a'
    client_credentials_manager = SpotifyClientCredentials(
        client_id=cid, client_secret=secret)
    sp = spotipy.Spotify(
        client_credentials_manager=client_credentials_manager, requests_timeout=200)
    resp = 1
    return jsonify({'response': resp})


# Function called at the beginning of the program which calls the HTML file.
@app.route('/')
def home():
    return render_template('inside.html')


# This function updates the global variable "emDetected" which is used
# throughout the code.
# This funcition is called from the frontend function "sendEmotion".
@app.route('/detections', methods=['GET', 'POST'])
def handle_face_em():
    global emDetected 
    emDetected = request.get_json()
    print(emDetected)
    return jsonify({'success': 'success'})


# This function allows CORS server communications. 
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


if __name__ == '__main__':
    app.run()
