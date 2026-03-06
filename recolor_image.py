
import sys
import colorsys
from PIL import Image

def recolor_image(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    pixels = img.load()
    width, height = img.size

    # Define Orange range in HSV (normalized 0-1)
    # Orange is roughly 15-45 degrees, i.e., 0.04 - 0.125
    # We'll target the bright orange used in the illustration
    
    # Target Green Hue (approx 140 degrees / 360 = 0.38)
    target_hue = 0.38 

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue

            # Convert to HSV
            h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)

            # Check if pixel is "Orange-ish"
            # Hue around 0.05 to 0.11 (18 to 40 degrees)
            # Saturation > 0.4 (colorful)
            # Value > 0.4 (not too dark)
            if 0.02 <= h <= 0.12 and s > 0.4 and v > 0.2:
                # Shift hue to green
                new_h = target_hue
                # Keep saturation and value mostly same, maybe slightly desaturate if needed
                new_r, new_g, new_b = colorsys.hsv_to_rgb(new_h, s, v)
                
                pixels[x, y] = (int(new_r*255), int(new_g*255), int(new_b*255), a)

    img.save(output_path)
    print(f"Saved recolored image to {output_path}")

if __name__ == "__main__":
    recolor_image(
        "/Users/lagaville/Downloads/Loop-main/website-yondly/frontend/public/assets/pro_hero.png",
        "/Users/lagaville/Downloads/Loop-main/website-yondly/frontend/public/assets/pro_hero_green.png"
    )
