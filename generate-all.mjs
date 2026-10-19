name: Update Blog Images Automatically

on:
  workflow_dispatch: # 깃허브 웹에서 버튼 하나로 수동 실행할 수 있는 옵션

jobs:
  update-images:
    runs-on: ubuntu-latest
    steps:
      - name: 깃허브 코드 가져오기
        uses: actions/checkout@v3

      - name: 파이썬 설정
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: 단일 폴더 이미지 일괄 교체 및 순환 로직 실행
        run: |
          python -c "
          import os
          import random
          from pathlib import Path

          posts_dir = Path('src/data/post')
          target_img_dir = Path('public/images/tech-photo')

          # tech-photo 단일 폴더에서 사용 가능한 이미지 목록 로드
          available_images = []
          if target_img_dir.exists():
              available_images = [img.name for img in target_img_dir.glob('*.*') if img.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]

          if available_images:
              # 무작위로 섞어서 골고루 쓰이도록 큐 준비
              random.shuffle(available_images)
              pool_index = 0
              total_imgs = len(available_images)

              count = 0
              for md_file in posts_dir.glob('*.md'):
                  with open(md_file, 'r', encoding='utf-8') as f:
                      content = f.read()
                  
                  # 단일 폴더의 이미지 큐에서 순차적으로 가져오되, 모자라면 다시 처음부터 돌려쓰기(순환)
                  chosen_img = available_images[pool_index]
                  pool_index = (pool_index + 1) % total_imgs
                  
                  new_img_path = f'/images/tech-photo/{chosen_img}'
                  
                  import re
                  new_content = re.sub(r'!\[.*?\]\(.*?\)', f'![image]({new_img_path})', content)
                  
                  if new_content != content:
                      with open(md_file, 'w', encoding='utf-8') as f:
                          f.write(new_content)
                      count += 1
                      print(f'[{md_file.name}] -> tech-photo/{chosen_img}')

              print(f'총 {count}개 포스트 이미지 교체 완료!')
          else:
              print('public/images/tech-photo 폴더에 사용 가능한 이미지가 없습니다.')
          "

      - name: 변경된 파일 깃허브에 자동 저장(Commit)
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Auto update post images from single tech-photo folder"
          branch: main
