from ultralytics import YOLO

train = False
test = False
test_video = True

if train:
    model = YOLO("yolov8n.pt")

    model.train(
        data="dataset/data.yaml",
        epochs=100,
        imgsz=640,
        batch=16,
        project=".",
        name="experiment_1",
        device="cpu",  # change to 0 to use GPU
    )

elif test:
    model = YOLO("experiment_1/weights/best.pt")

    model.predict(
        "dataset/test/images",
        save=True,
        save_txt=True,
        conf=0.25,
        iou=0.5,
        line_width=1,
        project=".",
        name="test",
    )

elif test_video:
    import cv2

    model = YOLO("experiment_1/weights/best.pt")

    # Replace 0 with a video file path to test on a file
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model.predict(frame, conf=0.25, verbose=False)
        annotated_frame = results[0].plot()

        cv2.imshow("YOLOv8 Real-Time", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
