# Build: the official maven image already ships Maven (same pattern as the
# ERP and AirStore; alpine's community repo for maven fails intermittently).
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package

# Runtime: small JRE image, non-root user.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Fixed uid/gid: config/instancias.yml (chmod 600, it holds the read-only
# role's passwords) is owned by 10001 on the server so only this user reads it.
RUN addgroup -S -g 10001 portal && adduser -S -u 10001 -G portal portal
COPY --from=build /app/target/*.jar app.jar
USER portal
EXPOSE 8080
ENV TZ=America/Guayaquil
# mem_limit 512m in the compose: heap capped at 70 % of it, serial GC because
# the server runs many small Java backends at once.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-Duser.timezone=America/Guayaquil", "-jar", "app.jar"]
