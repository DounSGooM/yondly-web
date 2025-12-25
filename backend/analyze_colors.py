from PIL import Image
from collections import Counter
import sys

def analyze(path):
    img = Image.open(path).convert('RGBA')
    width, height = img.size
    
    # Scan the whole image or a central chunk where the logo is
    pixels = []
    data = img.getdata()
    for item in data:
        # Ignore transparent or fully white/black pixels if needed
        # item[3] is alpha. item[:3] is RGB.
        if item[3] > 50: # If not completely transparent
            pixels.append(item)
            
    counts = Counter(pixels)
    print("Most common colors (ignoring transparency):")
    for color, count in counts.most_common(5):
        print(f"Color: {color}, Count: {count}")

if __name__ == "__main__":
    analyze(sys.argv[1])
