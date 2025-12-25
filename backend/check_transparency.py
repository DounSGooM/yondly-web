from PIL import Image
import sys

def check_transparency(path):
    try:
        img = Image.open(path)
        if img.mode != 'RGBA':
            print(f"Image mode is {img.mode}, not RGBA. No transparency.")
            return

        # Check corners
        corners = [
            (0, 0),
            (img.width - 1, 0),
            (0, img.height - 1),
            (img.width - 1, img.height - 1)
        ]
        
        transparent_pixels = 0
        total_pixels = img.width * img.height
        
        # Sample check
        data = img.getdata()
        for pixel in data:
            if pixel[3] < 255: # Alpha < 255
                transparent_pixels += 1
                
        print(f"Total Pixels: {total_pixels}")
        print(f"Transparent Pixels (Alpha < 255): {transparent_pixels}")
        print(f"Percentage Transparent: {(transparent_pixels/total_pixels)*100:.2f}%")
        
        for x, y in corners:
            pixel = img.getpixel((x, y))
            print(f"Corner ({x}, {y}): {pixel}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_transparency(sys.argv[1])
