FROM nginx:alpine
COPY web/ /usr/share/nginx/html/
RUN chmod -R a+rX /usr/share/nginx/html
