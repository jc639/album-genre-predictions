from starlette.applications import Starlette
from starlette.responses import HTMLResponse, JSONResponse
from starlette.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import uvicorn, aiohttp, asyncio
from io import BytesIO
import os
import spotipy
from spotipy import util
from fastai import *
from fastai.vision import *

# set up spotify
scope = 'playlist-modify-public'
user = 'mi676a246w6f8faqp86vemr64' 
client_id = os.getenv('SPOTIPY_CLIENT_ID') # replace with your client id from Spotify Dev / or can set in environment
client_secret = os.getenv('SPOTIPY_CLIENT_SECRET')  # replace with your client secret from Spotify Dev / Or can set in environment
redirect_uri='https://www.google.com/'

token = util.prompt_for_user_token(user, scope=scope, client_id = client_id,
client_secret = client_secret, redirect_uri = redirect_uri)

# export_file_url = 'https://www.dropbox.com/s/v6cuuvddq73d1e0/export.pkl?raw=1'
classification_url = 'https://www.dropbox.com/s/6bgq8t6yextloqp/export.pkl?raw=1'
classification_name = 'classification_model.pkl'

regression_url = ''
regression_name = 'regression_model.pkl'

classes = ['black', 'grizzly', 'teddys']
path = Path(__file__).parent

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
        learn = load_learner(path, export_file_name)
        return learn
    except RuntimeError as e:
        if len(e.args) > 0 and 'CPU-only machine' in e.args[0]:
            print(e)
            message = "\n\nThis model was trained with an old version of fastai and will not work in a CPU environment.\n\nPlease update the fastai library in your training environment and export your model again.\n\nSee instructions for 'Returning to work' at https://course.fast.ai."
            raise RuntimeError(message)
        else:
            raise
# danceability 	energy 	key 	loudness 	mode 	speechiness 	acousticness 	instrumentalness 	liveness 	valence 	tempo 	duration_ms 	time_signature
            
def create_playlist(seed_genres=[], target_values={}):
    token = util.prompt_for_user_token(user, scope=scope, client_id = client_id,
            client_secret = client_secret, redirect_uri = redirect_uri)
    
    sp = spotipy.Spotify(token)
    
    recommendations = sp.recommendations(seed_genres=seed_genres, limit=5, 
    **target_values)
    
    track_uri = [recommendations['tracks'][i]['uri'] for i in range(0, len(recommendations['tracks']))]
    playlist = sp.user_playlist_create(user=user, name='fakealbum')
    sp.user_playlist_add_tracks(user=user, playlist_id=playlist['id'],
                                tracks=track_uri)
                                
    return "https://open.spotify.com/embed/user/mi676a246w6f8faqp86vemr64/playlist/{}".format(playlist['id'])
    

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
    if data['type'] == 'file':
        img_bytes = await (data['file'].read())
    if data['type'] == 'url':
        img_bytes = get_bytes(data['file'])
    img = open_image(BytesIO(img_bytes))
    class_preds = class_model.predict(img)
    reg_preds = reg_model.predict(img)
    return JSONResponse({'': str(prediction)})

if __name__ == '__main__':
    if 'serve' in sys.argv: uvicorn.run(app=app, host='0.0.0.0', port=5042)