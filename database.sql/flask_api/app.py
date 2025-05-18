from flask import Flask, request, jsonify
from pymongo import MongoClient  # For MongoDB
from datetime import datetime
import os

app = Flask(__name__)

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["transport_db"]
collection = db["occupancy"]

@app.route("/api/occupancy", methods=["POST"])
def update_occupancy():
    data = request.json
    data["timestamp"] = datetime.now()  # Add timestamp
    collection.insert_one(data)
    return jsonify({"status": "success", "message": "Data saved!"})

@app.route("/api/occupancy/<vehicle_id>", methods=["GET"])
def get_occupancy(vehicle_id):
    latest_data = collection.find_one(
        {"vehicle_id": vehicle_id},
        sort=[("timestamp", -1)]  # Get most recent entry
    )
    if latest_data:
        latest_data["_id"] = str(latest_data["_id"])  # Convert ObjectId to string
    return jsonify(latest_data or {"error": "No data found"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)