FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY web/ /usr/share/nginx/html/
RUN chmod -R a+rX /usr/share/nginx/html
