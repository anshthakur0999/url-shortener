pipeline {
    agent any
    
    environment {
        // Docker registry (use Docker Hub or local registry)
        DOCKER_REGISTRY = 'localhost:5000'  // Change to your registry
        IMAGE_NAME = 'url-shortener'
        
        // Kubernetes namespace
        K8S_NAMESPACE = 'url-shortener'
        
        // Build info
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
        
        // Current active environment (will be detected)
        ACTIVE_ENV = ''
        TARGET_ENV = ''
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Detect Active Environment') {
            steps {
                script {
                    echo 'Detecting currently active environment...'
                    def currentSelector = sh(
                        script: "kubectl get service url-shortener-service -n ${K8S_NAMESPACE} -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo 'blue'",
                        returnStdout: true
                    ).trim()
                    
                    ACTIVE_ENV = currentSelector ?: 'blue'
                    TARGET_ENV = (ACTIVE_ENV == 'blue') ? 'green' : 'blue'
                    
                    echo "Current active environment: ${ACTIVE_ENV}"
                    echo "Target deployment environment: ${TARGET_ENV}"
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_TAG}"
                    sh """
                        docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_TAG} .
                        docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    echo "Pushing Docker image to registry..."
                    sh """
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_TAG}
                        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Deploy to Target Environment') {
            steps {
                script {
                    echo "Deploying to ${TARGET_ENV} environment..."
                    
                    // Update the deployment with new image
                    sh """
                        kubectl set image deployment/url-shortener-${TARGET_ENV} \
                            url-shortener=${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_TAG} \
                            -n ${K8S_NAMESPACE}
                        
                        # Wait for rollout to complete
                        kubectl rollout status deployment/url-shortener-${TARGET_ENV} -n ${K8S_NAMESPACE} --timeout=5m
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "Running health checks on ${TARGET_ENV} environment..."
                    
                    // Wait for pods to be ready
                    sh """
                        kubectl wait --for=condition=ready pod \
                            -l app=url-shortener,version=${TARGET_ENV} \
                            -n ${K8S_NAMESPACE} \
                            --timeout=300s
                    """
                    
                    // Get service endpoint for testing
                    def podName = sh(
                        script: "kubectl get pods -n ${K8S_NAMESPACE} -l app=url-shortener,version=${TARGET_ENV} -o jsonpath='{.items[0].metadata.name}'",
                        returnStdout: true
                    ).trim()
                    
                    // Port forward and test
                    sh """
                        kubectl port-forward ${podName} 8080:3000 -n ${K8S_NAMESPACE} &
                        PF_PID=\$!
                        sleep 5
                        
                        # Test health endpoint
                        curl -f http://localhost:8080/api/urls || exit 1
                        
                        # Kill port-forward
                        kill \$PF_PID || true
                    """
                    
                    echo "Health check passed for ${TARGET_ENV} environment!"
                }
            }
        }
        
        stage('Switch Traffic') {
            steps {
                script {
                    echo "Switching traffic from ${ACTIVE_ENV} to ${TARGET_ENV}..."
                    
                    // Update service selector to point to new environment
                    sh """
                        kubectl patch service url-shortener-service \
                            -n ${K8S_NAMESPACE} \
                            -p '{"spec":{"selector":{"version":"${TARGET_ENV}"}}}'
                    """
                    
                    echo "Traffic successfully switched to ${TARGET_ENV}!"
                    echo "Previous environment ${ACTIVE_ENV} is still running for rollback if needed."
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    echo "Verifying deployment..."
                    sleep 10  // Wait for traffic to stabilize
                    
                    // Final verification
                    sh """
                        kubectl get service url-shortener-service -n ${K8S_NAMESPACE}
                        kubectl get pods -n ${K8S_NAMESPACE} -l app=url-shortener
                    """
                    
                    echo "Deployment verified successfully!"
                }
            }
        }
    }
    
    post {
        success {
            echo """
            ========================================
            DEPLOYMENT SUCCESSFUL!
            ========================================
            Active Environment: ${TARGET_ENV}
            Build Tag: ${BUILD_TAG}
            Previous Environment: ${ACTIVE_ENV} (available for rollback)
            
            To rollback, run:
            kubectl patch service url-shortener-service -n ${K8S_NAMESPACE} -p '{"spec":{"selector":{"version":"${ACTIVE_ENV}"}}}'
            ========================================
            """
        }
        
        failure {
            echo """
            ========================================
            DEPLOYMENT FAILED!
            ========================================
            Failed to deploy to ${TARGET_ENV}
            Active environment remains: ${ACTIVE_ENV}
            
            Check logs:
            kubectl logs -n ${K8S_NAMESPACE} -l app=url-shortener,version=${TARGET_ENV}
            ========================================
            """
        }
        
        always {
            // Clean up old Docker images (keep last 5)
            sh """
                docker images ${DOCKER_REGISTRY}/${IMAGE_NAME} --format '{{.Tag}}' | \
                tail -n +6 | \
                xargs -r -I {} docker rmi ${DOCKER_REGISTRY}/${IMAGE_NAME}:{} || true
            """
        }
    }
}

