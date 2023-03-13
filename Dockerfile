FROM node:16
WORKDIR /usr/src/app
COPY . .

# install python3
# install node modules
# build app
# install python dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && npm ci && npm run build && pip3 install -r requirements.txt
CMD npm run start