
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal

# Load trained ML model
model = joblib.load("Mental_Health.pkl")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# Input data format
class StudentData(BaseModel):
    Age: int = Field(...,ge = 10, le=100)
    Gender: Literal['Male','Female']
    Country: str
    Academic_Level: Literal['Undergraduate','Graduate','High School']
    Most_Used_Platform: Literal['Facebook',  'LinkedIn', 'Instagram',  'Snapchat',   'Twitter',   'YouTube',  'TikTok',      'LINE', 'KakaoTalk', 'VKontakte','WhatsApp',    'WeChat']
    Purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours: float = Field(...,ge=0,le=24)
    Daily_Unlocks: int = Field(...,ge=0)
    Study_Hours: float = Field(...,ge=0,le=24)
    Physical_Activity_Hours: float = Field(...,ge=0, le=2)
    Sleep_Hours_Per_Night: float = Field(..., ge=0,le=24)
    Stress_Level: Literal['Medium', 'Low', 'Very High', 'High']
    
    
# describe what we send back

class PredictionResponse(BaseModel):
    predicted_mental_health_score:float


@app.get("/")
def greet():
    return {"Welcome to h Code"}


# Countries included in the main groups
top_countries = [
    "india", "usa", "canada", "australia",
    "uk", "germany", "mexico", "turkey", "france"
]


@app.post("/predict",response_model=PredictionResponse)
def predict(data: StudentData):

    # Group countries not in the top list as 'other'
    country = data.Country.strip()
    country_group = (
        country.lower()
        if country.lower() in top_countries
        else "other"
    )

    # Create input DataFrame
    input_row = pd.DataFrame([{
        "Age": data.Age,
        "Gender": data.Gender,
        "Country": data.Country,
        "Academic_Level": data.Academic_Level,
        "Most_Used_Platform": data.Most_Used_Platform,
        "Purpose_Of_Use": data.Purpose_Of_Use,
        "Avg_Daily_Usage_Hours": data.Avg_Daily_Usage_Hours,
        "Daily_Unlocks": data.Daily_Unlocks,
        "Study_Hours": data.Study_Hours,
        "Physical_Activity_Hours": data.Physical_Activity_Hours,
        "Sleep_Hours_Per_Night": data.Sleep_Hours_Per_Night,
        "Stress_Level": data.Stress_Level,
        "Grouped_country": country_group
    }])

    # Predict Mental Health Score
    prediction = model.predict(input_row)[0]

    return PredictionResponse(predicted_mental_health_score = round(float (prediction),2) )
