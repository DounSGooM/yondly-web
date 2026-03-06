from PIL import Image, ImageDraw
import sys

def remove_background(path, output_path):
    img = Image.open(path).convert('RGBA')
    width, height = img.size
    pixels = img.load()
    
    # Starting points for flood fill (corners)
    queue = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(queue)
    
    # Tolerance for "background color"
    # We assume background is grey/white checkerboard
    # So we look for neutral colors (r~=g~=b)
    
    def is_background(r, g, b, a):
        # Checkerboard greys are usually neutral. 
        # Green logo has high G.
        # So background has low saturation.
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        diff = max_val - min_val
        
        # If difference between max/min channel is low, it's grey/white
        # Green logo will have diff > ~30?
        if diff < 20: 
            return True
        return False

    processed = set()
    
    while queue:
        x, y = queue.pop(0)
        
        if (x, y) in processed:
            continue
        processed.add((x, y))
        
        if 0 <= x < width and 0 <= y < height:
            r, g, b, a = pixels[x, y]
            
            if is_background(r, g, b, a):
                # Make transparent
                pixels[x, y] = (0, 0, 0, 0)
                
                # Add neighbors
                neighbors = [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]
                for nx, ny in neighbors:
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
    
    img.save(output_path)
    print(f"Saved cleaned image to {output_path}")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
