name: Fix All Markdown Posts

on:
  workflow_dispatch: # Actions 탭에서 "Run workflow" 버튼으로 수동 실행

jobs:
  fix-posts:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Markdown Fixer
        run: node fix-markdown.mjs

      - name: Commit and Push Fixed Posts
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/post
          if git diff --staged --quiet; then
            echo "수정할 파일이 없습니다."
          else
            git commit -m "Fix: Batch fix all markdown formatting glitch"
            git push
          fi
