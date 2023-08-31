pipeline {
  agent {
    label 'worker'
  }

  environment {
    REPO_NAME = sh(returnStdout: true, script: 'basename `git remote get-url origin` .git').trim()
    LATEST_AUTHOR = sh(returnStdout: true, script: 'git show -s --pretty=%an').trim()
    LATEST_COMMIT_ID = sh(returnStdout: true, script: 'git describe --tags --long  --always').trim()
    PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"
  }

  stages {

    stage ('Install') {
      steps {
        script {
          echo REPO_NAME
          echo LATEST_AUTHOR
          echo LATEST_COMMIT_ID

          echo env.BRANCH_NAME
          echo env.BUILD_NUMBER
          echo env.TAG_NAME
        }
        nodejs(nodeJSInstallationName: 'NodeJS 18') {
          sh 'npm install'
        }
      }
    }

    stage ('Test') {
      steps {
        nodejs(nodeJSInstallationName: 'NodeJS 18') {
          sh 'ng test --karma-config karma-jenkins.conf.js --code-coverage'
        }
      }
    }

    stage ('Reports and Statistics') {
      steps {
        script {
          def scannerHome = tool 'SonarScanner 4';
          withSonarQubeEnv('sonarcloud GIScience/ohsome') {
            if (env.CHANGE_ID) {
              SONAR_CLI_PARAMETER = " " +
                "-Dsonar.pullrequest.key=${env.CHANGE_ID} " +
                "-Dsonar.pullrequest.branch=${env.CHANGE_BRANCH} " +
                "-Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
            } else {
              SONAR_CLI_PARAMETER = " " +
                "-Dsonar.branch.name=${env.BRANCH_NAME}"
            }
            nodejs('NodeJS 18') {
              sh "${scannerHome}/bin/sonar-scanner " + SONAR_CLI_PARAMETER
            }
          }
        }
      }
    }

    stage ('Build and Deploy INT') {
      when {
        expression {
            return (env.BRANCH_NAME == 'main' && env.TAG_NAME == null )
        }
      }
      steps {
        // TODO fix and replace deployment
        nodejs(nodeJSInstallationName: 'NodeJS 18') {
          sh 'npm run build:int'
        }
        withCredentials([gitUsernamePassword(credentialsId: 'e78912d9-de2f-473c-a1b2-6a2ee82a879a')]) {
          sh 'git config --global user.email "nobody@example.org"'  // TODO remove
          sh 'git config --global user.name "Jenkins"'  // TODO remove
          sh 'rm -rf /tmp/tmp-stats-frontend-git'
          sh 'git clone https://gitlab.gistools.geog.uni-heidelberg.de/giscience/big-data/ohsome/ohsome-now/deployments/stats-frontend.git /tmp/tmp-stats-frontend-git'
          sh 'rm -r /tmp/tmp-stats-frontend-git/*'
          sh 'cp -r dist/* /tmp/tmp-stats-frontend-git/'
          sh "cd /tmp/tmp-stats-frontend-git/ && git add . && git commit -m 'deploy ${LATEST_COMMIT_ID}' --allow-empty && git push"
        }
        echo 'Please redeploy the deployment git manually (for now)!'  // TODO replace
      }
    }

    stage ('Build and Deploy PROD') {
      when {
        expression {
            return (env.BRANCH_NAME != 'main' && env.TAG_NAME)
        }
      }
      steps {
        // TODO fix and replace deployment
        nodejs(nodeJSInstallationName: 'NodeJS 18') {
          sh 'npm run build:prod'
        }
        withCredentials([gitUsernamePassword(credentialsId: 'e78912d9-de2f-473c-a1b2-6a2ee82a879a')]) {
          sh 'git config --global user.email "nobody@example.org"'  // TODO remove
          sh 'git config --global user.name "Jenkins"'  // TODO remove
          sh 'rm -rf /tmp/tmp-stats-frontend-git'
          sh 'git clone https://gitlab.gistools.geog.uni-heidelberg.de/giscience/big-data/ohsome/ohsome-now/deployments/stats-frontend.git /tmp/tmp-stats-frontend-git'
          sh 'rm -r /tmp/tmp-stats-frontend-git/*'
          sh 'cp -r dist/* /tmp/tmp-stats-frontend-git/'
          sh "cd /tmp/tmp-stats-frontend-git/ && git add . && git tag ${env.TAG_NAME} && git commit -m 'deploy ${LATEST_COMMIT_ID}' --allow-empty && git push && git push --tags"
        }
        echo 'Please redeploy the deployment git manually (for now)!'  // TODO replace
      }
    }


    stage ('Report Status') {
      when {
        expression {
          return ((currentBuild.number > 1) && (currentBuild.getPreviousBuild().result == 'FAILURE'))
        }
      }
      steps {
        rocketSend channel: 'jenkinsohsome', emoji: ':sunglasses:', message: "We had some problems, but we are BACK TO NORMAL! Nice debugging: *${REPO_NAME}*-build-nr. ${env.BUILD_NUMBER} *succeeded* on Branch - ${env.BRANCH_NAME}  (<${env.BUILD_URL}|Open Build in Jenkins>). Latest commit from  ${LATEST_AUTHOR}." , rawMessage: true
      }
      post {
        failure {
          rocketSend channel: 'jenkinsohsome', emoji: ':disappointed:', message: "Reporting of *${REPO_NAME}*-build nr. ${env.BUILD_NUMBER} *failed* on Branch - ${env.BRANCH_NAME}  (<${env.BUILD_URL}|Open Build in Jenkins>). Latest commit from  ${LATEST_AUTHOR}." , rawMessage: true
        }
      }
    }
  }

}
