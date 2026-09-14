# Multi-stage build: compile with Maven, run with a slim JRE.
# Identical across every Spring Boot service in this repo — only the exposed
# port differs, and that's set at runtime by docker-compose, not baked in here.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Cache dependencies in their own layer so `docker build` only re-downloads
# them when pom.xml actually changes, not on every source edit.
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
