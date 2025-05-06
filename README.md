# XML to Excel Converter with Google Drive Upload

This web application allows users to upload XML files, convert them to Excel format, and automatically upload them to Google Drive.

## Prerequisites

1. Node.js (v14 or higher)
2. Python (v3.6 or higher)
3. Google Cloud Platform account with Drive API enabled
4. Required Python packages:
   ```
   pip install pandas openpyxl
   ```

## Setup Instructions

1. Clone this repository
2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Set up Google Drive API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials
   - Download the credentials and save them as `credentials.json`

4. Create a `.env` file in the root directory with the following content:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
   PORT=3000
   ```

5. Create the necessary directories:
   ```
   mkdir uploads
   mkdir public
   ```

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Click the "Choose File" button to select an XML file
2. Click "Convert and Upload" to process the file
3. The application will:
   - Convert the XML file to Excel format
   - Upload the Excel file to your Google Drive
   - Show a success message with the file ID

## Security Notes

- The application uses temporary storage for file conversion
- Files are automatically deleted after processing
- Make sure to keep your Google API credentials secure
- Never commit the `.env` file or `credentials.json` to version control 