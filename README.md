# Automatic song selection through facial emotion recognition
The relationship between sound and images have been explored since the advent of movies, and even earlier. The project work aims to create a software able to automatically select a song given an image through facial emotion recognition. A Neural Network is trained in order to perform sentiment analysis on images. Given a previously unseen image and given the sentiment label assigned by the network, the software will select a proper song through the Spotify API by mean of a mapping between sentiments and song descriptions provided by Spotify streaming service.

## Requirements
- Python 3
- Tensorflow > 2.4
    -   Keras > 2.4
- OpenCV (cv2)
- Spotipy
- Flask (for the web app)
- Numpy
- Pandas (for the CNN)

## Code Structure
The repository is structured as follows.

1. The root directory contains:
    - main.py:
    
        File where the backend processes are done such as loading the CNN model, processing the image uploaded and predict the emotion recognition, map the emotion to music features and communicate with Spotify's APIs to obtain songs.
    - fer.h5 and fer_weights.h5:

        CNN model and weights used to load the model and use for prediction.
    - haarcascade_frontalface_default.xml:
    
        File used to detect faces in images.
2. 'static' folder contains:
    - client.js:

        File where the main frontend processes are done such as communicating with the backend, specifically when a button is pressed and obtaining responses to update the page with the retrieved information.
    - index.js:

        Another file doing frontend process of showing the uploaded image and other functions when an upload is done.
    - 'styles' folder:
        - main.css:

            CSS file to give format to the content.
3. 'templates' folder:
    - inside.html:

        HTML file with all the content needed for the web app.
4. 'cnn' folder:
    - cnn_train.py:

        This file is only needed once in order to train the CNN model and save it once it's trained.
    - fer2013.csv:

        Dataset used to train the CNN.

The structure and files of the folders 'static', 'styles' and 'templates' was done in that way due to how Flask looks for JS, HTML and CSS files.
