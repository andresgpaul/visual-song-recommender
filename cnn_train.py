import pandas as pd
import numpy as np

from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.layers import Dense, Conv2D, Flatten, Dropout, MaxPooling2D, Activation
from tensorflow.keras.losses import categorical_crossentropy

from keras.models import Sequential

from keras.utils.np_utils import to_categorical


X_train, train_y, X_test, test_y = [],[],[],[]
df = pd.read_csv('/content/gdrive/MyDrive/ProjectCourse/fer2013.csv')

for index, row in df.iterrows():
  val = row['pixels'].split(" ")
  try:
    if 'Training' in row['Usage']:
      X_train.append(np.array(val, 'float32'))
      train_y.append(row['emotion'])
    elif 'PublicTest' in row['Usage']:
      X_test.append(np.array(val, 'float32'))
      test_y.append(row['emotion'])
  except:
    print(f"error occured at index :{index} and row: {row}")


num_features = 64
num_labels = 7
batch_size = 64
epochs = 60
width, height = 48, 48


X_train = np.array(X_train, 'float32')
train_y = np.array(train_y, 'float32')
X_test = np.array(X_test, 'float32')
test_y = np.array(test_y, 'float32')


train_y = to_categorical(train_y, num_classes=num_labels)
test_y = to_categorical(test_y, num_classes=num_labels)


# Normalizing data between 0 and 1
X_train -= np.mean(X_train, axis=0)
X_train /= np.std(X_train, axis=0)


X_test -= np.mean(X_test, axis=0)
X_test /= np.std(X_test, axis=0)


X_train = X_train.reshape(X_train.shape[0], 48, 48, 1)

X_test = X_test.reshape(X_test.shape[0], 48, 48, 1)


model = Sequential()
model.add(Conv2D(64, kernel_size=(3,3), activation='relu', input_shape=(X_train.shape[1:])))
model.add(Conv2D(64, kernel_size=(3,3), activation='relu'))
#model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2), strides=(2,2)))
model.add(Dropout(0.5))

# 2nd convolution layer
model.add(Conv2D(64, (3,3), activation='relu'))
model.add(Conv2D(64, (3,3), activation='relu'))
#model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2), strides=(2,2)))
model.add(Dropout(0.5))

# 3rd convolution layer
model.add(Conv2D(128, (3,3), activation='relu'))
model.add(Conv2D(128, (3,3), activation='relu'))
#model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2), strides=(2,2)))

model.add(Flatten())

# Fully connected NN
model.add(Dense(1024, activation='relu'))
model.add(Dropout(0.2))
model.add(Dense(1024, activation='relu'))
model.add(Dropout(0.2))

model.add(Dense(num_labels, activation='softmax'))


# Compiling the model
model.compile(loss=categorical_crossentropy,
              optimizer='sgd',
              metrics=['accuracy'])


# Training the model
model.fit(X_train, train_y,
          batch_size=batch_size,
          epochs=epochs,
          verbose=1,
          validation_data=(X_test, test_y),
          shuffle=True)


model.summary()


#fer_json2 = model.to_json()
#with open("fer2.json", "w") as json_file:
#  json_file.write(fer_json2)
model.save("/content/gdrive/MyDrive/ProjectCourse/fer2.h5")
model.save_weights("/content/gdrive/MyDrive/ProjectCourse/fer_weights2.h5")
