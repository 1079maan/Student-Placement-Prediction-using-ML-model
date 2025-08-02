# Student-Placement-Prediction-using-ML-model

****Project Overview:****

This project is a complete machine learning solution for predicting student placement based on their CGPA and IQ scores. It covers the full lifecycle of a machine learning project, from data exploration and model training to deployment as a web application.

****Project Files:****

**end_to_end_ml.ipynb:** A Jupyter Notebook detailing the entire machine learning process. This includes:

    Data Loading & EDA: Using Pandas to load the placement.csv dataset and perform exploratory data analysis.
    
    Data Preprocessing: Splitting data into training and testing sets, and using StandardScaler to normalize features.
    
    Model Training: Implementing and training a LogisticRegression model from scikit-learn.
    
    Evaluation: Calculating and displaying the model's accuracy.
    
    Model Persistence: Saving the trained model (reg_model.pkl) and the scaler (reg.pkl) using pickle and joblib.

**app.py:** A Flask-based backend server. This Python script:

    Loads the pre-trained reg_model.pkl and reg.pkl files.

    Exposes a /predict API endpoint to handle POST requests with CGPA and IQ data.

    Scales the input data and uses the model to predict student placement (placed or not placed).

    Returns the prediction as a JSON response.

**student.html:** The front-end of the web application. This HTML file, styled with style.css, provides a user interface to:

    Input CGPA and IQ scores.

    Send the data to the Flask backend's /predict endpoint.

    Display the prediction result to the user.

**style.css:** The CSS file used to style the student.html page with a modern, "neon-tech" theme.

**reg.pkl and reg_model.pkl:** The serialized model and scaler objects.

****How to Run the Project:****

    1.Clone the repository: git clone [https://github.com/1079maan/Student-Placement-Prediction-using-ML-model]
    
    2.Set up the Python environment: Install the required libraries (Flask, numpy, scikit-learn, joblib).
    
    3.Run the backend server: Navigate to the project directory and run python app.py.
    
    4.Open the front-end: Open the student.html file in your web browser.
    
    5.Interact with the app: Input a CGPA and IQ score, then click "Predict Placement" to see the result.

****Technologies Used****
    **Machine Learning:** Python, Pandas, Scikit-learn
    
    **Backend:** Flask
    
    **Frontend:** HTML, CSS, JavaScript
