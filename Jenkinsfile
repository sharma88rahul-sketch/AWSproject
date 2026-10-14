pipeline {
    agent any

    environment {
        IMAGE_NAME = 'cicd-demo'
        IMAGE_TAG  = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'ls -la'
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
                sh 'docker images $IMAGE_NAME'
            }
        }
        stage('Deploye docker images'){
           steps {
	      sh 'docker run -d --name app -p 3000:3000 $IMAGE_NAME:$IMAGE_TAG'
		}
	     }
	   }	
    post {
        success {
            echo "Pipeline pass hui. Image: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo 'Pipeline fail hui. Console Output dekho.'
        }
        always {
            sh 'docker image prune -f'
        }
    }
}
