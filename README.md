# ZIP Code Radius Finder

An interactive web application that helps users find all ZIP codes within a specified radius of any address in the United States.

## Features

- Address autocomplete powered by Google Places API
- Interactive map visualization with radius circle
- List of ZIP codes within the selected radius
- Distance calculation for each ZIP code
- Download results as CSV
- Mobile-responsive design

## Setup

1. Clone this repository:
```bash
git clone [your-repository-url]
cd zip-radius-finder
```

2. Configure Google Maps API:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create an API key and restrict it to your domain
   - Replace `YOUR_API_KEY` in `index.html` with your actual API key

3. Deploy the application:

### Option 1: GitHub Pages
1. Create a new repository on GitHub
2. Push your code to the repository
3. Go to Settings > Pages
4. Select 'main' branch and click Save
5. Your site will be available at `https://[username].github.io/[repository-name]`

### Option 2: Netlify
1. Sign up for a [Netlify](https://www.netlify.com) account
2. Click "New site from Git"
3. Connect your repository
4. Deploy! Your site will be available at a Netlify subdomain

### Option 3: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize project: `firebase init hosting`
4. Deploy: `firebase deploy`

## Development

To run locally:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`

## Security Considerations

- Restrict your Google Maps API key to specific domains
- Set up usage quotas in Google Cloud Console
- Enable billing alerts to monitor API usage

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 