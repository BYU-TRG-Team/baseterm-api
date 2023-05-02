# Build Args
#
# ENV=production|development
#

FROM node:16-bullseye-slim
ARG ENV=production
WORKDIR /usr/src/app
COPY . .
RUN apt update && \ 
    apt upgrade -y && \
    apt install -y python3.9 python3-pip && \
    pip3 install -r requirements.txt && \
    npm ci && \
    npm run build && \ 
    if [ "${ENV}" = "production" ]; \ 
    then npm prune --production; \
    fi;
ENV NODE_ENV="${ENV}"
CMD npm run start