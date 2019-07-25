from starlette.applications import Starlette
from starlette.responses import HTMLResponse, JSONResponse
from starlette.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import uvicorn, aiohttp, asyncio
from io import BytesIO
import os
import shutil
import sys
import spotipy
import numpy as np
import pandas as pd
from spotipy import oauth2
from fastai.basic_train import load_learner
from fastai.vision import open_image
from pathlib import Path
import pickle


# set up spotify
scope = 'playlist-modify-public'
user = 'mi676a246w6f8faqp86vemr64' 
client_id = os.getenv('SPOTIPY_CLIENT_ID') # replace with your client id from Spotify Dev / or can set in environment
client_secret = os.getenv('SPOTIPY_CLIENT_SECRET')  # replace with your client secret from Spotify Dev / Or can set in environment
redirect_uri = 'https://www.google.com/'
# shutil.copy('/etc/secrets/cache-mi676a246w6f8faqp86vemr64', os.getcwd())
cache_path = '.cache-mi676a246w6f8faqp86vemr64'



sp_oauth = oauth2.SpotifyOAuth(client_id=client_id, client_secret=client_secret,
redirect_uri=redirect_uri, scope=scope, cache_path=cache_path)
token_info = sp_oauth.get_cached_token()
token = token_info['access_token']


# export_file_url = 'https://www.dropbox.com/s/v6cuuvddq73d1e0/export.pkl?raw=1'
classification_url = 'https://www.dropbox.com/s/ue1dacfhh28xavk/single_label_reduced.pkl?raw=1'
classification_name = 'classification_model.pkl'


regression_url = 'https://www.dropbox.com/s/i0kh0skf06h4t6i/regression-reduced_output.pkl?raw=1'
regression_name = 'regression_model.pkl'

path = Path(__file__).parent

# load some genre and regression range values
with open(path/'lookups/max_reg_vals.pkl', 'rb') as f:
    max_vals = pickle.load(f)
    max_vals = pd.Series(max_vals)
with open(path/'lookups/genre_lookup.pkl', 'rb') as f:
    genres = pickle.load(f)

async def get_bytes(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.read()



app = Starlette()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_headers=['X-Requested-With', 'Content-Type'])
app.mount('/static', StaticFiles(directory='app/static'))


async def download_file(url, dest):
    if dest.exists(): return
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.read()
            with open(dest, 'wb') as f: f.write(data)

async def setup_learner(url, dest):
    await download_file(url, path/dest)
    try:
        learn = load_learner(path, dest)
        return learn
    except RuntimeError as e:
        if len(e.args) > 0 and 'CPU-only machine' in e.args[0]:
            print(e)
            message = "\n\nThis model was trained with an old version of fastai and will not work in a CPU environment.\n\nPlease update the fastai library in your training environment and export your model again.\n\nSee instructions for 'Returning to work' at https://course.fast.ai."
            raise RuntimeError(message)
        else:
            raise
            

reg_cols = ['danceability', 'energy', 'loudness', 
            'speechiness', 'acousticness', 'instrumentalness',
           'liveness', 'valence', 'tempo']
    
def img_predict(img):
    class_preds = class_model.predict(img)
    top_3 = np.array(class_model.data.classes)[class_preds[2].argsort()][-3:]
    probs = class_preds[2][class_preds[2].argsort()[-3:]]
    reg_preds = reg_model.predict(img)
    reg_preds = reg_preds[1]
    
    target_vals = {}
    for i in range(len(reg_preds)):
        target_attribute = reg_cols[i]
        target_max = max_vals[target_attribute]
        val = (reg_preds[i].item() / 100) * target_max
        val = val if val < target_max else target_max
        val = val if val > 0 else 0
        if target_attribute == 'loudness':
            val = -val
        target_vals.update({f'target_{target_attribute}':val}) 
        
    response_dict = {'genre_1': f'{top_3[-1]} ({probs[-1]:.2f})',
    'genre_2': f'{top_3[-2]} ({probs[-2]:.2f})',
    'genre_3': f'{top_3[-3]} ({probs[-3]:.2f})'}
    response_dict.update(target_vals)
    print(response_dict)

    return JSONResponse(response_dict)
    
loop = asyncio.get_event_loop()
tasks = [asyncio.ensure_future(setup_learner(classification_url, classification_name)), 
asyncio.ensure_future(setup_learner(regression_url, regression_name))]
class_model, reg_model = loop.run_until_complete(asyncio.gather(*tasks))
loop.close()

@app.route('/')
def index(request):
    html = path/'view'/'index.html'
    return HTMLResponse(html.open().read())

@app.route('/analyze', methods=['POST'])
async def analyze(request):
    data = await request.form()
    img_bytes = await (data['file'].read())
    img = open_image(BytesIO(img_bytes))
    
    return img_predict(img)
        
@app.route('/classify-url', methods=['GET'])
async def classify_url(request):

    img_bytes = await get_bytes(request.query_params['url'])
    img = open_image(BytesIO(img_bytes))
    return img_predict(img)
    
@app.route('/create-playlist', methods=['POST'])
async def create_playlist(request):
    
    target_params = {}
    data = await request.form()
    if data['danceability-on'] == "true":
        target_params.update({'target_danceability': float(data['danceability'])})
    if data['energy-on'] == "true":
        target_params.update({'target_energy': float(data['energy'])})
    if data['loudness-on'] == "true":
        target_params.update({'target_loudness': float(data['loudness'])})
    if data['speechiness-on'] == "true":
        target_params.update({'target_speechiness': float(data['speechiness'])})
    if data['acousticness-on'] == "true":
        target_params.update({'target_acousticness': float(data['acousticness'])})
    if data['instrumentalness-on'] == "true":
        target_params.update({'target_instrumentalness': float(data['instrumentalness'])})
    if data['liveness-on'] == "true":
        target_params.update({'target_liveness': float(data['liveness'])})
    if data['valence-on'] == "true":
        target_params.update({'target_valence': float(data['valence'])})
    if data['tempo-on'] == "true":
        target_params.update({'target_tempo': float(data['tempo'])})
    if data['popularity-on'] == "true":
        target_params.update({'max_popularity': int(data['popularity'])})
    gens = data['genres'].split(',')
    print(target_params)
    
    seed_genres = []
    for gen in gens:
        seed_genres.extend(genres.get(gen))
    
    sp_oauth = oauth2.SpotifyOAuth(client_id=client_id, client_secret=client_secret,
    redirect_uri=redirect_uri, scope=scope, cache_path=cache_path)
    token_info = sp_oauth.get_cached_token()
    token = token_info['access_token']
    
    sp = spotipy.Spotify(token)
    
    recommendations = sp.recommendations(seed_genres=seed_genres, limit=4, **target_params)
    
    track_uri = [recommendations['tracks'][i]['uri'] for i in range(0, len(recommendations['tracks']))]
    playlist = sp.user_playlist_create(user=user, name='fakealbum')
    sp.user_playlist_add_tracks(user=user, playlist_id=playlist['id'],
                                tracks=track_uri)
                                
    return JSONResponse({"playlist":"https://open.spotify.com/embed/user/mi676a246w6f8faqp86vemr64/playlist/{}".format(playlist['id'])})
   
if __name__ == '__main__':
    if 'serve' in sys.argv: uvicorn.run(app=app, host='0.0.0.0', port=5042)