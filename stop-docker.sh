docker stop $(docker ps -q --filter ancestor=investment-portfolio:latest) && \
docker rm $(docker ps -a -q --filter ancestor=investment-portfolio:latest) && \
docker rmi investment-portfolio:latest