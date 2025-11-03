from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
import cv2
import numpy as np
from io import BytesIO

app = FastAPI()


def crop_to_content(binary_img, padding=8):
    contours, _ = cv2.findContours(binary_img.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return binary_img
    xs, ys, xe, ye = [], [], [], []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        xs.append(x); ys.append(y); xe.append(x + w); ye.append(y + h)
    x0 = max(min(xs) - padding, 0)
    y0 = max(min(ys) - padding, 0)
    x1 = min(max(xe) + padding, binary_img.shape[1])
    y1 = min(max(ye) + padding, binary_img.shape[0])
    return binary_img[y0:y1, x0:x1]


def preprocess_image_bytes(data: bytes):
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    pre = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 5)
    kernel = np.ones((3, 3), np.uint8)
    opened = cv2.morphologyEx(pre, cv2.MORPH_OPEN, kernel, iterations=1)
    cropped = crop_to_content(opened, padding=8)

    success, buf = cv2.imencode('.png', cropped)
    if not success:
        return None
    return buf.tobytes()


@app.post('/preprocess')
async def preprocess(file: UploadFile = File(...)):
    data = await file.read()
    processed = preprocess_image_bytes(data)
    if processed is None:
        raise HTTPException(status_code=500, detail='Preprocessing failed')
    return Response(content=processed, media_type='image/png')


@app.get('/health')
async def health():
    return {"status": "ok"}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
