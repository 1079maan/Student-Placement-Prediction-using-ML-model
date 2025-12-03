# PlaceMate – Student Placement Prediction & Analytics System

****Project Overview:****

PlaceMate is a complete end-to-end mini-project that predicts a student's placement chances using Machine Learning and provides an interactive web dashboard for analytics.

The system includes:
A trained ML model (Logistic Regression)
A Flask backend API
A full frontend UI (Home, Predict, Analytics, About pages)
A real-time analytics dashboard powered by charts and KPIs
A dataset-based summary view displayed on the home page
The project demonstrates ML workflow, API integration, web development, and real-time visualization — perfect for college mini-projects.

****Project Files:****

**1. Machine Learning & Data Processing** :

🔹 new_placement.csv

    Dataset containing:
    
    CGPA
    
    IQ
    
    Internship Experience
    
    Projects Completed
    
    Placement (Target: 1 = Placed, 0 = Not Placed)

🔹 Model Training (Notebook / Script)
    Includes:
    
    Data Loading & Cleaning
    
    EDA
    
    Label Encoding / Preprocessing
    
    Train–Test Split
    
    Scaling with StandardScaler
    
    Logistic Regression training
    
    Accuracy evaluation
    
    Saving Model (model.pkl) and Scaler (scaler.pkl)

**2. Backend – Flask API** A Flask-based backend server. This Python script:

   🔹 app.py

Flask server that:

    ✔ Loads ML model + scaler
    
        model.pkl  
        
        scaler.pkl

    ✔ Provides API endpoints
    
    Endpoint	Method	Description
    
    /predict	POST	Predict placement using CGPA, IQ, Internship, Projects
    
    /analytics	GET	    Returns dataset analytics (KPIs + charts data)
    
    ✔ Backend Tasks
    
    Validate user input
    
    Preprocess input using stored scaler
    
    Predict using ML model
    
    Send JSON back to frontend
    
    Compute analytics summary from CSV
    
**3. Frontend UI**:

    🔹 new.html (Analytics Page)

        Displays:
        
        Placement Rate
        
        Avg CGPA
        
        Avg IQ
        
        Avg Projects
        
        4 Charts (2×2 layout):
        
        CGPA vs Probability
        
        Placed vs Not Placed
        
        Internship vs Probability
        
        Projects Distribution

    🔹 new.js

        Handles:
        
        API requests to Flask
        
        Rendering charts with Chart.js
        
        Updating KPIs
        
        Managing prediction history

    🔹 new.css
    
        Modern clean UI:
        
        Navbar
        
        Cards
        
        KPI section
        
        Chart grid layout
        
        Responsive design



****How to Run the Project:****

1. Clone the Repository
    git clone https://github.com/your-username/PlaceMate.git
    cd PlaceMate

2. Install Required Libraries
    pip install flask numpy pandas scikit-learn joblib

3. Start the Flask Server
    python app.py
   
    Server will run on:

    http://localhost:5000

4. Run the Frontend

    Simply open:
   
    new.html
   
6. Use the App

    Enter details → Get placement prediction
    
    Generate PDF
    
    View analytics & charts
    
    Explore dataset KPIs

****Technologies Used****

    Machine Learning: Python, Pandas, Numpy, Scikit-learn
    
    Backend: Flask, Joblib / Pickle
    
    Frontend: HTML, CSS, JavaScript, Chart.js
