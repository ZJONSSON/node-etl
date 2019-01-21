FROM node:10-jessie
USER root
RUN apt-get update
RUN wget http://ftp.us.debian.org/debian/pool/main/w/wait-for-it/wait-for-it_0.0~git20160501-1_all.deb
RUN dpkg -i ./wait-for-it_0.0~git20160501-1_all.deb
RUN apt-get install -f
RUN npm install -g tap