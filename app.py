from flask import Flask, request, jsonify
import numpy as np
import pickle
import joblib
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model and scaler
model = pickle.load(open("reg_model.pkl", "rb"))  # logistic regression model
scaler = joblib.load("reg.pkl")  # scaler used during training

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    cgpa = float(data['cgpa'])
    iq = float(data['iq'])

    # Prepare data for prediction
    features = np.array([[cgpa, iq]])
    scaled_features = scaler.transform(features)

    # Predict using the model
    prediction = model.predict(scaled_features)[0]  # 0 or 1

    return jsonify({'prediction': str(prediction)})

if __name__ == '__main__':
    print("starting server")
    app.run(debug=True)