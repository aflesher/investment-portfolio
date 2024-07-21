docker build . --tag investment-portfolio:latest && \
docker run -d -p 80:80 investment-portfolio:latest