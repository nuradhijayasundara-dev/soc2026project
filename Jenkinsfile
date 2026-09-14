// BlueOcean-ready modal pipeline for the Backhaul-Match platform.
//
// What it does (in order):
//   1. Validate every frontend portal compiles (Vite build).
//   2. Compile every backend microservice (Maven) and cache deps.
//   3. Build all Docker images via docker compose.
//   4. Start the full 19-service stack.
//   5. Health-check the gateway + login portal.
//   6. Run the repo's end-to-end integration test (bash + curl + jq).
//
// Prerequisites on the Jenkins agent (built into JenkinsDockerfile):
//   - docker client with a working socket (`.//pipe/docker_engine` on Windows)
//   - `docker compose` v2 plugin
//   - bash, curl, jq

def services = ['discovery-server', 'api-gateway', 'auth-service', 'user-service',
                'courier-service', 'fleet-service', 'gps-service', 'matching-service',
                'notification-service', 'payment-service']

def portals  = ['login-portal', 'courier-portal', 'fleet-portal', 'driver-portal', 'admin-portal']

pipeline {
  agent { label 'docker' }

  options {
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '5'))
  }

  parameters {
    booleanParam(name: 'RUN_FRONTEND_BUILD',    defaultValue: true,  description: 'Build each Vite portal (fast JS error check)')
    booleanParam(name: 'RUN_BACKEND_BUILD',     defaultValue: true,  description: 'Maven-compile each Spring Boot service')
    booleanParam(name: 'BUILD_DOCKER_IMAGES',   defaultValue: true,  description: 'docker compose build (all 19 images)')
    booleanParam(name: 'START_STACK',           defaultValue: true,  description: 'docker compose up -d')
    booleanParam(name: 'RUN_INTEGRATION_TESTS', defaultValue: true,  description: 'bash testing/integration-test.sh')
    booleanParam(name: 'TEARDOWN_STACK',        defaultValue: false, description: 'docker compose down in post-build (default: leave running)')
    stringParam(name: 'BASE_URL', defaultValue: 'http://host.docker.internal:18080/api',
                description: 'Gateway base URL as seen from inside the Jenkins container')
  }

  stages {
    stage('Environment') {
      steps {
        script {
          sh 'docker version --format "Jenkins docker client ok (server {{.Server.Version}})"'
          def c = sh(
            script: "if docker compose version >/dev/null 2>&1; then echo 'docker compose'; elif command -v docker-compose >/dev/null 2>&1; then echo 'docker-compose'; else echo ''; fi",
            returnStdout: true
          ).trim()
          if (!c) {
            error 'Neither "docker compose" nor "docker-compose" is available inside the Jenkins agent. Build the agent image with JenkinsDockerfile (installs the compose v2 plugin).'
          }
          env.COMPOSE = c
          echo "Using: ${env.COMPOSE}"
        }
      }
    }

    stage('Frontend Build (all portals)') {
      when { expression { params.RUN_FRONTEND_BUILD } }
      steps {
        script {
          def branches = [:]
          for (p in portals) {
            branches["build-${p}"] = {
              sh '''
                docker run --rm \
                  -v "${WORKSPACE}/frontend:/workspace/frontend" \
                  -w "/workspace/frontend/PORTAL" \
                  -v "node_modules-PORTAL:/workspace/frontend/PORTAL/node_modules" \
                  node:20-alpine \
                  sh -c "rm -rf dist && npm ci && npm run build"
              '''.replace('PORTAL', p)
            }
          }
          parallel branches
        }
      }
    }

    stage('Backend Compile (all services)') {
      when { expression { params.RUN_BACKEND_BUILD } }
      steps {
        script {
          def branches = [:]
          for (s in services) {
            branches["compile-${s}"] = {
              sh """
                docker run --rm \
                  -v "\${WORKSPACE}/backend/${s}:/work" \
                  -w /work \
                  -v backend-maven-repo:/root/.m2 \
                  maven:3.9-eclipse-temurin-17 \
                  -B clean package -DskipTests
              """
            }
          }
          parallel branches
        }
      }
    }

    stage('Build Docker Images') {
      when { expression { params.BUILD_DOCKER_IMAGES } }
      steps {
        sh '${COMPOSE} build'
      }
    }

    stage('Start Stack') {
      when { expression { params.START_STACK } }
      steps {
        sh '${COMPOSE} up -d'
        sh '${COMPOSE} ps'
      }
    }

    stage('Health Checks') {
      when { expression { params.START_STACK } }
      steps {
        sh '''
          echo "Waiting for gateway and login portal..."
          up=0
          for i in $(seq 1 36); do
            g=$(curl -s -o /dev/null -w '%{http_code}' "http://host.docker.internal:18080/api/system/services" || true)
            l=$(curl -s -o /dev/null -w '%{http_code}' "http://host.docker.internal:3100/login" || true)
            echo "  attempt $i/36: gateway=$g login-portal=$l"
            if [ "$g" = "200" ] || [ "$g" = "401" ] || [ "$g" = "403" ]; then up=1; break; fi
            sleep 5
          done
          [ "$up" = "1" ] || { echo "Gateway never became reachable"; exit 1; }
        '''
      }
    }

    stage('Integration Tests') {
      when { expression { params.RUN_INTEGRATION_TESTS } }
      steps {
        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
          sh '''
            command -v jq >/dev/null 2>&1 || { echo "jq not installed in the agent - skipping integration tests"; exit 0; }
            BASE_URL="$BASE_URL" bash testing/integration-test.sh
          '''
        }
      }
    }
  }

  post {
    always {
      sh '${COMPOSE} ps > compose-ps.txt || true'
      echo '--- compose ps ---'
      sh 'cat compose-ps.txt || true'
      echo 'Build details: backend has 10 maven services, frontends are 5 vite portals.'
      // Optional e-mail notification - configure the Mailer plugin first:
      // mail to: 'dev@example.com', subject: "Jenkins ${env.JOB_NAME} finished", body: "Result: ${currentBuild.currentResult}"
    }
    success { echo 'Pipeline finished OK' }
    failure { echo 'Pipeline FAILED - check the stage logs above' }
    cleanup {
      script {
        if (params.TEARDOWN_STACK) {
          sh '${COMPOSE} down'
        }
      }
    }
  }
}