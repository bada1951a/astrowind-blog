import os
import random
from pathlib import Path

# 블로그 프로젝트 폴더 내 경로 설정 (현재 내 컴퓨터의 블로그 폴더 위치에 맞게 수정 필요)
# 보통 블로그 소스가 있는 최상위 폴더에서 실행합니다.
posts_dir = Path("src/data/post")
images_root = Path("public/images")

# 카테고리/폴더 매핑 (글 제목이나 내용에 키워드가 들어가면 해당 폴더 사진 선택)
category_folders = {
    "ram": ["ram", "메모리", "램"],
    "storage": ["storage", "ssd", "hdd", "저장장치", "스토리지"],
    "bsod": ["bsod", "블루스크린", "오류", "error", "crash"],
    "display": ["display", "모니터", "화면", "디스플레이"],
    "keyboard": ["keyboard", "키보드", "타이핑"],
    "system": ["system", "시스템", "부팅"],
    "tech-photo": ["tech-photo", "테크", "IT"]
}

count = 0

# 100개가 넘는 마크다운(.md) 파일들을 하나씩 훑어봅니다.
for md_file in posts_dir.glob("*.md"):
    with open(md_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    file_lower = md_file.name.lower()
    content_lower = content.lower()
    
    # 글 제목이나 내용에 맞는 이미지 폴더를 찾습니다.
    selected_folder_name = "tech-photo"  # 못 찾으면 기본 폴더 사용
    for folder_name, keywords in category_folders.items():
        if any(kw in file_lower or kw in content_lower for kw in keywords):
            if (images_root / folder_name).exists():
                selected_folder_name = folder_name
                break
                
    target_img_dir = images_root / selected_folder_name
    if target_img_dir.exists():
        available_images = [img.name for img in target_img_dir.glob("*.*") if img.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]
        
        if available_images:
            # 해당 폴더에 있는 사진 중 무작위로 하나를 고릅니다.
            chosen_img = random.choice(available_images)
            new_img_path = f"/images/{selected_folder_name}/{chosen_img}"
            
            # 마크다운 안의 기존 이미지 경로 형태(![alt](경로))를 찾아 새 이미지 경로로 교체합니다.
            import re
            # 기존 이미지 태그 패턴을 찾아서 새 경로로 바꿈
            new_content = re.sub(r'!\[.*?\]\(.*?\)', f'![image]({new_img_path})', content)
            
            # 내용이 바뀐 경우에만 파일에 다시 저장합니다.
            if new_content != content:
                with open(md_file, "w", encoding="utf-8") as f:
                    f.write(new_content)
                count += 1
                print(f"[{md_file.name}] 이미지 교체 완료 -> 폴더: {selected_folder_name}, 사진: {chosen_img}")

print(f"\n총 {count}개의 포스트 이미지가 성공적으로 일괄 교체되었습니다!")