FROM node:18-bullseye

RUN apt-get update -y && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]