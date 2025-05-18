import sqlite3
from datetime import datetime
from ultralytics import YOLO
import cv2
from collections import deque



# Initialize SQLite Database
def init_db():
    conn = sqlite3.connect('crowd_data.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crowd_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            people_count INTEGER NOT NULL,
            alert_status INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Insert Data Function
def log_people_count(count, alert=False):
    conn = sqlite3.connect('crowd_data.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO crowd_logs (timestamp, people_count, alert_status)
        VALUES (?, ?, ?)
    ''', (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), count, int(alert)))
    conn.commit()
    conn.close()

# Initialize DB
init_db()

# YOLOv8 Setup
model = YOLO("yolov8n.pt")  # Using nano version for speed (use "yolov8m.pt" for better accuracy)

# Video processing setup
video_path = "bus_interior.mp4"  # Change to your video path
cap = cv2.VideoCapture(video_path)

# Density threshold settings
DENSITY_THRESHOLD = 10  # Alert when more than this many people are detected
ALERT_COOLDOWN = 30  # frames to wait between alerts
alert_active = False
cooldown_counter = 0

# Moving average for smoother people count
 # Stores last 10 frame counts
people_counts = deque(maxlen=10)
# Output video setup
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))
output_video = cv2.VideoWriter('output_video.mp4', 
                             cv2.VideoWriter_fourcc(*'mp4v'), 
                             fps, 
                             (frame_width, frame_height))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLOv8 inference (detect only people - class 0)
    results = model(frame, classes=[0], verbose=False)  # verbose=False to reduce output
    
    # Get current people count
    current_count = len(results[0].boxes)
    people_counts.append(current_count)
    
    # Calculate moving average
    avg_count = round(sum(people_counts) / len(people_counts))
    
    # Check density threshold
    if avg_count > DENSITY_THRESHOLD:
        if not alert_active and cooldown_counter <= 0:
            print(f"ALERT! High density detected: {avg_count} people")
            alert_active = True
            cooldown_counter = ALERT_COOLDOWN
        # Visual alert (red frame border)
        cv2.rectangle(frame, (0, 0), (frame_width-1, frame_height-1), (0, 0, 255), 10)
    else:
        alert_active = False
    
    if cooldown_counter > 0:
        cooldown_counter -= 1
    
    # Visualize results
    annotated_frame = results[0].plot()  # Draw bounding boxes
    
    # Display count on frame
    cv2.putText(annotated_frame, 
                f"People: {avg_count}", 
                (20, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                (0, 255, 0), 
                2)
    
    # Threshold indicator
    threshold_color = (0, 0, 255) if avg_count > DENSITY_THRESHOLD else (0, 255, 0)
    cv2.putText(annotated_frame, 
                f"Threshold: {DENSITY_THRESHOLD}", 
                (20, 90), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                threshold_color, 
                2)
    
    # Write to output video
    output_video.write(annotated_frame)
    
    # Display
    cv2.imshow("Density Tracking", annotated_frame)
    
    # Exit on 'q' key
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Clean up
cap.release()
output_video.release()
cv2.destroyAllWindows()
print("Processing complete. Output saved to output_video.mp4")