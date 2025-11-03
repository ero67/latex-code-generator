#!/usr/bin/env python3
import cv2
import numpy as np
import sys


def preprocess_image(image_path):
    """
    Performs preprocessing on a hand-drawn diagram image and returns a cropped binary image.
    """
    # Load the image from the given path
    image = cv2.imread(image_path)

    if image is None:
        print(f"Error: Image not found at {image_path}.", file=sys.stderr)
        return None

    # Convert the image to grayscale
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply a Gaussian blur to reduce noise
    blurred_image = cv2.GaussianBlur(gray_image, (5, 5), 0)

    # Adaptive thresholding
    preprocessed_image = cv2.adaptiveThreshold(
        blurred_image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        5,
    )

    # Morphological opening to remove small noise
    kernel = np.ones((3, 3), np.uint8)
    opened_image = cv2.morphologyEx(preprocessed_image, cv2.MORPH_OPEN, kernel, iterations=1)

    # Crop to content (only keep area with foreground pixels)
    def crop_to_content(binary_img, padding=8):
        contours, _ = cv2.findContours(binary_img.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return binary_img
        xs, ys, xe, ye = [], [], [], []
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            xs.append(x)
            ys.append(y)
            xe.append(x + w)
            ye.append(y + h)
        x0 = max(min(xs) - padding, 0)
        y0 = max(min(ys) - padding, 0)
        x1 = min(max(xe) + padding, binary_img.shape[1])
        y1 = min(max(ye) + padding, binary_img.shape[0])
        return binary_img[y0:y1, x0:x1]

    cropped_image = crop_to_content(opened_image, padding=8)

    return cropped_image


def main():
    if len(sys.argv) < 2:
        print("Usage: preprocess.py input_path", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    img = preprocess_image(input_path)
    if img is None:
        sys.exit(2)

    # Encode to PNG in-memory and write bytes to stdout
    success, buf = cv2.imencode('.png', img)
    if not success:
        print("Failed to encode image", file=sys.stderr)
        sys.exit(3)

    # Write raw bytes to stdout.buffer so Node can capture them
    sys.stdout.buffer.write(buf.tobytes())


if __name__ == '__main__':
    main()
