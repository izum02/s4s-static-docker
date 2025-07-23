# ベースイメージとして Node.js を使用
FROM node:20.18.1

# 作業ディレクトリを設定
WORKDIR /app

# ホストのファイルをコンテナにコピー
COPY . .
RUN npm install -g pnpm
# translations ディレクトリを作成し、権限を設定
RUN mkdir -p /app/translations && chmod -R 777 /app/translations
RUN chmod -R 777 /app

# 依存関係をインストール（競合を無視）
RUN pnpm install --prefer-offline --strict-peer-dependencies=false

# OpenSSL の互換オプションを有効化
#ENV NODE_OPTIONS="--openssl-legacy-provider"

RUN pnpm install scratch-vm@git+https://huggingface.co/datasets/soiz1/s4s-vm
# コンテナの起動時にサーバーを実行
CMD ["npm", "start"]

# コンテナがリッスンするポート
EXPOSE 3000