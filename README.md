# Valentine's World Map - Our World Together ❤️

A romantic, interactive world map showcasing memories and dreams shared with Maria.

## Features

- 🗺️ Interactive world map using Leaflet.js and OpenStreetMap
- 📍 Memory pins (pink) for places you've been together
- ✨ Dream pins (purple) for places you dream of visiting
- 🔍 Filter toggle to show Memories / Dreams / Both
- 📱 Responsive design that works on all devices
- 💝 Beautiful, romantic minimal design with soft colors
- 📝 Modal popups with detailed descriptions, photos, videos, and voice notes
- 🎯 No backend required - runs completely locally

## How to Run Locally

### Option 1: Simple Double-Click (Easiest)
1. Navigate to the folder containing the files
2. Double-click on `index.html`
3. Your default browser will open the website!

### Option 2: Using a Local Server (Recommended)

If Option 1 doesn't work due to browser security restrictions, use a local server:

**Using Python:**
```bash
# If you have Python 3 installed:
cd /Users/flo/code/valentines-map
python3 -m http.server 8000

# If you have Python 2 installed:
python -m SimpleHTTPServer 8000
```

**Using Node.js (if you have it installed):**
```bash
# Install http-server globally (one time only):
npm install -g http-server

# Run the server:
cd /Users/flo/code/valentines-map
http-server -p 8000
```

**Using VS Code (if you have it installed):**
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

Then open your browser and go to: `http://localhost:8000`

## How to Add More Pins

Simply edit the `pins.json` file! Each pin has this structure:

```json
{
    "id": 8,
    "type": "memory",  // or "dream"
    "title": "Amazing Place",
    "location": "City, Country",
    "lat": 40.7128,    // Latitude
    "lng": -74.0060,   // Longitude
    "description": "Your beautiful memory or dream description here...",
    "date": "When this happened or will happen",
    "media": [
        {
            "type": "image",
            "url": "path/to/your/image.jpg"
        },
        {
            "type": "video",
            "url": "path/to/your/video.mp4"
        },
        {
            "type": "audio",
            "url": "path/to/your/voicenote.mp3"
        }
    ]
}
```

### Finding Coordinates:
1. Go to [Google Maps](https://www.google.com/maps)
2. Right-click on any location
3. Click the coordinates at the top to copy them
4. First number is latitude, second is longitude

### Adding Media:
- Put your photos, videos, or voice notes in the same folder
- Reference them in the `media` array with relative paths
- Example: `"url": "photos/malta2025.jpg"`
- Supported formats: 
  - Images: jpg, png, gif
  - Videos: mp4, webm
  - Audio: mp3, ogg, wav

## File Structure

```
valentines-map/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── app.js          # JavaScript functionality
├── pins.json       # Your memory and dream data
├── README.md       # This file
└── media/          # (Optional) Create this folder for photos/videos
```

## Customization Tips

### Change Colors:
Edit `styles.css` and look for these color codes:
- Pink theme: `#ff6b9d` and `#c94b77`
- Purple (dreams): `#9b59b6`
- Background gradients: `#ffeef8`, `#ffe5f0`, `#ffd6e8`

### Change Map Starting Position:
In `app.js`, find this line:
```javascript
const map = L.map('map').setView([20, 10], 2);
```
Change `[20, 10]` to your preferred coordinates and `2` to your preferred zoom level.

### Add More Filter Types:
You can extend the system to have more categories (like "Future trips", "Wish list", etc.) by:
1. Adding the pin type to `pins.json`
2. Adding a new filter button in `index.html`
3. Creating a new custom icon in `app.js`

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Happy Valentine's Day! 💕

Enjoy sharing your world with Maria!
