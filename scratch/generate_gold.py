import os
import numpy as np
from PIL import Image, ImageFilter

def generate_gold_logo():
    # Paths
    input_path = 'logo.png'
    output_path = 'logo_gold.png'
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    print(f"Loading {input_path}...")
    img = Image.open(input_path)
    
    # Extract alpha channel as mask
    if img.mode == 'RGBA':
        alpha = img.split()[-1]
    else:
        # Fallback if no alpha: convert to grayscale and invert
        gray = img.convert('L')
        alpha = Image.eval(gray, lambda x: 255 - x if x > 200 else 255)
        
    # Target resolution (4K width)
    w_target = 4096
    h_target = int(img.height * (w_target / img.width))
    print(f"Target resolution: {w_target}x{h_target}")
    
    # Resize alpha to target size
    alpha_high = alpha.resize((w_target, h_target), Image.Resampling.LANCZOS)
    
    # Convert to numpy array (0.0 to 1.0)
    mask = np.array(alpha_high, dtype=float) / 255.0
    
    # Create binary mask with a threshold to remove fuzziness but keep smooth edges
    binary_mask = (mask > 0.5).astype(float)
    
    # To avoid aliased edges, we blur the binary mask slightly
    mask_img = Image.fromarray((binary_mask * 255).astype(np.uint8))
    smooth_mask = np.array(mask_img.filter(ImageFilter.GaussianBlur(1.5)), dtype=float) / 255.0
    
    print("Generating heightmap for bevel...")
    # Multi-scale blur for heightmap (bevel effect)
    # Summing blurs creates a heightmap that is flat in the center and slopes at edges
    heightmap = np.zeros_like(smooth_mask)
    radii = [1, 2, 4, 8, 16, 24, 32]
    weights = [1.0, 1.0, 1.0, 1.0, 1.0, 0.8, 0.6]
    
    for r, w in zip(radii, weights):
        blurred = mask_img.filter(ImageFilter.GaussianBlur(r))
        heightmap += np.array(blurred, dtype=float) / 255.0 * w
        
    # Normalize heightmap
    heightmap /= np.sum(weights)
    
    # Apply mask to heightmap so background is exactly 0
    heightmap *= smooth_mask
    
    print("Computing normal map...")
    # Compute gradients for normals
    dy, dx = np.gradient(heightmap)
    
    # Scale factor for bevel height (higher = steeper/more pronounced bevel)
    bevel_scale = 15.0
    dx = dx * bevel_scale
    dy = dy * bevel_scale
    
    # Normal vector components
    nz = 1.0 / np.sqrt(dx**2 + dy**2 + 1.0)
    nx = -dx * nz
    ny = -dy * nz
    
    print("Generating metallic textures and lighting...")
    # Brushed metal texture: fine horizontal noise
    np.random.seed(42)
    noise_raw = np.random.randn(h_target, w_target // 4)
    noise_img = Image.fromarray(((noise_raw - noise_raw.min()) / (noise_raw.max() - noise_raw.min()) * 255).astype(np.uint8))
    brushed_noise = np.array(noise_img.resize((w_target, h_target), Image.Resampling.BILINEAR), dtype=float) / 255.0
    brushed_noise_img = Image.fromarray((brushed_noise * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    brushed_noise = np.array(brushed_noise_img, dtype=float) / 255.0
    
    # Normalize brushed noise to center around 1.0 with subtle variance
    brushed_noise = 0.9 + 0.2 * brushed_noise
    
    # Define light sources
    L1 = np.array([-0.5, -0.5, 0.7])
    L1 /= np.linalg.norm(L1)
    
    L2 = np.array([0.8, 0.2, 0.5])
    L2 /= np.linalg.norm(L2)
    
    # View vector
    V = np.array([0.0, 0.0, 1.0])
    
    # Gold Color Palettes
    color_champagne = np.array([236.0, 212.0, 124.0]) / 255.0
    color_deep_gold = np.array([170.0, 125.0, 45.0]) / 255.0
    color_highlight = np.array([255.0, 245.0, 210.0]) / 255.0
    
    # Dot products
    dot_L1 = nx * L1[0] + ny * L1[1] + nz * L1[2]
    dot_L2 = nx * L2[0] + ny * L2[1] + nz * L2[2]
    
    # Specular highlights (Blinn-Phong)
    H1 = (L1 + V) / np.linalg.norm(L1 + V)
    H2 = (L2 + V) / np.linalg.norm(L2 + V)
    
    dot_H1 = nx * H1[0] + ny * H1[1] + nz * H1[2]
    dot_H2 = nx * H2[0] + ny * H2[1] + nz * H2[2]
    
    dot_L1 = np.maximum(dot_L1, 0.0)
    dot_L2 = np.maximum(dot_L2, 0.0)
    dot_H1 = np.maximum(dot_H1, 0.0)
    dot_H2 = np.maximum(dot_H2, 0.0)
    
    # Environment reflection (spherical map reflection)
    rx = -2.0 * nx * nz
    ry = -2.0 * ny * nz
    
    horizon = np.exp(-((ry - 0.1) / 0.15)**2) * 0.4
    softbox_top = np.exp(-((ry - 0.6) / 0.3)**2 - ((rx - 0.2) / 0.5)**2) * 0.6
    softbox_left = np.exp(-((ry + 0.2) / 0.4)**2 - ((rx + 0.6) / 0.3)**2) * 0.3
    
    reflections = horizon + softbox_top + softbox_left
    
    blend = 0.5 + 0.5 * ny
    base_color = np.zeros((h_target, w_target, 3))
    for c in range(3):
        base_color[:, :, c] = color_champagne[c] * (1.0 - blend) + color_deep_gold[c] * blend
    
    for c in range(3):
        base_color[:, :, c] *= brushed_noise
        
    diffuse1 = dot_L1 * 0.6
    diffuse2 = dot_L2 * 0.3
    diffuse = diffuse1 + diffuse2 + 0.15
    
    specular1 = (dot_H1 ** 64) * 0.8
    specular2 = (dot_H2 ** 32) * 0.3
    specular = specular1 + specular2
    
    out_rgb = np.zeros_like(base_color)
    for c in range(3):
        refl_color = color_highlight[c] * 0.7 + base_color[:, :, c] * 0.3
        out_rgb[:, :, c] = (
            base_color[:, :, c] * diffuse + 
            reflections * refl_color + 
            specular * color_highlight[c]
        )
        
    out_rgb = np.clip(out_rgb, 0.0, 1.0)
    
    grad_mag = np.sqrt(dx**2 + dy**2)
    edge_darkening = 1.0 - np.clip(grad_mag / 10.0, 0.0, 0.4)
    for c in range(3):
        out_rgb[:, :, c] *= edge_darkening
        
    out_rgba = np.zeros((h_target, w_target, 4), dtype=np.uint8)
    out_rgba[:, :, :3] = (out_rgb * 255).astype(np.uint8)
    out_rgba[:, :, 3] = (smooth_mask * 255).astype(np.uint8)
    
    result_img = Image.fromarray(out_rgba, 'RGBA')
    result_img.save(output_path, 'PNG')
    print(f"Successfully saved luxurious gold logo to {output_path}")

if __name__ == '__main__':
    generate_gold_logo()
