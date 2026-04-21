# Stage 1: Build the application using Java 21
FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
# Build the jar file
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the jar from the build stage
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]