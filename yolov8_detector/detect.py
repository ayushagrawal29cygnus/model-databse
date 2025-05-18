import cv2
from ultralytics import YOLO
import json
from datetime import datetime
import requests
import time

class OccupancyDetector:
    def __init__(self):
        # Initialize YOLOv8 model (auto-downloads yolov8n.pt if not found)
        self.model = YOLO("yolov8n.pt")  # For better accuracy, use "yolov8s.pt" or custom-trained model
        self.api_url = "http://localhost:5000/api/occupancy"  # Flask API endpoint
        self.vehicle_id = "BUS-101"  # Customize per vehicle
        
    def process_stream(self, video_source=0):
        """
        Process video stream and count people
        Args:
            video_source: 0 for webcam, "path/to/video.mp4" for video file
        """
        cap = cv2.VideoCapture(video_source)
        
        while cap.isOpened():
            success, frame = cap.read()
            
            if not success:
                break
                
            # Run YOLOv8 inference
            results = self.model(frame, verbose=False)  # Set verbose=False to reduce clutter
            
            # Visualize results (optional)
            annotated_frame = results[0].plot()
            cv2.imshow("Occupancy Detection", annotated_frame)
            
            # Get occupancy data
            current_count = len(results[0].boxes)
            self.send_occupancy_data(current_count)
            
            # Exit on 'q' key
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
                
        cap.release()
        cv2.destroyAllWindows()
    
    def send_occupancy_data(self, count):
        """Send data to Flask API"""
        occupancy_data = {
            "vehicle_id": self.vehicle_id,
            "timestamp": datetime.now().isoformat(),
            "occupancy": count,
            "confidence": round(float(self.model.predictor.speed["inference"]), 4)  # Inference speed in ms
        }
        
        # Print to console (for debugging)
        print(json.dumps(occupancy_data, indent=2))
        
        # Send to Flask API
        try:
            response = requests.post(
                self.api_url,
                json=occupancy_data,
                timeout=2  # 2-second timeout
            )
            print(f"API Response: {response.status_code}")
        except Exception as e:
            print(f"API Error: {str(e)}")
    
    def test_with_image(self, image_path):
        """Alternative: Process single image"""
        results = self.model(image_path)
        count = len(results[0].boxes)
        self.send_occupancy_data(count)
        return count

if __name__ == "__main__":
    detector = OccupancyDetector()
    
    # Choose one of these options:
    
    # 1. Real-time webcam processing
    detector.process_stream(0)  # 0 for default webcam
    
    # 2. Process video file
    # detector.process_stream("bus_cctv_feed.mp4")
    
    # 3. Test with single image
    # detector.test_with_image("bus_interior.jpg")