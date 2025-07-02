from fastapi import FastAPI, Request,HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
import os
import time
import hashlib
import hmac
import base64
import json
import ssl
from urllib.parse import urlencode
import websockets
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import ffmpeg

# 讯飞开放平台参数
APPID = "b0410a06"
APISecret = "ZGU3MzRmNTUwMzA5MDkyOGUzOThkZTZm"
APIKey = "c7c63f2ec129e7d4a884cdc5d0824668"
HOST = "tts-api.xfyun.cn"
URL = "wss://tts-api.xfyun.cn/v2/tts"


AUDIO_DIR = "audio_files"
os.makedirs(AUDIO_DIR, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或指定你的前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_xfyun_ws_url():
    now = datetime.utcnow()
    date = now.strftime('%a, %d %b %Y %H:%M:%S GMT')
    signature_origin = f"host: {HOST}\ndate: {date}\nGET /v2/tts HTTP/1.1"
    signature_sha = hmac.new(APISecret.encode('utf-8'), signature_origin.encode('utf-8'), hashlib.sha256).digest()
    signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
    authorization_origin = f'api_key="{APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
    params = {
        "authorization": authorization,
        "date": date,
        "host": HOST
    }
    ws_url = URL + '?' + urlencode(params)
    return ws_url

def get_xfyun_asr_ws_url():
    now = datetime.utcnow()
    date = now.strftime('%a, %d %b %Y %H:%M:%S GMT')
    signature_origin = f"host: {ASR_HOST}\ndate: {date}\nGET /v2/iat HTTP/1.1"
    signature_sha = hmac.new(ASR_APISecret.encode('utf-8'), signature_origin.encode('utf-8'), hashlib.sha256).digest()
    signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
    authorization_origin = f'api_key="{ASR_APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
    params = {
        "authorization": authorization,
        "date": date,
        "host": ASR_HOST
    }
    ws_url = ASR_URL + '?' + urlencode(params)
    return ws_url

def convert_to_pcm(input_path, output_path):
    # 转为16k单声道pcm
    ffmpeg.input(input_path).output(
        output_path, format='s16le', acodec='pcm_s16le', ac=1, ar='16000'
    ).overwrite_output().run(quiet=True)

async def tts_xfyun_ws(text, filename=None):
    ws_url = get_xfyun_ws_url()
    param = {
        "common": {"app_id": APPID},
        "business": {
            "aue": "lame",
            "voice_name": "x4_xiaoyan",
            "speed": 50,
            "volume": 50,
            "pitch": 50,
            "engine_type": "intp65",
            "text_type": "text"
        },
        "data": {
            "text": base64.b64encode(text.encode('utf-8')).decode('utf-8'),
            "status": 2
        }
    }
    if not filename:
        filename = f"tts_{int(time.time())}.mp3"
    file_path = os.path.join(AUDIO_DIR, filename)
    ssl_context = ssl.create_default_context()
    try:
        async with websockets.connect(ws_url, ssl=ssl_context) as ws:
            await ws.send(json.dumps(param))
            with open(file_path, 'wb') as f:
                while True:
                    msg = await ws.recv()
                    msg = json.loads(msg)
                    if msg.get('code', 0) != 0:
                        return None, msg.get('message', 'TTS failed')
                    audio = msg['data'].get('audio')
                    if audio:
                        f.write(base64.b64decode(audio))
                    if msg['data'].get('status') == 2:
                        break
        return file_path, None
    except Exception as e:
        return None, str(e)

async def asr_xfyun_ws(pcm_path):
    ws_url = get_xfyun_asr_ws_url()
    param = {
        "common": {"app_id": ASR_APPID},
        "business": {
            "language": "zh_cn",
            "domain": "iat",
            "accent": "mandarin",
            "vad_eos": 1000
        },
        "data": {
            "status": 0,
            "format": "audio/L16;rate=16000",
            "encoding": "raw"
        }
    }
    ssl_context = ssl.create_default_context()
    try:
        async with websockets.connect(ws_url, ssl=ssl_context) as ws:
            await ws.send(json.dumps(param))
            with open(pcm_path, "rb") as f:
                audio = f.read()
                await ws.send(audio)
            await ws.send(json.dumps({"data": {"status": 2}}))
            result = ""
            while True:
                msg = await ws.recv()
                msg = json.loads(msg)
                if msg.get('code', 0) != 0:
                    return None, msg.get('message', 'ASR failed')
                if 'data' in msg and 'result' in msg['data']:
                    ws_result = msg['data']['result']['ws']
                    for w in ws_result:
                        for cw in w['cw']:
                            result += cw['w']
                if msg['data'].get('status') == 2:
                    break
        return result, None
    except Exception as e:
        return None, str(e)

@app.post("/tts")
async def tts_api(request: Request):
    data = await request.json()
    text = data.get("text", "")
    if not text:
        return JSONResponse({"error": "text is required"}, status_code=400)
    filename = f"tts_{int(time.time())}.mp3"
    file_path, err = await tts_xfyun_ws(text, filename)
    if file_path:
        audio_url = f"/audio/{filename}"
        return {"audio_url": audio_url, "text": text}
    else:
        return JSONResponse({"error": err or "TTS failed"}, status_code=500)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(file_path):
        return JSONResponse({"error": "File not found"}, status_code=404) 
    return FileResponse(file_path, media_type="audio/mpeg")

@app.post("/asr")
async def asr_api(file: UploadFile = File(...)):
    try:
        ext = file.filename.split('.')[-1]
        raw_path = os.path.join(AUDIO_DIR, f"asr_{int(time.time())}.{ext}")
        with open(raw_path, "wb") as f:
            f.write(await file.read())
        pcm_path = raw_path.rsplit('.', 1)[0] + ".pcm"
        convert_to_pcm(raw_path, pcm_path)
        text, err = await asr_xfyun_ws(pcm_path)
        os.remove(raw_path)
        os.remove(pcm_path)
        if text:
            return {"text": text}
        else:
            return {"error": err or "ASR failed"}
    except Exception as e:
        return {"error": f"后端异常: {str(e)}"}