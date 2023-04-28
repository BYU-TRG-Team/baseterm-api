FROM node:16-bullseye-slim
WORKDIR /usr/src/app
COPY . .

RUN apt update && \ 
    apt upgrade -y && \
    apt install -y python3.9 python3-pip && \
    pip3 install -r requirements.txt && \
    npm ci && \
    npm run build && \ 
    npm prune --production
CMD npm run start