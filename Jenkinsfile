pipeline {
    agent any
    stages {
        stage('Deploy Vendor Panel Backend Dev') {
            steps {
                script {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@143.110.184.203<<EOF
                    cd Vendor-Node.js
                    ./deploy.sh
EOF
                    '''
                }
            }
        }
    }
}

