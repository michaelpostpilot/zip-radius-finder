# ZIP Code Radius Finder

This web application allows users to input a store address and find all ZIP codes within a specified radius from that location.

## Features

- Address autocomplete powered by Google Places API
- Radius selection (1-100 miles)
- Interactive map visualization
- List of ZIP codes within the selected radius
- Download results as CSV
- Responsive design for desktop and mobile devices

## Getting Started

### Prerequisites

- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API

### Setup

1. Clone or download this repository
2. Open `index.html` in your text editor
3. Replace `YOUR_API_KEY` in the Google Maps script tag with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places" defer></script>
```

4. For a production version, you'll need to connect to a real ZIP code database/API. See the comments in the `script.js` file for recommendations.

### Running the Application

- Open `index.html` in your web browser to use the application locally
- For production use, upload the files to a web server

## Current Limitations

This demo version uses mock data to simulate ZIP codes within a radius. To create a fully functional application, you'll need to integrate with one of the following:

1. ZIP Code API (https://www.zipcodeapi.com/)
2. SmartyStreets (https://smartystreets.com/)
3. Google's Geocoding API (requires additional processing)
4. Census.gov API (free but requires more processing)

## Customization

You can modify the following to customize the application:

- `styles.css` - Change colors, layout, and other visual elements
- `script.js` - Modify functionality or add new features
- `index.html` - Change structure or add additional UI elements

## License

This project is open-source and free to use for personal or commercial projects.

## Acknowledgements

- Google Maps Platform for mapping functionality
- Icons from [Library Name] (if you add icons)
