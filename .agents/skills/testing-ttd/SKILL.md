---
name: Testing the TTD Booking Assistant
description: How to set up, run, and end-to-end test the TTD Booking Assistant (React + Vite frontend, FastAPI + MongoDB backend).
---

# Testing the TTD Booking Assistant

## Devin Secrets Needed

None. The app uses local auth (JWT in `localStorage`) and a local MongoDB container.

## Local services to start

```bash
# MongoDB (or use docker compose for full stack)
docker run -d --name ttd-mongo -p 27017:27017 mongo:7

# Backend
cd /home/ubuntu/repos/TTD/api
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd /home/ubuntu/repos/TTD
npx vite --host 0.0.0.0 --port 5173
```

## Endpoints

- Frontend dev: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Docker/nginx app: `http://localhost:8080`

## Useful test data

Generate a simple ID image with Pillow and save it to `/tmp/test_id.png`:

```python
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', (600, 300), color='white')
d = ImageDraw.Draw(img)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
d.text((20, 20), 'Name: Ravi Kumar', fill='black', font=font)
d.text((20, 70), 'DOB: 15/08/1990', fill='black', font=font)
d.text((20, 120), 'Gender: Male', fill='black', font=font)
d.text((20, 170), 'Aadhaar: 1234 5678 9012', fill='black', font=font)
img.save('/tmp/test_id.png')
```

Tesseract.js v7 downloads language data from `https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz` and the PDF worker from `https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.mjs`; the test environment must be able to reach these CDNs.

## Browser automation notes

- The app uses React controlled inputs. If `browser type` is unavailable, set values from the console with:
  ```js
  function setReactInputValue(input, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    valueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  ```
- For file upload, create a canvas `Blob`, wrap it in a `File`, and use `DataTransfer` to set `input.files` if `select_file` cannot be used.
- To inspect generated scripts, monkey-patch `navigator.clipboard.writeText` and then click the copy buttons:
  ```js
  window.__copiedText = null;
  navigator.clipboard.writeText = (text) => { window.__copiedText = text; return Promise.resolve(); };
  ```

## Build and Docker

```bash
# Production build
cd /home/ubuntu/repos/TTD
npm run build

# Full Docker stack
docker compose up --build -d
# Then verify:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

## Known testing caveats

- The `dist/` directory may be stale if the source changed since the last build; always run `npm run build` before Docker.
- `docker compose` may reuse a named `mongo_data` volume from a previous run, so existing users may already be present when testing registration on port 8080.
