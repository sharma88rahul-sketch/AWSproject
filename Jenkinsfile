pipeline {
    agent any

    environment {
        AWS_REGION  = 'ap-south-1'
        ACCOUNT_ID  = '589138972399'
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_NAME  = 'cicd-demo'
        IMAGE_TAG   = "${BUILD_NUMBER}"
        ECR_IMAGE   = "${ECR_REGISTRY}/${IMAGE_NAME}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecr-creds'
                ]]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_REGION | \
                          docker login --username AWS --password-stdin $ECR_REGISTRY

                        docker tag $IMAGE_NAME:$IMAGE_TAG $ECR_IMAGE:$IMAGE_TAG
                        docker push $ECR_IMAGE:$IMAGE_TAG
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Push ho gayi: ${ECR_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo 'Pipeline fail hui. Console Output dekho.'
        }
        always {
            sh '''
                docker rmi $IMAGE_NAME:$IMAGE_TAG || true
                docker rmi $ECR_IMAGE:$IMAGE_TAG || true
                docker logout $ECR_REGISTRY || true
                docker image prune -f
            '''
        }
    }
}
