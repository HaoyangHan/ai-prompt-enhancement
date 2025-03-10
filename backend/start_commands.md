# Start Commands

## Backend
# Activate the virtual environment
source .venv/bin/activate

# Start the backend server
cd src
uvicorn ai_prompt_enhancement.main:app --reload --host 0.0.0.0 --port 8000

## Frontend
# In a separate terminal
cd ../frontend
npm install
npm run dev
