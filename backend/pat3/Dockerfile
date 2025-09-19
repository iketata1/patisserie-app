# ---- build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline
COPY . .
# encodage UTF-8
RUN mvn -q -DskipTests -Dproject.build.sourceEncoding=UTF-8 -Dproject.reporting.outputEncoding=UTF-8 package

# ---- runtime ----
FROM eclipse-temurin:17-jre
WORKDIR /app
# plus robuste que *SNAPSHOT.jar
COPY --from=build /src/target/*.jar app.jar
ENV JAVA_OPTS="-Xms256m -Xmx512m"
EXPOSE 8084
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
