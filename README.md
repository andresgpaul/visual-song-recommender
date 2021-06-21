# Automatic song selection through facial emotion recognition
The relationship between sound and images have been explored since the advent of movies, and even earlier. This project is able to automatically select a song given an image through facial emotion recognition. Given a previously unseen image and given the sentiment label assigned by the network, the software will select a proper song through the Spotify API by mean of a mapping between sentiments and song descriptions provided by Spotify streaming service.

## Requirements
- Python 3
- Face-api (includes tensorflow)
- Spotipy
- Flask (for the web app)
- Numpy

## Code Structure
The repository is structured as follows.

1. The root directory contains:
    - main.py:
    
        File where the backend processes are done such as loading the CNN model, processing the image uploaded and predict the emotion recognition, map the emotion to music features and communicate with Spotify's APIs to obtain songs.
    
    - Procfile:

        This file contains a dyno for heroku deployment.
    
    - requirements.txt and runtime.txt:
        
        These files contain information of libraries and python versions used in the porject in order to deploy. It tells heroku what dependencies are needed to run the program.

2. 'static' folder contains:
    - face-api.min.js:

        Faceapi library used to detect emotions in human faces, this library contains many different models used for facial detection and emotion recognition. This library was used for its real time availability and works in frontend making the whole communication faster.
    - rt_face.js:

        Inside this file is the main frontend process where video streaming is done to detect facial emotions and communication with the backend. Here are all the functions done in the frontend such as buttons and backend communication. 
    - index.js:

        Another file doing frontend process of showing the uploaded image and other functions when an upload is done.
    - 'styles' folder:
        - main.css:

            CSS file to give format to the content.
    - 'models' folder:

        The models used for the faceapi library in order to detect facial emotions. These models are loaded in rt_face.js.
3. 'templates' folder:
    - inside.html:

        HTML file with all the content needed for the web app.

The structure and files of the folders 'static', 'models', 'styles' and 'templates' was done in that way due to how Flask looks for JS, HTML and CSS files.
