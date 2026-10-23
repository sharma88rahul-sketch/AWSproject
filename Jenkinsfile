pipeline {
    agent any

    environment {
        AWS_REGION  = 'ap-south-1'
        ACCOUNT_ID  = '589138972399'
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_NAME  = 'cicd-demo'
        IMAGE_TAG   = "${BUILD_NUMBER}"
        ECR_IMAGE   = "${ECR_REGISTRY}/${IMAGE_NAME}"
        // ---- naye ----
        ECS_CLUSTER  = 'cicd-demo-cluster'
        ECS_SERVICE  = 'cicd-demo-service'
        TASK_FAMILY  = 'cicd-demo-task'
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
         stage('Deploy to ECS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecr-creds'
                ]]) {
                    sh '''
                        set -e

                        # 1. Abhi ka task definition padho
                        aws ecs describe-task-definition \
                          --task-definition $TASK_FAMILY \
                          --region $AWS_REGION \
                          --query taskDefinition > current-td.json

                        # 2. Sirf image badlo, aur read-only fields hata do
                        jq --arg IMG "$ECR_IMAGE:$IMAGE_TAG" '
                          .containerDefinitions[0].image = $IMG
                          | del(.taskDefinitionArn, .revision, .status,
                                .requiresAttributes, .compatibilities,
                                .registeredAt, .registeredBy)
                        ' current-td.json > new-td.json

                        # 3. Naya revision register
                        NEW_TD_ARN=$(aws ecs register-task-definition \
                          --cli-input-json file://new-td.json \
                          --region $AWS_REGION \
                          --query taskDefinition.taskDefinitionArn \
                          --output text)
                        echo "Naya task definition: $NEW_TD_ARN"

                        # 4. Service ko naye revision pe update karo
                        aws ecs update-service \
                          --cluster $ECS_CLUSTER \
                          --service $ECS_SERVICE \
                          --task-definition $NEW_TD_ARN \
                          --region $AWS_REGION > /dev/null

                        # 5. Rolling update khatam hone tak wait
                        aws ecs wait services-stable \
                          --cluster $ECS_CLUSTER \
                          --services $ECS_SERVICE \
                          --region $AWS_REGION

                        echo "Deploy complete: $ECR_IMAGE:$IMAGE_TAG"
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
