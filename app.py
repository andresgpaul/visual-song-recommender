from flask import Flask, json, render_template, request, jsonify
import os
import sys
import numpy as np
import cv2
import keras
from keras.models import model_from_json
from keras.preprocessing import image
from keras.preprocessing.image import img_to_array


app = Flask(__name__)

app.secret_key = 'R4roMax1FutSk8Ba'


@app.route('/emotion', methods=['GET', 'POST'])
def emotion():
    emotion = detectEmotion()
    return jsonify({'emotion': emotion})


def detectEmotion():
    img = cv2.imread('static/images/test1.jpeg', 0)
    gray = cv2.imread('static/images/test2.jpeg', 0) 

    new_yt_model = keras.models.load_model('fer.h5')
    new_yt_model.load_weights("fer_weights.h5")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    faces = face_cascade.detectMultiScale(gray, 1.1, 1)
    for (x,y,w,h) in faces:
        cv2.rectangle(img, (x,y), (x+w,y+h), (255,0,0))
        roi_gray = gray[y:y+w,x:x+h]
        roi_gray = cv2.resize(roi_gray, (48,48))
        image_pixels = img_to_array(roi_gray)
        image_pixels = np.expand_dims(image_pixels, axis=0)
        image_pixels /= 255
        predictions = new_yt_model.predict(image_pixels)
        max_index = np.argmax(predictions[0])
        emotion_detection = ('Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral')
        emotion_prediction = emotion_detection[max_index]
        
    return emotion_prediction


@app.route('/test', methods=['GET', 'POST'])
def test():
    file = request.files['image'].read()  # image in byte file
    npimg = np.fromstring(file, np.uint8) # image in np.array type
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR) # image in np.array type but decoded
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) # image in grayscale

    path = 'static/images'
    cv2.imwrite(os.path.join(path , 'test1.jpeg'), img)
    cv2.imwrite(os.path.join(path , 'test2.jpeg'), gray)

    new_yt_model = keras.models.load_model('fer.h5')
    new_yt_model.load_weights("fer_weights.h5")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    emotion = detectEmotion()

    return jsonify('emotion', emotion)


@app.route('/')
def home():
    return render_template('inside.html')


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


if __name__ == '__main__':
    app.run()
