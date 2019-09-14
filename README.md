
# Pic-to-playlist

This repo is a starlette webapp used to make genre predictions and automatically generate playlists based on an image. It is intended to be used with images from [r/fakealbumcovers](https://www.reddit.com/r/fakealbumcovers). It is live on render.com [HERE](https://pic-to-playlist.onrender.com/)

I built this after completing the first part of the [fastai course](https://course.fast.ai/), as a little project to implement some of the stuff I had learnt as part of the course. The starting point for the code was taken from the fastai Render [example](https://github.com/render-examples/fastai-v3). 

## Models

The data to train the models was obtained by running an image of the [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_Server/Setup) server, and using some psql to get album art ids and user submitted genres. The album covers are then obtained with the ids and through the [Cover Art Archive](https://coverartarchive.org/) API. 

A ResNet50 convolution neural net is used to do image classification, which is then used as a seed genre for Spotify's [recommendation API](https://developer.spotify.com/documentation/web-api/reference/browse/get-recommendations/). Along with the genre prediction several other target parameters are passed to the API from another ResNet50 image regression model
