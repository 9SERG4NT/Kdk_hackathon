# Web Frontend Setup

## 1) Configure Supabase keys

Edit `web/config.js` and set:

- `supabaseUrl`
- `supabaseAnonKey`

You can get the anon key from Supabase Dashboard:
- Project Settings -> API -> Project API keys -> `anon` public key

## 2) Serve the web folder

Use any static server. Example with Python:

```powershell
cd web
python -m http.server 5500
```

Then open:
- `http://127.0.0.1:5500`

## 3) Use the app

1. Sign up or sign in.
2. Pick location by map click or `Use my location`.
3. Upload an image and submit a road issue.
4. Filter feed by status, severity, text, and radius.
5. Open Admin Dashboard with an admin user.
6. Update issue status from the admin panel.

## Notes

- The app calls deployed edge functions:
  - `create-issue`
  - `admin-update-issue`
  - `admin-dashboard`
- Images are uploaded to storage bucket `road-issue-images`.
- Upload progress is shown during image upload.
- A map view with markers is rendered using Leaflet + OpenStreetMap.
- Non-admin users will get a permission error for admin endpoints.
