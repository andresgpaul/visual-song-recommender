from flask import Flask, json, render_template, request, jsonify
###
from flask_socketio import SocketIO, emit

import os
# import sys
import numpy as np
import cv2
import keras
from keras.models import model_from_json
from keras.preprocessing import image
from keras.preprocessing.image import img_to_array
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


app = Flask(__name__)

###
socketio = SocketIO(app, cors_allowed_origins='*')

app.secret_key = 'R4roMax1FutSk8Ba'

emDetected = "def"

@app.route('/emotion', methods=['GET', 'POST'])
def emotion():
    global emDetected
    # emotion = detectEmotion()
    emotion = emDetected
    out = spotifyRec()
    return jsonify({'response': out, 'emotion': emotion})

# def detectEmotion(img, gray):
#     # img = cv2.imread('static/images/test1.jpeg', 0)
#     # gray = cv2.imread('static/images/test2.jpeg', 0)

#     new_yt_model = keras.models.load_model('fer.h5')
#     new_yt_model.load_weights("fer_weights.h5")
#     face_cascade = cv2.CascadeClassifier(
#         cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

#     faces = face_cascade.detectMultiScale(gray, 1.1, 1)
#     for (x, y, w, h) in faces:
#         cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0))
#         roi_gray = gray[y:y+w, x:x+h]
#         roi_gray = cv2.resize(roi_gray, (48, 48))
#         image_pixels = img_to_array(roi_gray)
#         image_pixels = np.expand_dims(image_pixels, axis=0)
#         image_pixels /= 255
#         predictions = new_yt_model.predict(image_pixels)
#         max_index = np.argmax(predictions[0])
#         emotion_detection = ('Angry', 'Disgust', 'Fear',
#                              'Happy', 'Sad', 'Surprise', 'Neutral')
#         emotion_prediction = emotion_detection[max_index]

#     global emDetected
#     emDetected = emotion_prediction
#     return emotion_prediction


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
        # print(artist_names[i], '-', song_names[i] + ':', urls[i])

    return artist_names, song_names, urls


def spotifyRec():
    cid = '413809fc6a6a4d4aadff06f7a9176b94'
    secret = '58ac47fad3784cf193becfd7b99bcc9a'
    client_credentials_manager = SpotifyClientCredentials(
        client_id=cid, client_secret=secret)
    sp = spotipy.Spotify(
        client_credentials_manager=client_credentials_manager, requests_timeout=120)

    # emotion = detectEmotion()
    global emDetected
    emotion = emDetected
    # print(emotion)


    if (emotion == "Angry" or emotion == "angry"):
        t_danceability = 0.3
        t_energy = 0.8
        t_mode = 0
        t_valence = 0.3
        t_tempo = 100
        genres = ["black-metal", "death-metal", "dubstep", "electronic", "emo", "garage", "goth",
                  "hard-rock", "hard-core", "heavy-metal", "metal", "pop", "psych-rock", "punk", "punk-rock"]
    elif (emotion == "Disgust" or emotion == "disgust"):
        t_energy = 0.8
        t_mode = np.random.choice([0, 1])
        if (t_mode == 1):
            t_valence = 0.65
        else:
            t_valence = 0.2
        t_tempo = 110
        genres = ["dance", "electronic",
                  "psych-rock", "r-n-b", "rock",  "soul"]
    elif (emotion == "Fear" or emotion == "fear"):
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
    elif (emotion == "Surprise" or emotion == "surprise"):
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
    elif (emotion == "Fear" or emotion == "fear"):
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


# @app.route('/test', methods=['GET', 'POST'])
# def test():
#     file = request.files['image'].read()  # image in byte file
#     npimg = np.fromstring(file, np.uint8)  # image in np.array type
#     # image in np.array type but decoded
#     img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # image in grayscale

#     # path = 'static/images'
#     # cv2.imwrite(os.path.join(path, 'test1.jpeg'), img)
#     # cv2.imwrite(os.path.join(path, 'test2.jpeg'), gray)

#     new_yt_model = keras.models.load_model('fer.h5')
#     new_yt_model.load_weights("fer_weights.h5")
#     face_cascade = cv2.CascadeClassifier(
#         cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

#     emotion = detectEmotion(img, gray)

#     global emDetected
#     emDetected = emotion

#     return jsonify('emotion', emotion)


@app.route('/')
def home():
    return render_template('inside.html')

###
@socketio.on('connect')
def test_connect():
    print("SOCKET CONNECTED")


@socketio.on('detections')
def handle_face_em(json, methods=['GET', 'POST']):
    global emDetected 
    emDetected = json['data']


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


if __name__ == '__main__':
    # app.run()
    socketio.run(app)
