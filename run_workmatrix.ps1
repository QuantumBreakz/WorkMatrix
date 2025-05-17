# Start the frontend in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Front-End; npm run dev"

# Start the background app in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Background-App; python run.py" 