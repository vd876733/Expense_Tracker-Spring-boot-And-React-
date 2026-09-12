# Build stage
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
# Ensure the maven wrapper is executable
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
