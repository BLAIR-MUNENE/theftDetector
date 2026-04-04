import torch

from ultralytics import YOLO
train = False
test = False
test_video = True
if train == True:

    model = YOLO("yolo26n.pt")

    model.train(
            data="/home/blair/Development/des/yolotraining/dataset/data.yaml",
            epochs=100,
            imgsz=640,
            batch=16,
            project="/home/blair/Development/des/yolotraining",   # main folder
            name="experiment_1",
            device=0  # THIS forces GPU usage
        )

elif test == True:
    model = YOLO("/home/blair/Development/des/yolotraining/runs/detect/train/weights/best.pt")

    model.predict("/home/blair/Development/des/yolotraining/dataset/test/images", save=True, save_txt=True, conf=0.25, iou=0.5, line_width=1, project="/home/blair/Development/des/yolotraining", name="test")


elif test_video == True:
    import cv2
    from ultralytics import YOLO

    # Load your trained YOLOv8 model
    model = YOLO("/home/blair/Development/des/yolotraining/experiment_1/weights/best.pt")

    # Open the video file or webcam (0 for default webcam)
    cap = cv2.VideoCapture("/home/blair/Development/des/yolotraining/s.mp4")  # replace with 0 for webcam

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLOv8 prediction on the current frame
        results = model.predict(frame, conf=0.25, verbose=False)

        # results[0].plot() returns an image with bounding boxes drawn
        annotated_frame = results[0].plot()

        # Display the frame
        cv2.imshow("YOLOv8 Real-Time", annotated_frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


else:

    pass
