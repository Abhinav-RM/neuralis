import os
from PIL import Image, ImageDraw

res_dir = 'android/app/src/main/res'
app_icon_src = 'neuralis.png'
noti_icon_src = 'noti.png'

def create_placeholders():
    if not os.path.exists(app_icon_src):
        print(f"Creating placeholder app icon: {app_icon_src}")
        img = Image.new('RGBA', (512, 512), color='#4F46E5')
        draw = ImageDraw.Draw(img)
        # Beautiful geometric 'N'
        draw.polygon([
            (120, 100), (185, 100), 
            (327, 340), (327, 100), (392, 100), 
            (392, 412), (327, 412), 
            (185, 172), (185, 412), (120, 412)
        ], fill='white')
        img.save(app_icon_src)

    if not os.path.exists(noti_icon_src):
        print(f"Creating placeholder notification icon: {noti_icon_src}")
        img = Image.new('RGBA', (512, 512), color=(0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.polygon([
            (120, 100), (185, 100), 
            (327, 340), (327, 100), (392, 100), 
            (392, 412), (327, 412), 
            (185, 172), (185, 412), (120, 412)
        ], fill='white')
        img.save(noti_icon_src)

def process_launcher():
    if not os.path.exists(app_icon_src):
        print(f"Error: {app_icon_src} not found.")
        return
    
    src = Image.open(app_icon_src)
    
    sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    for folder, size in sizes.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Legacy square icon
        square = src.resize((size, size), Image.Resampling.LANCZOS)
        square.save(os.path.join(folder_path, 'ic_launcher.png'))
        
        # Legacy round icon
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        
        round_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        round_icon.paste(square, (0, 0), mask=mask)
        round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'))
        
        # Adaptive foreground
        fg_size = int(size * 108 / 48)
        fg = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        
        # Scale original icon down to fit the safe zone (72dp)
        safe_size = int(size * 72 / 48)
        resized_src = src.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
        
        offset = (fg_size - safe_size) // 2
        # Paste with alpha channel transparency mask
        if resized_src.mode == 'RGBA':
            fg.paste(resized_src, (offset, offset), mask=resized_src.split()[3])
        else:
            fg.paste(resized_src, (offset, offset))
        fg.save(os.path.join(folder_path, 'ic_launcher_foreground.png'))
        
    print("Launcher icons generated successfully.")

def process_notifications():
    if not os.path.exists(noti_icon_src):
        print(f"Error: {noti_icon_src} not found.")
        return
        
    src = Image.open(noti_icon_src)
    
    sizes = {
        'drawable-mdpi': 24,
        'drawable-hdpi': 36,
        'drawable-xhdpi': 48,
        'drawable-xxhdpi': 72,
        'drawable-xxxhdpi': 96
    }
    
    for folder, size in sizes.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        resized = src.resize((size, size), Image.Resampling.LANCZOS)
        resized = resized.convert('RGBA')
        
        # Convert to pure white with alpha channel
        datas = resized.getdata()
        new_data = []
        for item in datas:
            new_data.append((255, 255, 255, item[3]))
            
        resized.putdata(new_data)
        resized.save(os.path.join(folder_path, 'icon.png'))
        
    # Save base fallback drawable icon
    fallback_path = os.path.join(res_dir, 'drawable')
    os.makedirs(fallback_path, exist_ok=True)
    
    fallback_icon = src.resize((48, 48), Image.Resampling.LANCZOS).convert('RGBA')
    fd = fallback_icon.getdata()
    nfd = []
    for item in fd:
        nfd.append((255, 255, 255, item[3]))
    fallback_icon.putdata(nfd)
    fallback_icon.save(os.path.join(fallback_path, 'icon.png'))
    
    print("Notification icons generated successfully.")

if __name__ == '__main__':
    create_placeholders()
    process_launcher()
    process_notifications()
