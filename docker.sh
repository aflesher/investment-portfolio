docker stop $(docker ps -q --filter ancestor=investment-portfolio:latest) && \
docker rm $(docker ps -a -q --filter ancestor=investment-portfolio:latest) && \
docker rmi investment-portfolio:latest && \
docker build . --tag investment-portfolio:latest && \
docker run -d -p 80:80 investment-portfolio:latest